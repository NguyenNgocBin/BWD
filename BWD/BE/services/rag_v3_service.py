"""RAG V3 retrieval over an immutable, metadata-validated active collection."""

from services.collection_manifest_service import (
    CollectionManifestError,
    load_active_manifest,
    runtime_build_dir,
)
from services.embedding_service import EmbeddingError, GeminiEmbeddingFunction
from services.hybrid_retrieval_service import (
    bm25_rank,
    clean_tokens,
    merge_and_rerank,
)
from services.query_understanding_service import (
    INTENT_ACCOUNT_GAME,
    INTENT_ARTIFACT,
    INTENT_WEBSITE,
    understand_query,
)


_COLLECTION_CACHE = None
_COLLECTION_CACHE_KEY = None
_CORPUS_CACHE = None
_CORPUS_CACHE_KEY = None


class RagV3Error(Exception):
    pass


def _active_collection():
    global _COLLECTION_CACHE, _COLLECTION_CACHE_KEY, _CORPUS_CACHE, _CORPUS_CACHE_KEY
    try:
        manifest = load_active_manifest()
        key = manifest["fingerprint"]
        if _COLLECTION_CACHE is not None and _COLLECTION_CACHE_KEY == key:
            return _COLLECTION_CACHE, manifest

        try:
            import chromadb
        except ImportError as error:
            raise RagV3Error("Thiếu chromadb. Hãy cài requirements.txt.") from error

        embedding = GeminiEmbeddingFunction(
            model=manifest["embedding_model"],
            dimensions=manifest["embedding_dimensions"],
        )
        client = chromadb.PersistentClient(path=str(runtime_build_dir(manifest)))
        collection = client.get_collection(
            name=manifest["collection_name"],
            embedding_function=embedding,
        )
        if collection.count() != int(manifest["chunk_count"]):
            raise RagV3Error(
                "Số chunk trong collection V3 không khớp manifest; không dùng build lỗi."
            )
        _COLLECTION_CACHE = collection
        _COLLECTION_CACHE_KEY = key
        _CORPUS_CACHE = None
        _CORPUS_CACHE_KEY = None
        return collection, manifest
    except (CollectionManifestError, EmbeddingError) as error:
        raise RagV3Error(str(error)) from error
    except RagV3Error:
        raise
    except Exception as error:
        raise RagV3Error(
            "Không mở được collection RAG V3 active. Hãy kiểm tra manifest hoặc ingest lại."
        ) from error


def get_v3_collection():
    collection, _ = _active_collection()
    return collection


def _required_corpus(intent):
    if intent in {INTENT_WEBSITE, INTENT_ACCOUNT_GAME}:
        return "website"
    return "heritage"


def _load_corpus(collection, manifest):
    global _CORPUS_CACHE, _CORPUS_CACHE_KEY
    cache_key = manifest["collection_version"]
    if _CORPUS_CACHE is not None and _CORPUS_CACHE_KEY == cache_key:
        return _CORPUS_CACHE

    result = collection.get(include=["documents", "metadatas"])
    corpus = []
    documents = result.get("documents") or []
    metadatas = result.get("metadatas") or []
    for index, item_id in enumerate(result.get("ids") or []):
        document = documents[index]
        metadata = metadatas[index] or {}
        weighted_text = (
            f"{metadata.get('title', '')} {metadata.get('heading_path', '')} "
            f"{metadata.get('heading', '')} {metadata.get('entities', '')} {document}"
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
    _CORPUS_CACHE_KEY = cache_key
    return corpus


def _semantic_candidates(collection, query_info, corpus_name, limit, query_embedding=None):
    where = {
        "$and": [
            {"intent": {"$in": query_info["allowed_intents"]}},
            {"corpus": {"$eq": corpus_name}},
            {"confidence": {"$ne": "low"}},
        ]
    }
    try:
        query_kwargs = (
            {"query_embeddings": [query_embedding]}
            if query_embedding is not None
            else {"query_texts": [query_info["expanded_text"]]}
        )
        result = collection.query(
            **query_kwargs,
            n_results=min(limit, collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
    except EmbeddingError as error:
        raise RagV3Error(str(error)) from error

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


def search_v3(question, top_k=5, query_embedding=None):
    safe_top_k = max(1, min(int(top_k), 10))
    query_info = understand_query(question)
    if query_info["should_reject"]:
        return []

    collection, manifest = _active_collection()
    if collection.count() == 0:
        raise RagV3Error("Collection RAG V3 active đang rỗng.")

    corpus_name = _required_corpus(query_info["intent"])
    candidate_limit = max(20, safe_top_k * 4)
    semantic = _semantic_candidates(
        collection,
        query_info,
        corpus_name,
        candidate_limit,
        query_embedding=query_embedding,
    )
    lexical_corpus = [
        item
        for item in _load_corpus(collection, manifest)
        if item["metadata"].get("corpus") == corpus_name
        and item["metadata"].get("confidence") != "low"
    ]
    lexical = bm25_rank(
        query_info["keyword_text"],
        lexical_corpus,
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
                "title": metadata.get("heading") or metadata.get("title") or "Tài liệu Đông Sơn",
                "document_title": metadata.get("title", ""),
                "filename": metadata.get("filename", ""),
                "document_id": metadata.get("document_id", ""),
                "section_index": metadata.get("section_index"),
                "chunk_index": metadata.get("chunk_index"),
                "heading_path": metadata.get("heading_path", ""),
                "parent_heading": metadata.get("parent_heading", ""),
                "chunk_kind": metadata.get("chunk_kind", "prose"),
                "corpus": metadata.get("corpus"),
                "topic": metadata.get("topic"),
                "updated_at": metadata.get("updated_at"),
                "reviewed_by": metadata.get("reviewed_by"),
                "review_status": metadata.get("review_status"),
                "document_confidence": metadata.get("document_confidence"),
                "references": metadata.get("references", ""),
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
                 "knowledge_version": manifest["knowledge_version"],
                 "collection_version": manifest["collection_version"],
                 "corpus_checksum": manifest["corpus_checksum"],
                 "type": "rag_chunk_v3",
            }
        )
    return chunks
