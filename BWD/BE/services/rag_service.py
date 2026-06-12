import hashlib
import math
import re
from pathlib import Path
from typing import List, Sequence


BASE_DIR = Path(__file__).resolve().parents[1]
CHROMA_DIR = BASE_DIR / "vector_store" / "chroma"
COLLECTION_NAME = "dong_son_knowledge"

VI_STOPWORDS = {
    "ai",
    "anh",
    "ban",
    "bang",
    "bi",
    "biet",
    "cho",
    "chua",
    "cua",
    "co",
    "duoc",
    "gi",
    "hoi",
    "la",
    "lam",
    "minh",
    "mot",
    "nao",
    "nhu",
    "ra",
    "sao",
    "the",
    "thi",
    "toi",
    "trang",
    "va",
    "ve",
    "website",
    "được",
    "chưa",
    "của",
    "có",
    "gì",
    "hỏi",
    "là",
    "làm",
    "mình",
    "một",
    "nào",
    "như",
    "ở",
    "thế",
    "thì",
    "tôi",
    "và",
    "về",
}


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


def tokenize_for_rank(text: str) -> List[str]:
    normalized = text.lower()
    tokens = re.findall(r"\w+", normalized, flags=re.UNICODE)
    return [
        token
        for token in tokens
        if len(token) > 1 and token not in VI_STOPWORDS
    ]


def keyword_overlap_score(question: str, content: str, title: str = "") -> float:
    query_tokens = set(tokenize_for_rank(question))
    if not query_tokens:
        return 0.0

    content_tokens = set(tokenize_for_rank(content))
    title_tokens = set(tokenize_for_rank(title))

    content_overlap = len(query_tokens & content_tokens) / len(query_tokens)
    title_overlap = len(query_tokens & title_tokens) / len(query_tokens)

    return min(1.0, content_overlap + (title_overlap * 0.45))


def hybrid_rank_score(distance, keyword_score: float) -> float:
    try:
        vector_score = 1 / (1 + float(distance))
    except (TypeError, ValueError):
        vector_score = 0.0

    return vector_score + (keyword_score * 0.85)


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

    import os
    import shutil
    
    # Trên Vercel (Serverless), file system bị Read-Only ngoại trừ /tmp.
    # ChromaDB cần ghi file lock nên phải copy sang /tmp.
    if os.environ.get("VERCEL"):
        tmp_chroma_dir = Path("/tmp/chroma")
        if not tmp_chroma_dir.exists():
            shutil.copytree(str(CHROMA_DIR), str(tmp_chroma_dir))
        client = chromadb.PersistentClient(path=str(tmp_chroma_dir))
    else:
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

    candidate_count = min(
        collection.count(),
        max(safe_top_k * 4, 12),
    )

    result = collection.query(
        query_texts=[question],
        n_results=candidate_count,
        include=["documents", "metadatas", "distances"],
    )

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    chunks = []
    for index, document in enumerate(documents):
        metadata = metadatas[index] if index < len(metadatas) else {}
        distance = distances[index] if index < len(distances) else None
        title = metadata.get("heading", "Tài liệu Đông Sơn")
        keyword_score = keyword_overlap_score(
            question=question,
            content=document,
            title=title,
        )

        chunks.append(
            {
                "content": document,
                "source": metadata.get("source", "unknown"),
                "title": title,
                "filename": metadata.get("filename", ""),
                "section_index": metadata.get("section_index"),
                "chunk_index": metadata.get("chunk_index"),
                "distance": distance,
                "keyword_score": keyword_score,
                "rank_score": hybrid_rank_score(distance, keyword_score),
                "type": "rag_chunk",
            }
        )

    chunks.sort(
        key=lambda chunk: (
            chunk["rank_score"],
            -float(chunk["distance"] or 0),
        ),
        reverse=True,
    )

    return chunks[:safe_top_k]


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
