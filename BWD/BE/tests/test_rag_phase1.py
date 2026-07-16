import json
import sys
import unittest
from pathlib import Path
from unittest import mock


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from evaluation.run_rag_eval import flatten_questions, validate_dataset
from utils.rag_privacy import hash_question, redact_question
import services.rag_analytics_service as analytics


class RagDatasetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        dataset_path = BASE_DIR / "evaluation" / "rag_eval_dataset.json"
        cls.dataset = json.loads(dataset_path.read_text(encoding="utf-8"))

    def test_dataset_has_at_least_100_unique_questions(self):
        stats = validate_dataset(self.dataset)
        self.assertGreaterEqual(stats["questions"], 100)
        rows = flatten_questions(self.dataset)
        self.assertEqual(len(rows), len({row["question_id"] for row in rows}))

    def test_each_question_inherits_reference_and_label(self):
        for row in flatten_questions(self.dataset):
            self.assertIsInstance(row["answerable"], bool)
            self.assertTrue(row["reference_answer"].strip())
            if row["answerable"]:
                self.assertTrue(row["expected_sources"])
            else:
                self.assertEqual(row["expected_sources"], [])


class RagPrivacyTests(unittest.TestCase):
    def test_redacts_common_sensitive_values(self):
        question = (
            "Email an.nguyen@example.com, SĐT 0912 345 678, "
            "mật khẩu là SieuBiMat và token sk-1234567890abcdefghij"
        )
        redacted = redact_question(question)
        self.assertNotIn("an.nguyen@example.com", redacted)
        self.assertNotIn("0912 345 678", redacted)
        self.assertNotIn("SieuBiMat", redacted)
        self.assertNotIn("sk-1234567890abcdefghij", redacted)
        self.assertIn("[email]", redacted)
        self.assertIn("[phone]", redacted)
        self.assertIn("[secret]", redacted)

    def test_question_hash_is_normalized_and_stable(self):
        self.assertEqual(
            hash_question("  Trống đồng là gì? "),
            hash_question("trống   đồng LÀ gì?"),
        )
        self.assertEqual(len(hash_question("x")), 64)


class RagAnalyticsTests(unittest.TestCase):
    @mock.patch("services.rag_analytics_service.rag_log_repo.create_interaction_log")
    def test_log_is_anonymous_redacted_and_contains_scores(self, create_log):
        create_log.return_value = {"interaction_id": "ignored"}
        interaction_id = analytics.record_interaction(
            question="Email tôi là user@example.com, mật khẩu là abc123",
            chunks=[
                {
                    "source": "knowledge/dong_son/trong_dong.md",
                    "title": "Trống đồng Đông Sơn",
                    "content": "Nội dung đầy đủ không được ghi log",
                    "distance": 0.8,
                    "keyword_score": 0.6,
                    "rank_score": 1.1,
                    "section_index": 1,
                    "chunk_index": 0,
                }
            ],
            latency_ms=125.8,
            fallback=False,
            fallback_reason=None,
        )

        self.assertIsNotNone(interaction_id)
        kwargs = create_log.call_args.kwargs
        self.assertNotIn("user@example.com", kwargs["question_redacted"])
        self.assertNotIn("abc123", kwargs["question_redacted"])
        self.assertNotIn("content", kwargs["retrieval_chunks"][0])
        self.assertEqual(kwargs["retrieval_chunks"][0]["rank_score"], 1.1)
        self.assertNotIn("user_id", kwargs)
        self.assertNotIn("ip", kwargs)

    @mock.patch("services.rag_analytics_service.rag_log_repo.save_feedback")
    def test_feedback_uses_interaction_id_without_identity(self, save_feedback):
        interaction_id = "7c4c1808-9631-4ced-a0dd-7cebf10d52c4"
        save_feedback.return_value = {
            "interaction_id": interaction_id,
            "helpful": True,
            "feedback_reason": None,
        }
        result = analytics.record_feedback(
            {"interaction_id": interaction_id, "helpful": True}
        )
        self.assertTrue(result["helpful"])
        save_feedback.assert_called_once_with(interaction_id, True, None)

    def test_feedback_rejects_invalid_payload(self):
        with self.assertRaises(analytics.RagFeedbackError):
            analytics.record_feedback({"interaction_id": "not-a-uuid", "helpful": "yes"})


if __name__ == "__main__":
    unittest.main()
