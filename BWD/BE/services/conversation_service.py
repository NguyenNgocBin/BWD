"""Small, deterministic helpers for short RAG conversation history.

History is used only to make the current question self-contained. Retrieval is
still executed for every request; previous answers are never treated as a
knowledge source.
"""

import re

from services.query_understanding_service import (
    ENTITY_ALIASES,
    detect_entities,
    normalize_for_keyword,
)


MAX_HISTORY_MESSAGES = 6
MAX_HISTORY_ITEM_LENGTH = 1200
MAX_HISTORY_TOTAL_LENGTH = 4000

_ROLE_ALIASES = {
    "user": "user",
    "assistant": "assistant",
    "bot": "assistant",
    "model": "assistant",
}

_FOLLOW_UP_PATTERNS = (
    r"\bno\b",
    r"\bcai (?:do|nay|ay)\b",
    r"\bhien vat (?:do|nay|ay)\b",
    r"\btrong (?:do|nay|ay)\b",
    r"\bvan de (?:do|nay|ay)\b",
    r"\bcon (?:do|cai do|the)\b",
    r"\bnhu vay\b",
    r"\bthe con\b",
    r"\bvay (?:thi|con)\b",
)


class ConversationHistoryError(ValueError):
    pass


def normalize_history(value):
    """Validate an optional client history and retain only the recent window."""

    if value in (None, ""):
        return []
    if not isinstance(value, list):
        raise ConversationHistoryError("Lịch sử hội thoại không hợp lệ.")

    normalized = []
    total_length = 0
    for item in value[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(item, dict):
            raise ConversationHistoryError("Lịch sử hội thoại không hợp lệ.")
        raw_role = item.get("role")
        raw_content = item.get("content")
        if not isinstance(raw_role, str) or not isinstance(raw_content, str):
            raise ConversationHistoryError("Lịch sử hội thoại không hợp lệ.")
        role = _ROLE_ALIASES.get(raw_role.strip().lower())
        content = raw_content.strip()
        if role is None or not content:
            raise ConversationHistoryError("Lịch sử hội thoại không hợp lệ.")
        if len(content) > MAX_HISTORY_ITEM_LENGTH:
            raise ConversationHistoryError("Một lượt hội thoại quá dài.")
        total_length += len(content)
        if total_length > MAX_HISTORY_TOTAL_LENGTH:
            raise ConversationHistoryError("Lịch sử hội thoại quá dài.")
        normalized.append({"role": role, "content": content})
    return normalized


def _is_follow_up(question):
    keyword_text = normalize_for_keyword(question)
    if any(re.search(pattern, keyword_text) for pattern in _FOLLOW_UP_PATTERNS):
        return True
    # Very short connectors are normally meaningful only after another turn.
    return len(keyword_text.split()) <= 4 and keyword_text.startswith(
        ("con ", "the ", "vay ", "tai sao ", "o dau ")
    )


def rewrite_follow_up_question(question, history):
    """Return a standalone retrieval query without calling an LLM.

    Prefer a recognized entity from the latest user turn. If no named entity is
    available, retain a short copy of that user question as disambiguating
    context. Assistant messages are deliberately ignored so generated text can
    never become retrieval evidence.
    """

    current_entities = detect_entities(normalize_for_keyword(question))
    if not history or current_entities or not _is_follow_up(question):
        return question, False

    previous_user_questions = [
        item["content"] for item in reversed(history) if item["role"] == "user"
    ]
    for previous in previous_user_questions:
        entities = detect_entities(normalize_for_keyword(previous))
        if entities:
            labels = [ENTITY_ALIASES[entity][1] for entity in entities]
            subject = "; ".join(dict.fromkeys(labels))
            return f"{question}\nChủ thể đang được hỏi: {subject}", True

    if previous_user_questions:
        previous = previous_user_questions[0][:300]
        return f"{question}\nCâu hỏi trước của người dùng: {previous}", True
    return question, False
