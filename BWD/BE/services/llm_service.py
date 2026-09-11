
import json
import os
import re
import urllib.request
import urllib.error

from dotenv import load_dotenv

load_dotenv()


class LLMError(Exception):
    def __init__(self, message, code="llm_error", provider="gemini"):
        super().__init__(message)
        self.code = code
        self.provider = provider


SYSTEM_PROMPT = """
Bạn là AI Đông Sơn, trợ lý học tập của Đông Sơn Digital Museum.

Nhiệm vụ:
- Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, dễ hiểu.
- Chỉ sử dụng thông tin có trong CONTEXT RAG được cung cấp.
- Nếu context không đủ để trả lời chắc chắn, hãy nói rõ rằng kho tri thức hiện chưa có đủ thông tin.
- Không bịa thêm thông tin ngoài context.
- Không dùng một nguồn có độ tin cậy `low` để khẳng định dữ kiện.
- Với nguồn `pending_expert_review`, chỉ trình bày đúng điều nguồn nêu và tránh biến diễn giải chưa chắc chắn thành kết luận tuyệt đối.
- Mỗi dữ kiện phải có trích dẫn dạng [1], [2] hoặc [3] đúng với mã nguồn trong CONTEXT RAG.
- Không tự tạo mã nguồn và không dùng mã nguồn ngoài những mã đã được cung cấp.
- Lưu ý: Khi người dùng hỏi về "trống đồng", hãy ngầm hiểu đó là "trống đồng Đông Sơn".
""".strip()


FALLBACK_ANSWER = (
    "Mình chưa tìm thấy đủ tư liệu phù hợp trong kho tri thức Đông Sơn "
    "để trả lời chắc chắn câu hỏi này."
)

CITATION_ERROR_ANSWER = (
    "Mình chưa thể xác minh nguồn trích dẫn cho câu trả lời này. "
    "Bạn có thể xem các nguồn gợi ý bên dưới hoặc hỏi lại cụ thể hơn."
)


def has_good_context(chunks):
    if not chunks:
        return False

    if str(chunks[0].get("document_confidence") or "").lower() == "low":
        return False

    confidence = chunks[0].get("confidence")
    if confidence is not None:
        try:
            min_confidence = float(os.getenv("RAG_MIN_CONFIDENCE", "0.38"))
            return float(confidence) >= min_confidence
        except (TypeError, ValueError):
            return False

    best_distance = chunks[0].get("distance")

    if best_distance is None:
        return True

    try:
        keyword_score = float(chunks[0].get("keyword_score") or 0)
        if keyword_score >= 0.55:
            return True
    except (TypeError, ValueError):
        pass

    try:
        max_distance = float(
            os.getenv("RAG_MAX_DISTANCE", "1.35")
        )

        return float(best_distance) <= max_distance

    except (TypeError, ValueError):
        return True


def build_rag_prompt(question, context_text, source_count=None):
    source_count = source_count or len(re.findall(r"(?m)^\[(\d+)\]", context_text))
    allowed_citations = ", ".join(f"[{index}]" for index in range(1, source_count + 1))
    return f"""
CONTEXT RAG:
{context_text}

QUESTION:
{question}

YÊU CẦU:
1. Chỉ sử dụng thông tin trong CONTEXT RAG.
2. Không suy đoán.
3. Nếu không đủ dữ liệu, hãy nói rõ.
4. Trích dẫn ngay sau dữ kiện bằng đúng một trong các mã: {allowed_citations}.
5. Mọi dữ kiện trong câu trả lời phải có ít nhất một mã nguồn; không tạo mã khác.
""".strip()


def generate_answer(question, context_text, source_count=None):
    prompt = build_rag_prompt(
        question,
        context_text,
        source_count=source_count,
    )

    return _generate_with_gemini(prompt)


def validate_answer_citations(answer, source_count):
    """Accept only answers that cite at least one real context source."""

    if not isinstance(answer, str) or not answer.strip() or source_count < 1:
        return False
    citations = [int(value) for value in re.findall(r"\[(\d+)\]", answer)]
    return bool(citations) and all(1 <= value <= source_count for value in citations)


