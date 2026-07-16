"""Shared BM25, reciprocal-rank fusion and lightweight reranking helpers."""

import math
from collections import Counter

from services.query_understanding_service import INTENT_ARTIFACT, tokenize_for_bm25


RRF_K = 60
BM25_STOPWORDS = {
    "ai", "anh", "ban", "bang", "bi", "biet", "cho", "chua", "cua", "co",
    "duoc", "gi", "hoi", "la", "lam", "minh", "mot", "nao", "nhu", "o",
    "ra", "sao", "the", "thi", "toi", "trang", "va", "ve", "website",
}


def clean_tokens(text):
    return [token for token in tokenize_for_bm25(text) if token not in BM25_STOPWORDS]


def bm25_rank(query_text, corpus, allowed_intents, limit):
    documents = [
        item for item in corpus if item["metadata"].get("intent") in allowed_intents
    ]
    query_tokens = clean_tokens(query_text)
    if not documents or not query_tokens:
        return []

    document_frequency = Counter()
    for item in documents:
        document_frequency.update(set(item["tokens"]))

    document_count = len(documents)
    average_length = sum(len(item["tokens"]) for item in documents) / document_count
    k1 = 1.5
    b = 0.75
    ranked = []

    for item in documents:
        frequencies = Counter(item["tokens"])
        document_length = max(1, len(item["tokens"]))
        score = 0.0
        for token in query_tokens:
            frequency = frequencies.get(token, 0)
            if not frequency:
                continue
            df = document_frequency[token]
            idf = math.log(1 + (document_count - df + 0.5) / (df + 0.5))
            denominator = frequency + k1 * (
                1 - b + b * document_length / max(1, average_length)
            )
            score += idf * (frequency * (k1 + 1) / denominator)
        if score > 0:
            ranked.append({**item, "bm25_score": score})

    ranked.sort(key=lambda item: item["bm25_score"], reverse=True)
    return ranked[:limit]


def keyword_overlap(query_text, content, heading):
    query = set(clean_tokens(query_text))
    if not query:
        return 0.0
    content_tokens = set(clean_tokens(content))
    heading_tokens = set(clean_tokens(heading))
    body_overlap = len(query & content_tokens) / len(query)
    title_overlap = len(query & heading_tokens) / len(query)
    return min(1.0, body_overlap + 0.5 * title_overlap)


def merge_and_rerank(query_info, semantic, lexical, candidate_limit):
    candidates = {}
    for rank, item in enumerate(semantic, start=1):
        candidates[item["id"]] = {
            **item,
            "semantic_rank": rank,
            "bm25_score": 0.0,
            "bm25_rank": None,
            "rrf_score": 1 / (RRF_K + rank),
        }

    for rank, item in enumerate(lexical, start=1):
        current = candidates.setdefault(
            item["id"],
            {
                **item,
                "distance": None,
                "semantic_score": 0.0,
                "semantic_rank": None,
                "rrf_score": 0.0,
            },
        )
        current["bm25_score"] = item["bm25_score"]
        current["bm25_rank"] = rank
        current["rrf_score"] += 1 / (RRF_K + rank)

    max_bm25 = max((item.get("bm25_score", 0) for item in candidates.values()), default=1)
    max_rrf = max((item.get("rrf_score", 0) for item in candidates.values()), default=1)
    entity_names = set(query_info["entities"])

    reranked = []
    for item in candidates.values():
        metadata = item["metadata"]
        bm25_normalized = item.get("bm25_score", 0) / max(1e-9, max_bm25)
        rrf_normalized = item.get("rrf_score", 0) / max(1e-9, max_rrf)
        keyword_score = keyword_overlap(
            query_info["keyword_text"],
            item["content"],
            metadata.get("heading", ""),
        )
        document_entities = set(
            filter(
                None,
                (metadata.get("entity_ids") or metadata.get("entities", "")).split(","),
            )
        )
        entity_score = 1.0 if entity_names and entity_names & document_entities else 0.0
        intent_score = 1.0 if metadata.get("intent") == query_info["intent"] else 0.0
        artifact_bonus = (
            0.04
            if query_info["intent"] == INTENT_ARTIFACT
            and metadata.get("intent") == INTENT_ARTIFACT
            else 0.0
        )

        rerank_score = min(
            1.0,
            0.43 * item.get("semantic_score", 0)
            + 0.25 * bm25_normalized
            + 0.12 * keyword_score
            + 0.08 * rrf_normalized
            + 0.07 * entity_score
            + 0.05 * intent_score
            + artifact_bonus,
        )
        reranked.append(
            {
                **item,
                "bm25_normalized": bm25_normalized,
                "keyword_score": keyword_score,
                "entity_score": entity_score,
                "rerank_score": rerank_score,
                "rank_score": rerank_score,
                "confidence": rerank_score,
            }
        )

    reranked.sort(
        key=lambda item: (
            item["rerank_score"],
            item.get("semantic_score", 0),
            item.get("bm25_score", 0),
        ),
        reverse=True,
    )
    return reranked[:candidate_limit]
