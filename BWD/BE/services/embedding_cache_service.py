"""Persistent cache for knowledge-document embeddings.

Only public knowledge chunks are cached. Runtime user questions deliberately bypass
this cache so raw user input is never persisted here.
"""

import hashlib
import json
import sqlite3
from contextlib import closing
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CACHE_PATH = BASE_DIR / "vector_store" / "embedding_cache.sqlite3"


def embedding_cache_key(text, task_type, model, dimensions):
    payload = f"{task_type}\0{model}\0{dimensions}\0{text}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _connect(cache_path=DEFAULT_CACHE_PATH):
    cache_path = Path(cache_path)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(cache_path))
    connection.execute(
        """
        create table if not exists embedding_cache (
            cache_key text primary key,
            task_type text not null,
            model text not null,
            dimensions integer not null,
            vector_json text not null,
            created_at text not null default current_timestamp
        )
        """
    )
    return connection


def _embed_cached(
    texts,
    embedding_function,
    task_type,
    embed_method,
    cache_path=DEFAULT_CACHE_PATH,
):
    safe_texts = [str(text or "").strip() for text in texts]
    if any(not text for text in safe_texts):
        raise ValueError("Không thể cache embedding cho văn bản rỗng.")
    if not safe_texts:
        return [], {"hits": 0, "misses": 0}

    model = embedding_function.model
    dimensions = int(embedding_function.dimensions)
    keys = [
        embedding_cache_key(text, task_type, model, dimensions)
        for text in safe_texts
    ]

    unique_keys = list(dict.fromkeys(keys))
    placeholders = ",".join("?" for _ in unique_keys)
    cached = {}
    with closing(_connect(cache_path)) as connection:
        if unique_keys:
            rows = connection.execute(
                f"select cache_key, vector_json from embedding_cache where cache_key in ({placeholders})",
                unique_keys,
            ).fetchall()
            cached = {key: json.loads(vector_json) for key, vector_json in rows}

        missing_by_key = {}
        for key, text in zip(keys, safe_texts):
            if key not in cached:
                missing_by_key.setdefault(key, text)

        if missing_by_key:
            missing_keys = list(missing_by_key)
            batch_size = max(1, int(getattr(embedding_function, "batch_size", 32)))
            for start in range(0, len(missing_keys), batch_size):
                batch_keys = missing_keys[start : start + batch_size]
                vectors = embed_method([missing_by_key[key] for key in batch_keys])
                if len(vectors) != len(batch_keys):
                    raise RuntimeError("Số vector trả về không khớp số inputs cần cache.")
                for key, vector in zip(batch_keys, vectors):
                    safe_vector = [float(value) for value in vector]
                    if len(safe_vector) != dimensions:
                        raise RuntimeError(
                            f"Embedding cache nhận vector {len(safe_vector)} chiều; cần {dimensions}."
                        )
                    cached[key] = safe_vector
                    connection.execute(
                        """
                        insert or replace into embedding_cache (
                            cache_key, task_type, model, dimensions, vector_json
                        ) values (?, ?, ?, ?, ?)
                        """,
                        (key, task_type, model, dimensions, json.dumps(safe_vector)),
                    )
                # Checkpoint every successful API batch so a later rate-limit can
                # resume without embedding the completed public inputs again.
                connection.commit()

    misses = len(missing_by_key)
    return [cached[key] for key in keys], {
        "hits": len(unique_keys) - misses,
        "misses": misses,
        "unique_inputs": len(unique_keys),
    }


def embed_documents_cached(texts, embedding_function, cache_path=DEFAULT_CACHE_PATH):
    """Cache public knowledge-document vectors and return them in input order."""

    return _embed_cached(
        texts,
        embedding_function,
        "RETRIEVAL_DOCUMENT",
        embedding_function.embed_documents,
        cache_path,
    )


def embed_evaluation_queries_cached(
    texts,
    embedding_function,
    cache_path=DEFAULT_CACHE_PATH,
):
    """Cache only public golden-set queries used by the offline evaluator.

    Do not call this function from the chat request path. Runtime user questions
    remain uncached and are never persisted by the RAG pipeline.
    """

    return _embed_cached(
        texts,
        embedding_function,
        "RETRIEVAL_QUERY_EVALUATION",
        embedding_function.embed_query,
        cache_path,
    )
