"""Local hash embedding retained only for explicit legacy RAG rollback."""

import hashlib
import math
import re
from typing import List, Sequence


def tokenize(text: str) -> List[str]:
    return re.findall(r"[\wÀ-ỹ]+", text.lower(), flags=re.UNICODE)


class LocalHashEmbeddingFunction:
    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions

    def name(self) -> str:
        return "local_hash_embedding"

    def __call__(self, input: Sequence[str]) -> List[List[float]]:
        return [self._embed_text(text) for text in input]

    def embed_query(self, input: Sequence[str]) -> List[List[float]]:
        return self(input)

    def embed_documents(self, input: Sequence[str]) -> List[List[float]]:
        return self(input)

    def _embed_text(self, text: str) -> List[float]:
        tokens = tokenize(text)
        vector = [0.0] * self.dimensions
        if not tokens:
            return vector

        for token in tokens:
            digest = hashlib.md5(token.encode("utf-8")).hexdigest()
            index = int(digest[:8], 16) % self.dimensions
            sign = 1.0 if int(digest[8:10], 16) % 2 == 0 else -1.0
            vector[index] += sign

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return vector
        return [value / norm for value in vector]
