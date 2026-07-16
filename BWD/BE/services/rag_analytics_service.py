import logging
import os
import uuid

import repositories.rag_log_repo as rag_log_repo
from utils.rag_privacy import hash_question, redact_question


LOGGER = logging.getLogger(__name__)
MAX_FEEDBACK_REASON_LENGTH = 500


class RagFeedbackError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code


def logging_enabled():
    return os.getenv("RAG_LOGGING_ENABLED", "true").strip().lower() not in {
        "0",
        "false",
        "no",
        "off",
    }


def summarize_chunks(chunks):
    return [
        {
            "source": chunk.get("source"),
            "title": chunk.get("title"),
            "section_index": chunk.get("section_index"),
            "chunk_index": chunk.get("chunk_index"),
            "distance": chunk.get("distance"),
            "keyword_score": chunk.get("keyword_score"),
            "rank_score": chunk.get("rank_score"),
            "semantic_score": chunk.get("semantic_score"),
            "bm25_score": chunk.get("bm25_score"),
            "rerank_score": chunk.get("rerank_score"),
            "confidence": chunk.get("confidence"),
            "intent": chunk.get("intent"),
            "source_intent": chunk.get("source_intent"),
            "heading_path": chunk.get("heading_path"),
            "corpus": chunk.get("corpus"),
            "knowledge_version": chunk.get("knowledge_version"),
            "collection_version": chunk.get("collection_version"),
        }
        for chunk in (chunks or [])
    ]


def record_interaction(question, chunks, latency_ms, fallback, fallback_reason):
    interaction_id = str(uuid.uuid4())
    if not logging_enabled():
        return None

    best_score = chunks[0].get("rank_score") if chunks else None
    try:
        rag_log_repo.create_interaction_log(
            interaction_id=interaction_id,
            question_redacted=redact_question(question),
            question_hash=hash_question(question),
            retrieval_chunks=summarize_chunks(chunks),
            best_score=best_score,
            latency_ms=max(0, int(latency_ms)),
            fallback=bool(fallback),
            fallback_reason=fallback_reason,
        )
    except Exception:
        # Analytics khong duoc lam hong cau tra loi chinh.
        LOGGER.exception("Khong ghi duoc log tuong tac RAG")
        return None

    return interaction_id


def record_feedback(data):
    interaction_id = str(data.get("interaction_id") or "").strip()
    helpful = data.get("helpful")
    reason = str(data.get("reason") or "").strip()

    try:
        uuid.UUID(interaction_id)
    except (ValueError, AttributeError):
        raise RagFeedbackError("interaction_id không hợp lệ.")

    if not isinstance(helpful, bool):
        raise RagFeedbackError("helpful phải là true hoặc false.")

    if len(reason) > MAX_FEEDBACK_REASON_LENGTH:
        raise RagFeedbackError("Lý do phản hồi tối đa 500 ký tự.")

    if not logging_enabled():
        raise RagFeedbackError("Chức năng ghi nhận phản hồi đang tắt.", 503)

    try:
        row = rag_log_repo.save_feedback(interaction_id, helpful, reason or None)
    except Exception as error:
        LOGGER.exception("Khong ghi duoc phan hoi RAG")
        raise RagFeedbackError("Chưa thể ghi nhận phản hồi lúc này.", 503) from error

    if not row:
        raise RagFeedbackError("Không tìm thấy lượt chat cần phản hồi.", 404)

    return {
        "message": "Đã ghi nhận phản hồi. Cảm ơn bạn!",
        "interaction_id": row["interaction_id"],
        "helpful": row["helpful"],
    }
