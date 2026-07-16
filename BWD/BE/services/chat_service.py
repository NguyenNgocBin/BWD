import logging
import os
import time
import uuid

from services.conversation_service import (
    ConversationHistoryError,
    normalize_history,
    rewrite_follow_up_question,
)
from services.llm_service import (
    CITATION_ERROR_ANSWER,
    FALLBACK_ANSWER,
    LLMError,
    generate_answer,
    has_good_context,
    validate_answer_citations,
)
import services.rag_analytics_service as rag_analytics_service
from services.query_understanding_service import (
    INTENT_ACCOUNT_GAME,
    INTENT_ARTIFACT,
    INTENT_WEBSITE,
    understand_query,
)
from services.rag_service import (
    RagSearchError,
    build_rag_context,
    build_sources,
    retrieval_version,
    search_relevant_chunks,
    select_citation_chunks,
)


LOGGER = logging.getLogger(__name__)


class ChatError(Exception):
    def __init__(
        self,
        message,
        status_code=400,
        error_code="invalid_request",
        request_id=None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.request_id = request_id


def get_chat_status(check_source=True):
    version = retrieval_version()
    if version == "v3":
        from services.collection_manifest_service import get_knowledge_status

        return get_knowledge_status(check_source=check_source)
    return {
        "retrieval_version": version,
        "ready": True,
        "in_sync": None,
        "knowledge_version": None,
        "collection_version": version,
        "message": "Legacy/V2 không có manifest knowledge V3.",
    }


def _log_technical_error(error_code, provider, request_id, started_at, error):
    latency_ms = max(0, int((time.perf_counter() - started_at) * 1000))
    LOGGER.exception(
        "chat_technical_error code=%s provider=%s latency_ms=%s request_id=%s detail=%s",
        error_code,
        provider,
        latency_ms,
        request_id,
        error,
    )


def build_answer(
    question,
    context_text,
    chunks,
    source_count=None,
    request_id=None,
    started_at=None,
):
    """Generate one grounded answer and reject missing/fabricated citations."""

    if not chunks or not has_good_context(chunks):
        return FALLBACK_ANSWER, True, "insufficient_context"

    started_at = started_at or time.perf_counter()
    request_id = request_id or "unknown"
    source_count = source_count or len(chunks)
    try:
        answer = generate_answer(question, context_text, source_count=source_count)
    except LLMError as error:
        _log_technical_error(
            error.code,
            error.provider,
            request_id,
            started_at,
            error,
        )
        return (
            "Chatbot tạm thời chưa thể tạo câu trả lời. Bạn có thể xem nguồn bên dưới hoặc thử lại sau.",
            True,
            "llm_error",
        )

    if not validate_answer_citations(answer, source_count):
        LOGGER.warning(
            "chat_answer_rejected code=invalid_citations provider=gemini latency_ms=%s request_id=%s",
            max(0, int((time.perf_counter() - started_at) * 1000)),
            request_id,
        )
        return CITATION_ERROR_ANSWER, True, "invalid_citations"
    return answer, False, None


_ARTIFACT_SUGGESTIONS = {
    "ngoc_lu": [
        "Trống Ngọc Lũ có những hoa văn nổi bật nào?",
        "Trống Ngọc Lũ được phát hiện ở đâu?",
        "Vì sao trống Ngọc Lũ được xem là hiện vật tiêu biểu?",
    ],
    "hoang_ha": [
        "Trống Hoàng Hạ được phát hiện khi nào?",
        "Hoa văn trống Hoàng Hạ có gì nổi bật?",
        "Trống Hoàng Hạ giống trống Ngọc Lũ ở điểm nào?",
    ],
    "co_loa": [
        "Trống Cổ Loa được phát hiện trong bối cảnh nào?",
        "Trống Cổ Loa có đặc điểm gì nổi bật?",
        "Trống Cổ Loa có ý nghĩa gì với không gian Âu Lạc?",
    ],
    "tan_long": [
        "Trống Tân Long thuộc loại Heger nào?",
        "Trống Tân Long được phát hiện ở đâu?",
        "Đặc điểm trang trí của trống Tân Long là gì?",
    ],
}


def suggest_questions(query_info, fallback=False):
    entities = query_info.get("entities") or []
    for entity in entities:
        if entity in _ARTIFACT_SUGGESTIONS:
            return _ARTIFACT_SUGGESTIONS[entity][:3]

    intent = query_info.get("intent")
    if intent == INTENT_ACCOUNT_GAME:
        return [
            "Làm thế nào để đăng ký và đăng nhập tài khoản?",
            "Điểm trò chơi được lưu như thế nào?",
            "Làm sao xem bảng xếp hạng?",
        ]
    if intent == INTENT_WEBSITE:
        return [
            "Tôi có thể xem hồ sơ hiện vật ở đâu?",
            "Trang triển lãm 3D sử dụng như thế nào?",
            "Người mới nên bắt đầu học từ trang nào?",
        ]
    if intent == INTENT_ARTIFACT:
        return [
            "Trống Ngọc Lũ có gì nổi bật?",
            "Trống Hoàng Hạ được phát hiện ở đâu?",
            "Trống Tân Long thuộc loại Heger nào?",
        ]
    return [
        "Trống đồng Đông Sơn là gì?",
        "Trống đồng Đông Sơn được đúc như thế nào?",
        "Hệ thống phân loại Heger là gì?",
    ][: 3 if fallback else 2]


def _include_full_context():
    app_env = (os.getenv("APP_ENV") or os.getenv("FLASK_ENV") or "").strip().lower()
    if app_env in {"prod", "production"}:
        return False
    return os.getenv("CHAT_INCLUDE_CONTEXT", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _trusted_citation_chunks(chunks):
    trusted = [chunk for chunk in (chunks or []) if has_good_context([chunk])]
    return select_citation_chunks(trusted, max_sources=3)


def ask_chatbot(data, request_id=None):
    started_at = time.perf_counter()
    request_id = request_id or str(uuid.uuid4())
    if not isinstance(data, dict):
        raise ChatError(
            "Yêu cầu không hợp lệ.",
            400,
            "invalid_request",
            request_id,
        )

    raw_question = data.get("question")
    if raw_question is not None and not isinstance(raw_question, str):
        raise ChatError(
            "Câu hỏi không hợp lệ.",
            400,
            "invalid_question",
            request_id,
        )
    question = (raw_question or "").strip()
    top_k = data.get("top_k", 5)
    if not question:
        raise ChatError(
            "Vui lòng nhập câu hỏi.",
            400,
            "empty_question",
            request_id,
        )
    if len(question) > 1000:
        raise ChatError(
            "Câu hỏi quá dài. Vui lòng nhập dưới 1000 ký tự.",
            400,
            "question_too_long",
            request_id,
        )

    try:
        history = normalize_history(data.get("history"))
    except ConversationHistoryError as error:
        raise ChatError(
            str(error),
            400,
            "invalid_history",
            request_id,
        ) from error

    retrieval_question, query_rewritten = rewrite_follow_up_question(question, history)
    query_info = understand_query(retrieval_question)
    try:
        top_k = max(1, min(int(top_k), 10))
    except (TypeError, ValueError):
        top_k = 5

    try:
        retrieved_chunks = search_relevant_chunks(retrieval_question, top_k=top_k)
    except RagSearchError as error:
        latency_ms = (time.perf_counter() - started_at) * 1000
        rag_analytics_service.record_interaction(
            question=question,
            chunks=[],
            latency_ms=latency_ms,
            fallback=True,
            fallback_reason="rag_error",
        )
        _log_technical_error(
            "rag_search_failed",
            "rag",
            request_id,
            started_at,
            error,
        )
        raise ChatError(
            "Chatbot tạm thời chưa thể tra cứu. Vui lòng thử lại sau.",
            503,
            "chat_temporarily_unavailable",
            request_id,
        ) from error

    citation_chunks = _trusted_citation_chunks(retrieved_chunks)
    context_text = build_rag_context(citation_chunks)
    answer, fallback, fallback_reason = build_answer(
        retrieval_question,
        context_text,
        citation_chunks,
        source_count=len(citation_chunks),
        request_id=request_id,
        started_at=started_at,
    )
    if fallback and query_info.get("rejection_reason"):
        fallback_reason = query_info["rejection_reason"]

    interaction_id = rag_analytics_service.record_interaction(
        question=question,
        chunks=retrieved_chunks,
        latency_ms=(time.perf_counter() - started_at) * 1000,
        fallback=fallback,
        fallback_reason=fallback_reason,
    )

    # Keep version metadata tied to the exact collection snapshot that produced
    # the chunks. A watcher may activate a newer build during answer generation.
    retrieval_snapshot = retrieved_chunks[0] if retrieved_chunks else {}
    snapshot_complete = all(
        retrieval_snapshot.get(key)
        for key in ("knowledge_version", "collection_version", "corpus_checksum")
    )
    knowledge_status = {} if snapshot_complete else get_chat_status(check_source=False)
    return {
        "answer": answer,
        "question": question,
        # Kept as a nullable compatibility field. Production does not receive
        # full RAG context unless the server explicitly enables it.
        "context": context_text if _include_full_context() else None,
        "sources": build_sources(citation_chunks),
        "suggested_questions": suggest_questions(query_info, fallback=fallback),
        "fallback": fallback,
        "fallback_reason": fallback_reason,
        "interaction_id": interaction_id,
        "request_id": request_id,
        "query_rewritten": query_rewritten,
        "retrieval_question": retrieval_question if query_rewritten else question,
        "intent": query_info["intent"],
        "retrieval_version": retrieval_version(),
        "knowledge_version": retrieval_snapshot.get("knowledge_version")
        or knowledge_status.get("knowledge_version"),
        "collection_version": retrieval_snapshot.get("collection_version")
        or knowledge_status.get("collection_version"),
        "corpus_checksum": retrieval_snapshot.get("corpus_checksum")
        or knowledge_status.get("corpus_checksum"),
    }
