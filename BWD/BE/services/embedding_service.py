"""Gemini embedding client with separate runtime-query and ingest policies."""

import json
import math
import os
import re
import time
import urllib.error
import urllib.request
from typing import List, Sequence

from dotenv import load_dotenv


load_dotenv()


class EmbeddingError(Exception):
    pass


class EmbeddingRateLimitError(EmbeddingError):
    def __init__(self, message, retry_after=55):
        super().__init__(message)
        self.retry_after = max(1, min(int(retry_after), 59))


def _api_keys():
    raw = os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI_API_KEY") or ""
    keys = [item.strip() for item in raw.split(",") if item.strip()]
    if not keys:
        raise EmbeddingError(
            "Thiếu GEMINI_API_KEYS hoặc GEMINI_API_KEY cho semantic embedding."
        )
    return keys


def _normalize_vector(values):
    vector = [float(value) for value in values]
    norm = math.sqrt(sum(value * value for value in vector))
    if not norm:
        return vector
    return [value / norm for value in vector]


class GeminiEmbeddingFunction:
    """Chroma-compatible embedding function for documents and search queries."""

    def __init__(self, model=None, dimensions=None, batch_size=None):
        self.model = model or os.getenv("RAG_EMBEDDING_MODEL", "gemini-embedding-001")
        self.dimensions = int(
            dimensions or os.getenv("RAG_EMBEDDING_DIMENSIONS", "768")
        )
        self.batch_size = max(
            1,
            min(int(batch_size or os.getenv("RAG_EMBEDDING_BATCH_SIZE", "32")), 100),
        )
        self.timeout = max(1, int(os.getenv("RAG_EMBEDDING_TIMEOUT", "60")))
        self.query_timeout = max(
            1,
            min(int(os.getenv("RAG_QUERY_EMBEDDING_TIMEOUT", "5")), 15),
        )
        # Ingest is resumable through the embedding cache. The default avoids
        # long sleeps on free-provider quotas; operators can opt into retries.
        self.document_attempts = max(
            1,
            min(int(os.getenv("RAG_DOCUMENT_EMBEDDING_ATTEMPTS", "1")), 4),
        )
        self.requests_per_minute = max(
            1,
            int(os.getenv("RAG_EMBEDDING_REQUESTS_PER_MINUTE", "80")),
        )
        self._quota_window_started = time.monotonic()
        self._quota_window_used = 0

    def name(self) -> str:
        return f"gemini_{self.model}_{self.dimensions}"

    def __call__(self, input: Sequence[str]) -> List[List[float]]:
        return self.embed_documents(input)

    def embed_documents(self, input: Sequence[str]) -> List[List[float]]:
        return self._embed(input, task_type="RETRIEVAL_DOCUMENT")

    def embed_query(self, input: Sequence[str]) -> List[List[float]]:
        return self._embed(input, task_type="RETRIEVAL_QUERY")

    def _embed(self, texts, task_type):
        safe_texts = [str(text or "").strip() for text in texts]
        if not safe_texts:
            return []
        if any(not text for text in safe_texts):
            raise EmbeddingError("Không thể embedding văn bản rỗng.")

        embeddings = []
        for start in range(0, len(safe_texts), self.batch_size):
            batch = safe_texts[start : start + self.batch_size]
            embeddings.extend(self._embed_batch(batch, task_type))
        return embeddings

    def _embed_batch(self, texts, task_type):
        model_path = f"models/{self.model}"
        payload = {
            "requests": [
                {
                    "model": model_path,
                    "content": {"parts": [{"text": text}]},
                    "taskType": task_type,
                    "outputDimensionality": self.dimensions,
                }
                for text in texts
            ]
        }

        if task_type == "RETRIEVAL_QUERY":
            # A chat request must fail fast: one key, one attempt, no quota sleep.
            response = self._post_batch(
                _api_keys()[0],
                payload,
                timeout=self.query_timeout,
            )
            return self._vectors_from_response(response, len(texts))

        self._wait_for_quota(len(texts))
        last_error = None
        for attempt in range(self.document_attempts):
            retry_after = 0
            for api_key in _api_keys():
                try:
                    response = self._post_batch(api_key, payload)
                    vectors = self._vectors_from_response(response, len(texts))
                    self._quota_window_used += len(texts)
                    return vectors
                except EmbeddingRateLimitError as error:
                    last_error = error
                    retry_after = max(retry_after, error.retry_after)
                except EmbeddingError as error:
                    last_error = error
                    if "HTTP 5" not in str(error):
                        raise

            if attempt < self.document_attempts - 1 and retry_after:
                time.sleep(min(retry_after + 1, 59))
                self._quota_window_started = time.monotonic()
                self._quota_window_used = 0

        raise last_error or EmbeddingError("Không tạo được semantic embedding.")

    def _vectors_from_response(self, response, expected_count):
        raw_embeddings = response.get("embeddings") or []
        if len(raw_embeddings) != expected_count:
            raise EmbeddingError(
                f"Gemini trả {len(raw_embeddings)} vectors cho {expected_count} inputs."
            )

        vectors = []
        for item in raw_embeddings:
            values = item.get("values") or []
            if len(values) != self.dimensions:
                raise EmbeddingError(
                    f"Sai kích thước embedding: nhận {len(values)}, cần {self.dimensions}."
                )
            vectors.append(_normalize_vector(values))
        return vectors

    def _wait_for_quota(self, incoming_requests):
        while True:
            elapsed = time.monotonic() - self._quota_window_started
            if elapsed >= 60:
                self._quota_window_started = time.monotonic()
                self._quota_window_used = 0
            if self._quota_window_used + incoming_requests <= self.requests_per_minute:
                return
            remaining = max(1, 61 - elapsed)
            time.sleep(min(remaining, 55))

    def _post_batch(self, api_key, payload, timeout=None):
        url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{self.model}:batchEmbedContents"
        )
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=timeout or self.timeout,
            ) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="ignore")
            if error.code == 429:
                retry_match = re.search(r'"retryDelay"\s*:\s*"(\d+)s"', detail)
                retry_after = int(retry_match.group(1)) if retry_match else 55
                raise EmbeddingRateLimitError(
                    f"Gemini embedding HTTP 429: rate limit, thử lại sau {retry_after}s.",
                    retry_after=retry_after,
                ) from error
            raise EmbeddingError(
                f"Gemini embedding HTTP {error.code}: {detail}"
            ) from error
        except (urllib.error.URLError, TimeoutError) as error:
            reason = getattr(error, "reason", str(error))
            raise EmbeddingError(
                f"Không kết nối được Gemini embedding API: {reason}"
            ) from error
