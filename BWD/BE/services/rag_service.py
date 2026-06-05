import hashlib
import math
import re
from pathlib import Path
from typing import List, Sequence


BASE_DIR = Path(__file__).resolve().parents[1]
CHROMA_DIR = BASE_DIR / "vector_store" / "chroma"
COLLECTION_NAME = "dong_son_knowledge"


class RagSearchError(Exception):
    pass


class LocalHashEmbeddingFunction:
    """
    Embedding function giống pipeline ingest để đảm bảo vector của câu hỏi
    và vector trong ChromaDB nằm cùng không gian embedding.
    """

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


def tokenize(text: str) -> List[str]:
    normalized = text.lower()
    return re.findall(r"[\wÀ-ỹ]+", normalized, flags=re.UNICODE)


def get_rag_collection():
    if not CHROMA_DIR.exists():
        raise RagSearchError(
            "Chưa tìm thấy vector database. Hãy chạy: python BWD/BE/scripts/ingest_knowledge.py"
        )

    try:
        import chromadb
    except ImportError as exc:
        raise RagSearchError(
            "Thiếu package `chromadb`. Hãy chạy: pip install -r BWD/BE/requirements.txt"
        ) from exc

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    try:
        return client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=LocalHashEmbeddingFunction(),
        )
    except Exception as exc:
        raise RagSearchError(
            "Không tìm thấy collection RAG. Hãy chạy lại: python BWD/BE/scripts/ingest_knowledge.py"
        ) from exc


def search_relevant_chunks(question: str, top_k: int = 5) -> List[dict]:
    """
    Embed câu hỏi, search ChromaDB và trả về các chunk liên quan kèm source.
    """

    safe_top_k = max(1, min(top_k, 10))
    collection = get_rag_collection()

    if collection.count() == 0:
        raise RagSearchError(
            "Vector database đang rỗng. Hãy chạy lại: python BWD/BE/scripts/ingest_knowledge.py"
        )

    result = collection.query(
        query_texts=[question],
        n_results=safe_top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    chunks = []
    for index, document in enumerate(documents):
        metadata = metadatas[index] if index < len(metadatas) else {}
        distance = distances[index] if index < len(distances) else None

        chunks.append(
            {
                "content": document,
                "source": metadata.get("source", "unknown"),
                "title": metadata.get("heading", "Tài liệu Đông Sơn"),
                "filename": metadata.get("filename", ""),
                "section_index": metadata.get("section_index"),
                "chunk_index": metadata.get("chunk_index"),
                "distance": distance,
                "type": "rag_chunk",
            }
        )

    return chunks


def build_rag_context(chunks: List[dict]) -> str:
    return "\n\n".join(
        (
            f"[Nguồn {index + 1}] {chunk['title']} "
            f"({chunk['source']}, chunk {chunk.get('chunk_index')})\n"
            f"{chunk['content']}"
        )
        for index, chunk in enumerate(chunks)
    )


def build_sources(chunks: List[dict]) -> List[dict]:
    return [
        {
            "title": chunk["title"],
            "source": chunk["source"],
            "filename": chunk["filename"],
            "section_index": chunk["section_index"],
            "chunk_index": chunk["chunk_index"],
            "distance": chunk["distance"],
            "type": chunk["type"],
        }
        for chunk in chunks
    ]