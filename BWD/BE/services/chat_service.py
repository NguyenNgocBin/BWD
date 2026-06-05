from services.llm_service import (
    FALLBACK_ANSWER,
    LLMError,
    generate_answer,
    has_good_context,
)
from services.rag_service import (
    RagSearchError,
    build_rag_context,
    build_sources,
    search_relevant_chunks,
)


class ChatError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code


def build_answer(question, context_text, chunks):
    """
    Sinh câu trả lời bằng LLM theo mô hình RAG:
    - Search top chunks trong ChromaDB.
    - Kiểm tra context có đủ tốt không.
    - Gửi context + question vào Gemini/OpenAI.
    - Nếu context yếu hoặc LLM lỗi, trả fallback an toàn.
    """

    if not has_good_context(chunks):
        return FALLBACK_ANSWER, True, "insufficient_context"

    try:
        return generate_answer(question, context_text), False, None
    except LLMError as exc:
        return (
            f"{FALLBACK_ANSWER}\n\n(Ghi chú kỹ thuật: {str(exc)})",
            True,
            "llm_error",
        )


def ask_chatbot(data):
    question = (data.get("question") or "").strip()
    top_k = data.get("top_k", 5)

    if not question:
        raise ChatError("Vui lòng nhập câu hỏi.", 400)

    if len(question) > 1000:
        raise ChatError("Câu hỏi quá dài. Vui lòng nhập dưới 1000 ký tự.", 400)

    try:
        top_k = int(top_k)
    except (TypeError, ValueError):
        top_k = 5

    try:
        chunks = search_relevant_chunks(question, top_k=top_k)
    except RagSearchError as exc:
        raise ChatError(str(exc), 500) from exc

    context_text = build_rag_context(chunks)
    answer, fallback, fallback_reason = build_answer(question, context_text, chunks)

    return {
        "answer": answer,
        "question": question,
        "context": context_text,
        "sources": build_sources(chunks),
        "fallback": fallback,
        "fallback_reason": fallback_reason,
    }
