
import json
import os
import urllib.request
import urllib.error

from dotenv import load_dotenv

load_dotenv()


class LLMError(Exception):
    pass


SYSTEM_PROMPT = """
Bạn là AI Đông Sơn, trợ lý học tập của Đông Sơn Digital Museum.

Nhiệm vụ:
- Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, dễ hiểu.
- Chỉ sử dụng thông tin có trong CONTEXT RAG được cung cấp.
- Nếu context không đủ để trả lời chắc chắn, hãy nói rõ rằng kho tri thức hiện chưa có đủ thông tin.
- Không bịa thêm thông tin ngoài context.
- Lưu ý: Khi người dùng hỏi về "trống đồng", hãy ngầm hiểu đó là "trống đồng Đông Sơn".
""".strip()


FALLBACK_ANSWER = (
    "Mình chưa tìm thấy đủ tư liệu phù hợp trong kho tri thức Đông Sơn "
    "để trả lời chắc chắn câu hỏi này."
)


def has_good_context(chunks):
    if not chunks:
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


def build_rag_prompt(question, context_text):
    return f"""
CONTEXT RAG:
{context_text}

QUESTION:
{question}

YÊU CẦU:
1. Chỉ sử dụng thông tin trong CONTEXT RAG.
2. Không suy đoán.
3. Nếu không đủ dữ liệu, hãy nói rõ.
""".strip()


def generate_answer(question, context_text):
    prompt = build_rag_prompt(
        question,
        context_text
    )

    return _generate_with_gemini(prompt)


def _post_json(url, payload, timeout=30):
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

        raise LLMError(
            f"Gemini API lỗi HTTP {exc.code}: {detail}"
        ) from exc

    except urllib.error.URLError as exc:
        raise LLMError(
            f"Không kết nối được Gemini API: {exc.reason}"
        ) from exc


def _generate_with_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise LLMError(
            "Thiếu GEMINI_API_KEY trong file .env"
        )

    model = os.getenv(
        "GEMINI_MODEL",
        "gemini-2.5-flash"
    )

    url = (
        "https://generativelanguage.googleapis.com/"
        f"v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )

    payload = {
        "systemInstruction": {
            "parts": [
                {
                    "text": SYSTEM_PROMPT
                }
            ]
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "maxOutputTokens": 700
        }
    }

    data = _post_json(
        url=url,
        payload=payload
    )

    candidates = data.get("candidates", [])

    if not candidates:
        raise LLMError(
            f"Gemini không trả về dữ liệu: {data}"
        )

    parts = (
        candidates[0]
        .get("content", {})
        .get("parts", [])
    )

    answer = "\n".join(
        part.get("text", "")
        for part in parts
    ).strip()

    if not answer:
        raise LLMError(
            "Gemini trả về câu trả lời rỗng"
        )

    return answer


if __name__ == "__main__":
    print(
        _generate_with_gemini(
            "Trống đồng Đông Sơn là gì?"
        )
    )

