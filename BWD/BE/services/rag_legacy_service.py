"""Legacy hash-based retrieval, isolated from the active V3 RAG pipeline."""

import os
import re
import shutil
from pathlib import Path
from typing import List

from services.legacy_embedding_service import LocalHashEmbeddingFunction


BASE_DIR = Path(__file__).resolve().parents[1]
CHROMA_DIR = BASE_DIR / "vector_store" / "chroma"
COLLECTION_NAME = "dong_son_knowledge"

VI_STOPWORDS = {
    "ai", "anh", "ban", "bang", "bi", "biet", "cho", "chua", "cua", "co",
    "duoc", "gi", "hoi", "la", "lam", "minh", "mot", "nao", "nhu", "ra",
    "sao", "the", "thi", "toi", "trang", "va", "ve", "website",
    "được", "chưa", "của", "có", "gì", "hỏi", "là", "làm", "mình", "một",
    "nào", "như", "ở", "thế", "thì", "tôi", "và", "về",
}


class LegacyRagError(Exception):
    pass


def tokenize_for_rank(text: str) -> List[str]:
    tokens = re.findall(r"\w+", text.lower(), flags=re.UNICODE)
    return [token for token in tokens if len(token) > 1 and token not in VI_STOPWORDS]


def keyword_overlap_score(question: str, content: str, title: str = "") -> float:
    query_tokens = set(tokenize_for_rank(question))
    if not query_tokens:
        return 0.0
    content_tokens = set(tokenize_for_rank(content))
    title_tokens = set(tokenize_for_rank(title))
    content_overlap = len(query_tokens & content_tokens) / len(query_tokens)
    title_overlap = len(query_tokens & title_tokens) / len(query_tokens)
    return min(1.0, content_overlap + title_overlap * 0.45)


def hybrid_rank_score(distance, keyword_score: float) -> float:
    try:
        vector_score = 1 / (1 + float(distance))
    except (TypeError, ValueError):
        vector_score = 0.0
    return vector_score + keyword_score * 0.85


def _runtime_chroma_dir():
    if not os.environ.get("VERCEL"):
        return CHROMA_DIR
    tmp_chroma_dir = Path("/tmp/chroma")
    if not tmp_chroma_dir.exists():
        shutil.copytree(str(CHROMA_DIR), str(tmp_chroma_dir))
    return tmp_chroma_dir


def get_legacy_rag_collection():
    if not CHROMA_DIR.exists():
        raise LegacyRagError(
            "Chưa tìm thấy legacy vector database. Hãy chạy scripts/ingest_knowledge.py."
        )
    try:
        import chromadb
    except ImportError as error:
        raise LegacyRagError("Thiếu chromadb. Hãy cài requirements.txt.") from error

    try:
        client = chromadb.PersistentClient(path=str(_runtime_chroma_dir()))
        return client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=LocalHashEmbeddingFunction(),
        )
    except Exception as error:
        raise LegacyRagError(
            "Không mở được legacy RAG collection. Hãy ingest lại nếu cần rollback."
        ) from error


def search_legacy_chunks(question: str, top_k: int = 5) -> List[dict]:
    safe_top_k = max(1, min(int(top_k), 10))
    collection = get_legacy_rag_collection()
    if collection.count() == 0:
        raise LegacyRagError("Legacy vector database đang rỗng.")

    candidate_count = min(collection.count(), max(safe_top_k * 4, 12))
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
        keyword_score = keyword_overlap_score(question, document, title)
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
