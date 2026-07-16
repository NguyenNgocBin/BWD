import os
import shutil
from pathlib import Path

from services.embedding_service import EmbeddingError, GeminiEmbeddingFunction
from services.hybrid_retrieval_service import (
    bm25_rank,
    clean_tokens,
    merge_and_rerank,
)
from services.query_understanding_service import understand_query


BASE_DIR = Path(__file__).resolve().parents[1]
CHROMA_V2_DIR = BASE_DIR / "vector_store" / "chroma_v2"
COLLECTION_V2_NAME = "dong_son_knowledge_v2"

_CORPUS_CACHE = None
_CORPUS_CACHE_COUNT = None
_COLLECTION_CACHE = None


class RagV2Error(Exception):
    pass


def _runtime_chroma_dir():
    if not os.environ.get("VERCEL"):
        return CHROMA_V2_DIR
    tmp_dir = Path("/tmp/chroma_v2")
    if not tmp_dir.exists():
        shutil.copytree(str(CHROMA_V2_DIR), str(tmp_dir))
    return tmp_dir


def get_v2_collection():
    global _COLLECTION_CACHE
    if _COLLECTION_CACHE is not None:
        return _COLLECTION_CACHE
    if not CHROMA_V2_DIR.exists():
        raise RagV2Error(
            "Chưa có semantic vector database V2. Hãy chạy: python scripts/ingest_knowledge_v2.py"
        )
    try:
        import chromadb
    except ImportError as error:
        raise RagV2Error("Thiếu chromadb. Hãy cài requirements.txt") from error

    try:
        client = chromadb.PersistentClient(path=str(_runtime_chroma_dir()))
        _COLLECTION_CACHE = client.get_collection(
            name=COLLECTION_V2_NAME,
            embedding_function=GeminiEmbeddingFunction(),
        )
        return _COLLECTION_CACHE
    except EmbeddingError as error:
        raise RagV2Error(str(error)) from error
    except Exception as error:
        raise RagV2Error(
            "Không mở được collection RAG V2. Hãy ingest lại semantic knowledge."
        ) from error


def _load_corpus(collection):
    global _CORPUS_CACHE, _CORPUS_CACHE_COUNT
    count = collection.count()
    if _CORPUS_CACHE is not None and _CORPUS_CACHE_COUNT == count:
        return _CORPUS_CACHE

    result = collection.get(include=["documents", "metadatas"])
    corpus = []
    for index, item_id in enumerate(result.get("ids") or []):
        document = (result.get("documents") or [])[index]
        metadata = (result.get("metadatas") or [])[index] or {}
        weighted_text = (
            f"{metadata.get('heading', '')} {metadata.get('heading', '')} "
            f"{metadata.get('entities', '')} {document}"
        )
        corpus.append(
            {
                "id": item_id,
                "content": document,
                "metadata": metadata,
                "tokens": clean_tokens(weighted_text),
            }
        )
    _CORPUS_CACHE = corpus
    _CORPUS_CACHE_COUNT = count
    return corpus


def _semantic_candidates(collection, query_info, limit):
    where = {"intent": {"$in": query_info["allowed_intents"]}}
    try:
        result = collection.query(
            query_texts=[query_info["expanded_text"]],
            n_results=min(limit, collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
    except EmbeddingError as error:
        raise RagV2Error(str(error)) from error

    candidates = []
    ids = (result.get("ids") or [[]])[0]
    documents = (result.get("documents") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    for index, item_id in enumerate(ids):
        distance = float(distances[index])
        candidates.append(
            {
                "id": item_id,
                "content": documents[index],
                "metadata": metadatas[index] or {},
                "distance": distance,
                "semantic_score": max(0.0, min(1.0, 1.0 - distance)),
            }
        )
    return candidates


def search_v2(question, top_k=5):
    safe_top_k = max(1, min(int(top_k), 10))
    query_info = understand_query(question)
    if query_info["should_reject"]:
        return []

    collection = get_v2_collection()
    if collection.count() == 0:
        raise RagV2Error("Collection RAG V2 đang rỗng. Hãy ingest lại.")

    candidate_limit = max(20, safe_top_k * 4)
    semantic = _semantic_candidates(collection, query_info, candidate_limit)
    lexical = bm25_rank(
        query_info["keyword_text"],
        _load_corpus(collection),
        query_info["allowed_intents"],
        candidate_limit,
    )
    reranked = merge_and_rerank(query_info, semantic, lexical, candidate_limit)

    chunks = []
    for item in reranked[:safe_top_k]:
        metadata = item["metadata"]
        chunks.append(
            {
                "content": item["content"],
                "source": metadata.get("source", "unknown"),
                "title": metadata.get("heading", "Tài liệu Đông Sơn"),
                "filename": metadata.get("filename", ""),
                "section_index": metadata.get("section_index"),
                "chunk_index": metadata.get("chunk_index"),
                "distance": item.get("distance"),
                "semantic_score": item.get("semantic_score", 0),
                "bm25_score": item.get("bm25_score", 0),
                "bm25_normalized": item.get("bm25_normalized", 0),
                "keyword_score": item.get("keyword_score", 0),
                "rrf_score": item.get("rrf_score", 0),
                "rerank_score": item.get("rerank_score", 0),
                "rank_score": item.get("rank_score", 0),
                "confidence": item.get("confidence", 0),
                "intent": query_info["intent"],
                "source_intent": metadata.get("intent"),
                "entities": query_info["entities"],
                "type": "rag_chunk_v2",
            }
        )
    return chunks
