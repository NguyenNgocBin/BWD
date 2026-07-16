import os
import sys
import unittest
from pathlib import Path
from unittest import mock


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from services.conversation_service import (
    ConversationHistoryError,
    normalize_history,
    rewrite_follow_up_question,
)
from services.llm_service import (
    LLMError,
    _generate_with_gemini,
    _resolve_model_name,
    build_rag_prompt,
    validate_answer_citations,
)
from services.rag_service import build_rag_context, build_sources, select_citation_chunks


def chunk(
    source="knowledge/artifacts/ngoc_lu.md",
    title="Đặc điểm nổi bật",
    document_title="Trống đồng Ngọc Lũ",
    content="Trung tâm mặt trống là ngôi sao 14 cánh.",
    confidence=0.9,
    filename="ngoc_lu.md",
):
    return {
        "content": content,
        "source": source,
        "title": title,
        "document_title": document_title,
        "filename": filename,
        "section_index": 1,
        "chunk_index": 0,
        "distance": 0.1,
        "confidence": confidence,
        "document_confidence": "high",
        "review_status": "expert_verified",
        "references": '["https://example.test/reference"]',
        "knowledge_version": "knowledge-v3-test",
        "collection_version": "rag-v3-test",
        "corpus_checksum": "a" * 64,
        "type": "rag_chunk_v3",
    }


class ConversationHistoryTests(unittest.TestCase):
    def test_follow_up_is_rewritten_from_latest_user_entity_offline(self):
        history = normalize_history(
            [
                {"role": "user", "content": "Trống Ngọc Lũ có gì nổi bật?"},
                {"role": "assistant", "content": "Một câu trả lời có thể sai."},
            ]
        )
        rewritten, changed = rewrite_follow_up_question(
            "Nó được phát hiện ở đâu?",
            history,
        )
        self.assertTrue(changed)
        self.assertIn("trống đồng Ngọc Lũ", rewritten)
        self.assertNotIn("có thể sai", rewritten)

    def test_history_is_short_and_invalid_shape_is_rejected(self):
        items = [
            {"role": "user", "content": f"Câu {index}"}
            for index in range(10)
        ]
        self.assertEqual(len(normalize_history(items)), 6)
        with self.assertRaises(ConversationHistoryError):
            normalize_history({"role": "user", "content": "Sai kiểu"})
        with self.assertRaises(ConversationHistoryError):
            normalize_history([{"role": "user", "content": {"not": "text"}}])


class CitationAndSourceTests(unittest.TestCase):
    def test_citation_validation_requires_real_context_ids(self):
        self.assertTrue(validate_answer_citations("Dữ kiện [1], bổ sung [2].", 2))
        self.assertFalse(validate_answer_citations("Dữ kiện không nguồn.", 2))
        self.assertFalse(validate_answer_citations("Dữ kiện [3].", 2))

    def test_prompt_lists_only_available_source_codes(self):
        prompt = build_rag_prompt("Câu hỏi", "[1] Nguồn A", source_count=2)
        self.assertIn("[1], [2]", prompt)
        self.assertNotIn("[3]", prompt)

    def test_sources_and_context_share_deduplicated_max_three_chunks(self):
        chunks = [
            chunk(),
            chunk(title="Giá trị", content="Một chunk khác cùng tài liệu."),
            chunk(
                source="knowledge/artifacts/hoang_ha.md",
                filename="hoang_ha.md",
                document_title="Trống đồng Hoàng Hạ",
            ),
            chunk(
                source="knowledge/website/tro_choi.md",
                filename="tro_choi.md",
                document_title="Trang Trò chơi và luật chơi",
            ),
            chunk(
                source="knowledge/dong_son/heger.md",
                filename="heger.md",
                document_title="Phân loại Heger",
            ),
        ]
        selected = select_citation_chunks(chunks)
        context = build_rag_context(selected)
        sources = build_sources(selected)
        self.assertEqual(len(selected), 3)
        self.assertEqual([source["id"] for source in sources], [1, 2, 3])
        self.assertEqual(context.count("\n["), 2)
        self.assertEqual(sources[0]["url"], "/pages/hien-vat.html?id=ngoc-lu")
        self.assertEqual(sources[2]["url"], "/pages/trochoi.html")
        self.assertLessEqual(len(sources[0]["excerpt"]), 360)
        self.assertNotIn("source", sources[0])
        self.assertNotIn("distance", sources[0])

    def test_sections_from_the_same_document_are_merged_into_one_source(self):
        chunks = [
            chunk(title="Ai xây dựng?", content="Hệ thống gắn với Franz Heger."),
            chunk(
                title="Phân loại Heger là gì?",
                content="Hệ thống chia trống đồng thành bốn nhóm.",
            ),
        ]

        selected = select_citation_chunks(chunks)

        self.assertEqual(len(selected), 1)
        self.assertIn("Franz Heger", selected[0]["content"])
        self.assertIn("chia trống đồng thành bốn nhóm", selected[0]["content"])
        sources = build_sources(selected)
        self.assertEqual(len(sources), 1)
        self.assertNotIn("##", sources[0]["excerpt"])


