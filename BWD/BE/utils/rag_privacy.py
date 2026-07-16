import hashlib
import re


MAX_LOGGED_QUESTION_LENGTH = 1000

EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+?84|0)(?:[ .-]?\d){8,10}(?!\d)")
TOKEN_PATTERN = re.compile(
    r"\b(?:bearer\s+)?(?:sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_.-]{20,})\b",
    re.IGNORECASE,
)
PASSWORD_PATTERN = re.compile(
    r"((?:mật\s*khẩu|mat\s*khau|password)\s*(?:là|la|:|=)\s*)\S+",
    re.IGNORECASE,
)


def redact_question(question):
    value = str(question or "").strip()[:MAX_LOGGED_QUESTION_LENGTH]
    value = EMAIL_PATTERN.sub("[email]", value)
    value = PHONE_PATTERN.sub("[phone]", value)
    value = TOKEN_PATTERN.sub("[secret]", value)
    value = PASSWORD_PATTERN.sub(r"\1[secret]", value)
    return value


def hash_question(question):
    normalized = " ".join(str(question or "").lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