def _post_json(url, payload, timeout=15):
    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=timeout
        ) as response:

            raw = response.read().decode("utf-8")

            return json.loads(raw)

    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(
            "utf-8",
            errors="ignore"
        )

        error_code = "provider_quota" if exc.code == 429 else "provider_http_error"
        raise LLMError(
            f"Gemini API lỗi HTTP {exc.code}: {detail}",
            code=error_code,
        ) from exc

    except urllib.error.URLError as exc:
        raise LLMError(
            f"Không kết nối được Gemini API: {exc.reason}",
            code="provider_unavailable",
        ) from exc

    except json.JSONDecodeError as exc:
        raise LLMError(
            "Gemini trả về JSON không hợp lệ",
            code="provider_invalid_response",
        ) from exc

    except TimeoutError as exc:
        raise LLMError(
            "Gemini không phản hồi đúng thời hạn",
            code="provider_timeout",
        ) from exc


def _resolve_model_name():
    """Keep stable model names stable instead of silently switching aliases."""
    configured = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()
    deprecated_models = {
        "gemini-1.5-flash": "gemini-flash-lite-latest",
        "gemini-2.0-flash-lite-001": "gemini-flash-lite-latest",
        "gemini-3.6-flash": "gemini-flash-lite-latest",
    }
    return deprecated_models.get(configured, configured or "gemini-flash-lite-latest")


def _generation_config(model):
    try:
        max_output_tokens = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2048"))
    except (TypeError, ValueError):
        max_output_tokens = 2048

    config = {
        "temperature": 0.2,
        "topP": 0.8,
        "maxOutputTokens": max(1024, min(max_output_tokens, 8192)),
    }

    # Only gemini-2.5 models require thinkingBudget
    if model.startswith("gemini-2.5") and "image" not in model:
        config["thinkingConfig"] = {"thinkingBudget": 0}
    return config


def _generate_with_gemini(prompt):
    keys_str = os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI_API_KEY")

    if not keys_str:
        raise LLMError(
            "Thiếu GEMINI_API_KEYS hoặc GEMINI_API_KEY trong file .env"
        )

    api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not api_keys:
        raise LLMError("Danh sách API Key rỗng")

    model = _resolve_model_name()
    api_key = api_keys[0]

    payload = {
        "systemInstruction": {
            "parts": [
                {"text": SYSTEM_PROMPT}
            ]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": _generation_config(model),
    }

    # Do not fan out across free-tier keys after a quota failure. One request
    # performs at most one provider call; the chat layer returns a safe fallback.
    url = (
        "https://generativelanguage.googleapis.com/"
        f"v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    data = _post_json(url=url, payload=payload, timeout=15)
    candidates = data.get("candidates", [])
    if not candidates:
        raise LLMError(
            "Gemini không trả về candidate nào",
            code="provider_empty_response",
        )

    candidate = candidates[0]
    finish_reason = str(candidate.get("finishReason") or "").upper()
    if finish_reason and finish_reason != "STOP":
        error_code = (
            "provider_truncated_response"
            if finish_reason == "MAX_TOKENS"
            else "provider_blocked_response"
        )
        raise LLMError(
            f"Gemini dừng sinh câu trả lời: {finish_reason}",
            code=error_code,
        )

    parts = candidate.get("content", {}).get("parts", [])
    # Filter out thought parts from reasoning models
    answer_parts = [
        part.get("text", "")
        for part in parts
        if not part.get("thought") and part.get("text")
    ]
    answer = "\n".join(answer_parts).strip()
    if not answer and parts:
        answer = "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()

    if not answer:
        raise LLMError(
            "Gemini trả về câu trả lời rỗng",
            code="provider_empty_response",
        )
    return answer




if __name__ == "__main__":
    print(
        _generate_with_gemini(
            "Trống đồng Đông Sơn là gì?"
        )
    )