class ChatServicePhase4Tests(unittest.TestCase):
    def test_non_string_question_is_a_user_error(self):
        from services.chat_service import ChatError, ask_chatbot

        with self.assertRaises(ChatError) as raised:
            ask_chatbot({"question": ["không", "hợp lệ"]}, request_id="req-invalid")
        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(raised.exception.error_code, "invalid_question")

    @mock.patch("services.chat_service.get_chat_status")
    @mock.patch("services.chat_service.rag_analytics_service.record_interaction")
    @mock.patch("services.chat_service.generate_answer")
    @mock.patch("services.chat_service.search_relevant_chunks")
    def test_history_retrieves_again_and_success_has_cited_sources_without_context(
        self,
        search_chunks,
        generate_answer,
        record_interaction,
        get_status,
    ):
        from services.chat_service import ask_chatbot

        search_chunks.return_value = [chunk()]
        generate_answer.return_value = "Ngọc Lũ có ngôi sao 14 cánh [1]."
        record_interaction.return_value = "00000000-0000-0000-0000-000000000001"
        get_status.return_value = {}

        with mock.patch.dict(os.environ, {"CHAT_INCLUDE_CONTEXT": "false"}):
            result = ask_chatbot(
                {
                    "question": "Nó có hoa văn gì?",
                    "history": [
                        {"role": "user", "content": "Hãy nói về trống Ngọc Lũ"},
                        {"role": "assistant", "content": "Bạn muốn biết phần nào?"},
                    ],
                },
                request_id="req-phase4",
            )

        retrieval_question = search_chunks.call_args.args[0]
        self.assertIn("trống đồng Ngọc Lũ", retrieval_question)
        self.assertTrue(result["query_rewritten"])
        self.assertIsNone(result["context"])
        self.assertFalse(result["fallback"])
        self.assertEqual(result["sources"][0]["citation"], "[1]")
        self.assertEqual(result["request_id"], "req-phase4")
        self.assertGreaterEqual(len(result["suggested_questions"]), 2)
        generate_answer.assert_called_once()

    @mock.patch("services.chat_service.get_chat_status", return_value={})
    @mock.patch("services.chat_service.rag_analytics_service.record_interaction")
    @mock.patch("services.chat_service.generate_answer")
    @mock.patch("services.chat_service.search_relevant_chunks")
    def test_low_confidence_does_not_call_llm(
        self,
        search_chunks,
        generate_answer,
        record_interaction,
        _get_status,
    ):
        from services.chat_service import ask_chatbot

        search_chunks.return_value = [chunk(confidence=0.1)]
        record_interaction.return_value = None
        result = ask_chatbot({"question": "Trống đồng này là gì?"})
        self.assertTrue(result["fallback"])
        self.assertEqual(result["fallback_reason"], "insufficient_context")
        self.assertEqual(result["sources"], [])
        self.assertGreaterEqual(len(result["suggested_questions"]), 2)
        generate_answer.assert_not_called()

    @mock.patch("services.chat_service.get_chat_status", return_value={})
    @mock.patch("services.chat_service.rag_analytics_service.record_interaction")
    @mock.patch("services.chat_service.generate_answer")
    @mock.patch("services.chat_service.search_relevant_chunks")
    def test_missing_or_out_of_range_citation_rejects_generated_answer(
        self,
        search_chunks,
        generate_answer,
        record_interaction,
        _get_status,
    ):
        from services.chat_service import ask_chatbot

        search_chunks.return_value = [chunk()]
        generate_answer.return_value = "Câu này tự tạo nguồn [2]."
        record_interaction.return_value = None
        result = ask_chatbot({"question": "Trống Ngọc Lũ có gì nổi bật?"})
        self.assertTrue(result["fallback"])
        self.assertEqual(result["fallback_reason"], "invalid_citations")
        self.assertNotIn("tự tạo nguồn", result["answer"])

    @mock.patch("services.chat_service.rag_analytics_service.record_interaction")
    @mock.patch("services.chat_service.search_relevant_chunks")
    def test_rag_error_is_short_and_does_not_expose_provider_detail(
        self,
        search_chunks,
        record_interaction,
    ):
        from services.chat_service import ChatError, ask_chatbot
        from services.rag_service import RagSearchError

        search_chunks.side_effect = RagSearchError("secret path and provider detail")
        record_interaction.return_value = None
        with self.assertRaises(ChatError) as raised:
            ask_chatbot({"question": "Trống đồng là gì?"}, request_id="req-error")
        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(
            raised.exception.error_code,
            "chat_temporarily_unavailable",
        )
        self.assertNotIn("secret", raised.exception.message)

    @mock.patch("services.llm_service._post_json")
    def test_free_tier_failure_is_not_retried_across_keys(self, post_json):
        post_json.side_effect = LLMError("quota", code="provider_quota")
        with mock.patch.dict(os.environ, {"GEMINI_API_KEYS": "key-one,key-two"}):
            with self.assertRaises(LLMError):
                _generate_with_gemini("prompt")
        post_json.assert_called_once()

    @mock.patch("services.llm_service._post_json")
    def test_stable_25_flash_is_not_remapped_and_disables_thinking(self, post_json):
        post_json.return_value = {
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {"parts": [{"text": "Câu trả lời [1]."}]},
                }
            ]
        }
        with mock.patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "gemini-2.5-flash"},
            clear=False,
        ):
            self.assertEqual(_resolve_model_name(), "gemini-2.5-flash")
            self.assertEqual(_generate_with_gemini("prompt"), "Câu trả lời [1].")

        url = post_json.call_args.kwargs["url"]
        payload = post_json.call_args.kwargs["payload"]
        self.assertIn("/gemini-2.5-flash:generateContent", url)
        self.assertEqual(
            payload["generationConfig"]["thinkingConfig"],
            {"thinkingBudget": 0},
        )
        self.assertGreaterEqual(payload["generationConfig"]["maxOutputTokens"], 1024)

    @mock.patch("services.llm_service._post_json")
    def test_truncated_provider_response_is_rejected_before_citation_check(self, post_json):
        post_json.return_value = {
            "candidates": [
                {
                    "finishReason": "MAX_TOKENS",
                    "content": {"parts": [{"text": "Câu bị cắt ngang"}]},
                }
            ]
        }
        with mock.patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}, clear=False):
            with self.assertRaises(LLMError) as raised:
                _generate_with_gemini("prompt")
        self.assertEqual(raised.exception.code, "provider_truncated_response")


class ChatControllerPhase4Tests(unittest.TestCase):
    @mock.patch("controllers.chat_controller.chat_service.ask_chatbot")
    def test_public_error_has_trace_id_and_no_internal_detail(self, ask_chatbot):
        import flask
        from controllers import chat_controller
        from services.chat_service import ChatError

        ask_chatbot.side_effect = ChatError(
            "Chatbot tạm thời chưa thể tra cứu. Vui lòng thử lại sau.",
            503,
            "chat_temporarily_unavailable",
            "request-test",
        )
        app = flask.Flask(__name__)
        with app.test_request_context(
            "/api/v1/chat/ask",
            method="POST",
            json={"question": "Trống đồng là gì?"},
            headers={"X-Request-ID": "request-test"},
        ):
            response, status = chat_controller.ask()

        payload = response.get_json()
        self.assertEqual(status, 503)
        self.assertEqual(payload["request_id"], "request-test")
        self.assertEqual(payload["error_code"], "chat_temporarily_unavailable")
        self.assertNotIn("detail", payload)
        self.assertEqual(response.headers["X-Request-ID"], "request-test")


if __name__ == "__main__":
    unittest.main()
