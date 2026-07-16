"""Compare semantic-unit chunk sizes with the golden RAG evaluation set.

The benchmark intentionally uses the BM25 branch for all configurations so it can
run deterministically without spending embedding quota. After selection, the active
configuration is still verified end-to-end with the semantic V3 evaluator.
"""

import argparse
import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = Path(__file__).with_name("rag_eval_dataset.json")
DEFAULT_OUTPUT = Path(__file__).parent / "results" / "chunking-benchmark-v3.json"
SELECTION_TOLERANCE = 0.015
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from evaluation.run_rag_eval import (
    flatten_questions,
    load_dataset,
    mean,
    source_metrics,
    validate_dataset,
)
from services.knowledge_pipeline_service import (
    CHUNK_CONFIGS,
    build_semantic_chunks,
    load_knowledge_documents,
)
from services.query_understanding_service import (
    INTENT_ACCOUNT_GAME,
    INTENT_WEBSITE,
    classify_source_intent,
    understand_query,
)
from services.hybrid_retrieval_service import bm25_rank, clean_tokens


def required_corpus(intent):
    return "website" if intent in {INTENT_WEBSITE, INTENT_ACCOUNT_GAME} else "heritage"


def percentile_95(values):
    if not values:
        return 0
    ordered = sorted(values)
    index = min(len(ordered) - 1, int(round((len(ordered) - 1) * 0.95)))
    return ordered[index]


def build_lexical_corpus(chunks):
    corpus = []
    for chunk in chunks:
        metadata = dict(chunk["metadata"])
        metadata.setdefault("intent", classify_source_intent(metadata["source"]))
        weighted = (
            f"{metadata.get('title', '')} {metadata.get('heading_path', '')} "
            f"{metadata.get('entities', '')} {chunk['text']}"
        )
        corpus.append(
            {
                "id": chunk["id"],
                "content": chunk["text"],
                "metadata": metadata,
                "tokens": clean_tokens(weighted),
            }
        )
    return corpus


def evaluate_config(documents, rows, config_name, top_k):
    chunks = build_semantic_chunks(documents, config_name=config_name)
    corpus = build_lexical_corpus(chunks)
    evaluations = []
    context_lengths = []

    for row in rows:
        query = understand_query(row["question"])
        ranked = []
        if not query["should_reject"]:
            target_corpus = required_corpus(query["intent"])
            eligible = [
                item
                for item in corpus
                if item["metadata"].get("corpus") == target_corpus
                and item["metadata"].get("confidence") != "low"
            ]
            ranked = bm25_rank(
                query["keyword_text"],
                eligible,
                query["allowed_intents"],
                top_k,
            )
        sources = [item["metadata"]["source"] for item in ranked]
        metrics = source_metrics(row["expected_sources"], sources)
        predicted_answerable = bool(ranked) and not query["should_reject"]
        context_lengths.append(sum(len(item["content"]) for item in ranked))
        evaluations.append(
            {
                "answerable": row["answerable"],
                "predicted_answerable": predicted_answerable,
                **metrics,
            }
        )

    answerable = [item for item in evaluations if item["answerable"]]
    unanswerable = [item for item in evaluations if not item["answerable"]]
    lengths = [len(chunk["text"]) for chunk in chunks]
    return {
        "chunk_count": len(chunks),
        "avg_chunk_chars": round(mean(lengths), 2),
        "median_chunk_chars": round(statistics.median(lengths), 2) if lengths else 0,
        "p95_chunk_chars": percentile_95(lengths),
        "avg_top_k_context_chars": round(mean(context_lengths), 2),
        "hit_at_k": round(mean([float(item["hit"]) for item in answerable]), 4),
        "source_recall_at_k": round(
            mean([item["source_recall"] for item in answerable]), 4
        ),
        "mrr": round(mean([item["reciprocal_rank"] for item in answerable]), 4),
        "answerability_accuracy": round(
            mean(
                [
                    float(item["answerable"] == item["predicted_answerable"])
                    for item in evaluations
                ]
            ),
            4,
        ),
        "false_reject_rate": round(
            mean([float(not item["predicted_answerable"]) for item in answerable]), 4
        ),
        "false_accept_rate": round(
            mean([float(item["predicted_answerable"]) for item in unanswerable]), 4
        ),
    }


def select_config(configs):
    max_context = max(
        (metrics["avg_top_k_context_chars"] for metrics in configs.values()),
        default=1,
    )
    scored = {}
    for name, metrics in configs.items():
        context_ratio = metrics["avg_top_k_context_chars"] / max(1, max_context)
        score = (
            0.45 * metrics["hit_at_k"]
            + 0.10 * metrics["source_recall_at_k"]
            + 0.35 * metrics["mrr"]
            + 0.10 * metrics["answerability_accuracy"]
            - 0.01 * context_ratio
        )
        scored[name] = round(score, 6)
        metrics["selection_score"] = scored[name]
    # A 120-question set is too small to treat sub-1.5-point score gaps as
    # conclusive. Within that stability band, prefer the middle configuration
    # instead of oscillating between extremes after a small editorial change.
    preference = {"balanced": 2, "compact": 1, "broad": 0}
    best_score = max(scored.values())
    stable_candidates = [
        name
        for name, score in scored.items()
        if score >= best_score - SELECTION_TOLERANCE
    ]
    return max(
        stable_candidates,
        key=lambda name: (preference.get(name, -1), scored[name]),
    )


def run(dataset_path, output_path, top_k):
    dataset = load_dataset(dataset_path)
    validate_dataset(dataset)
    documents = load_knowledge_documents()
    rows = flatten_questions(dataset)
    configs = {}
    for config_name in CHUNK_CONFIGS:
        print(f"Đang benchmark chunk config: {config_name}")
        configs[config_name] = evaluate_config(
            documents,
            rows,
            config_name,
            top_k,
        )
    selected = select_config(configs)
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "benchmark_mode": "deterministic_bm25_over_semantic_units",
        "note": "Cấu hình được chọn offline; collection active được đánh giá lại end-to-end bằng Gemini semantic embedding.",
        "dataset_version": dataset.get("version"),
        "questions": len(rows),
        "top_k": top_k,
        "selection_tolerance": SELECTION_TOLERANCE,
        "selected_config": selected,
        "configs": configs,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(configs, ensure_ascii=False, indent=2))
    print(f"Đã chọn config: {selected}")
    print(f"Đã ghi báo cáo: {output_path}")
    return report


def parse_args():
    parser = argparse.ArgumentParser(description="Benchmark semantic chunk configs V3")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--top-k", type=int, default=5)
    return parser.parse_args()


def main():
    args = parse_args()
    if args.top_k < 1 or args.top_k > 10:
        raise RuntimeError("--top-k phải nằm trong 1..10")
    run(args.dataset, args.output, args.top_k)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Lỗi benchmark chunk: {error}", file=sys.stderr)
        raise SystemExit(1)
