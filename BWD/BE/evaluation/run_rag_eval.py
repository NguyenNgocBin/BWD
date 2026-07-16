"""Validate the RAG golden set and measure retrieval/fallback quality.

Examples:
    python evaluation/run_rag_eval.py --validate-only
    python evaluation/run_rag_eval.py --top-k 5
    python evaluation/run_rag_eval.py --top-k 5 --output evaluation/results/baseline.json
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = Path(__file__).with_name("rag_eval_dataset.json")

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


class DatasetValidationError(Exception):
    pass


def load_dataset(path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def flatten_questions(dataset):
    rows = []
    for case in dataset.get("cases", []):
        for question in case.get("questions", []):
            rows.append(
                {
                    "case_id": case["id"],
                    "question_id": question["id"],
                    "question": question["text"],
                    "variant": question["variant"],
                    "category": case["category"],
                    "answerable": case["answerable"],
                    "reference_answer": case["reference_answer"],
                    "expected_sources": case["expected_sources"],
                }
            )
    return rows


def validate_dataset(dataset, minimum_questions=100, check_source_files=True):
    errors = []
    cases = dataset.get("cases")
    if not isinstance(cases, list) or not cases:
        raise DatasetValidationError("Dataset phải có mảng cases không rỗng.")

    case_ids = set()
    question_ids = set()
    required_case_fields = {
        "id",
        "category",
        "answerable",
        "reference_answer",
        "expected_sources",
        "questions",
    }

    for index, case in enumerate(cases):
        missing = required_case_fields - set(case)
        if missing:
            errors.append(f"cases[{index}] thiếu trường: {sorted(missing)}")
            continue

        if case["id"] in case_ids:
            errors.append(f"Trùng case id: {case['id']}")
        case_ids.add(case["id"])

        if not isinstance(case["answerable"], bool):
            errors.append(f"{case['id']}: answerable phải là boolean")
        if not str(case["reference_answer"]).strip():
            errors.append(f"{case['id']}: reference_answer đang rỗng")
        if case["answerable"] and not case["expected_sources"]:
            errors.append(f"{case['id']}: câu trả lời được phải có expected_sources")
        if not case["answerable"] and case["expected_sources"]:
            errors.append(f"{case['id']}: câu không đủ dữ liệu không nên có expected_sources")

        for source in case["expected_sources"]:
            if check_source_files and not (BASE_DIR / source).is_file():
                errors.append(f"{case['id']}: không tìm thấy nguồn {source}")

        if not isinstance(case["questions"], list) or not case["questions"]:
            errors.append(f"{case['id']}: questions phải là mảng không rỗng")
            continue

        for question in case["questions"]:
            missing_question_fields = {"id", "text", "variant"} - set(question)
            if missing_question_fields:
                errors.append(
                    f"{case['id']}: question thiếu trường {sorted(missing_question_fields)}"
                )
                continue
            if question["id"] in question_ids:
                errors.append(f"Trùng question id: {question['id']}")
            question_ids.add(question["id"])
            if not str(question["text"]).strip():
                errors.append(f"{question['id']}: nội dung câu hỏi đang rỗng")

    if len(question_ids) < minimum_questions:
        errors.append(
            f"Dataset chỉ có {len(question_ids)} câu; yêu cầu tối thiểu {minimum_questions}."
        )

    if errors:
        raise DatasetValidationError("\n- " + "\n- ".join(errors))

    return {
        "cases": len(case_ids),
        "questions": len(question_ids),
        "categories": sorted({case["category"] for case in cases}),
    }


def safe_round(value, digits=4):
    return round(value, digits) if value is not None else None


def mean(values):
    return sum(values) / len(values) if values else 0.0


def source_metrics(expected_sources, retrieved_sources):
    if not expected_sources:
        return {"hit": None, "source_recall": None, "reciprocal_rank": None}

    expected = set(expected_sources)
    retrieved = list(retrieved_sources)
    matched = expected.intersection(retrieved)
    first_rank = next(
        (index for index, source in enumerate(retrieved, start=1) if source in expected),
        None,
    )
    return {
        "hit": bool(matched),
        "source_recall": len(matched) / len(expected),
        "reciprocal_rank": (1 / first_rank) if first_rank else 0.0,
    }


def evaluate(dataset, top_k):
    try:
        from services.llm_service import has_good_context
        from services.rag_service import retrieval_version, search_relevant_chunks
    except ImportError as error:
        raise RuntimeError(
            "Không tải được RAG dependencies. Hãy cài: pip install -r requirements.txt"
        ) from error

    active_retrieval_version = retrieval_version()
    knowledge_status = None
    evaluation_embedding_cache = None
    query_vectors = {}
    if active_retrieval_version == "v3":
        from services.collection_manifest_service import (
            get_knowledge_status,
            load_active_manifest,
        )
        from services.embedding_cache_service import embed_evaluation_queries_cached
        from services.embedding_service import GeminiEmbeddingFunction
        from services.query_understanding_service import understand_query

        knowledge_status = get_knowledge_status(check_source=True)
        manifest = load_active_manifest()
        public_queries = []
        public_query_ids = []
        for row in flatten_questions(dataset):
            query_info = understand_query(row["question"])
            if not query_info["should_reject"]:
                public_query_ids.append(row["question_id"])
                public_queries.append(query_info["expanded_text"])
        vectors, evaluation_embedding_cache = embed_evaluation_queries_cached(
            public_queries,
            GeminiEmbeddingFunction(
                model=manifest["embedding_model"],
                dimensions=manifest["embedding_dimensions"],
            ),
        )
        query_vectors = dict(zip(public_query_ids, vectors))

    results = []
    category_buckets = defaultdict(list)

    for row in flatten_questions(dataset):
        chunks = search_relevant_chunks(
            row["question"],
            top_k=top_k,
            query_embedding=query_vectors.get(row["question_id"]),
        )
        retrieved_sources = [chunk.get("source") for chunk in chunks]
        predicted_answerable = has_good_context(chunks)
        metrics = source_metrics(row["expected_sources"], retrieved_sources)
        result = {
            **row,
            "predicted_answerable": predicted_answerable,
            "answerability_correct": predicted_answerable == row["answerable"],
            "retrieved_sources": retrieved_sources,
            "retrieval": [
                {
                    "source": chunk.get("source"),
                    "title": chunk.get("title"),
                    "distance": safe_round(chunk.get("distance")),
                    "keyword_score": safe_round(chunk.get("keyword_score")),
                    "rank_score": safe_round(chunk.get("rank_score")),
                    "semantic_score": safe_round(chunk.get("semantic_score")),
                    "bm25_score": safe_round(chunk.get("bm25_score")),
                    "rerank_score": safe_round(chunk.get("rerank_score")),
                    "confidence": safe_round(chunk.get("confidence")),
                    "intent": chunk.get("intent"),
                    "heading_path": chunk.get("heading_path"),
                    "corpus": chunk.get("corpus"),
                    "knowledge_version": chunk.get("knowledge_version"),
                    "collection_version": chunk.get("collection_version"),
                }
                for chunk in chunks
            ],
            **metrics,
        }
        results.append(result)
        category_buckets[row["category"]].append(result)

    answerable_results = [item for item in results if item["answerable"]]
    unanswerable_results = [item for item in results if not item["answerable"]]

    def summarize(items):
        answerable_items = [item for item in items if item["answerable"]]
        unanswerable_items = [item for item in items if not item["answerable"]]
        return {
            "questions": len(items),
            "hit_at_k": safe_round(mean([float(item["hit"]) for item in answerable_items])),
            "source_recall_at_k": safe_round(
                mean([item["source_recall"] for item in answerable_items])
            ),
            "mrr": safe_round(
                mean([item["reciprocal_rank"] for item in answerable_items])
            ),
            "answerability_accuracy": safe_round(
                mean([float(item["answerability_correct"]) for item in items])
            ),
            "false_reject_rate": safe_round(
                mean([float(not item["predicted_answerable"]) for item in answerable_items])
            ),
            "false_accept_rate": safe_round(
                mean([float(item["predicted_answerable"]) for item in unanswerable_items])
            ),
        }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": dataset.get("version"),
        "retrieval_version": active_retrieval_version,
        "knowledge_status": knowledge_status,
        "evaluation_embedding_cache": evaluation_embedding_cache,
        "top_k": top_k,
        "summary": summarize(results),
        "counts": {
            "total": len(results),
            "answerable": len(answerable_results),
            "unanswerable": len(unanswerable_results),
        },
        "by_category": {
            category: summarize(items)
            for category, items in sorted(category_buckets.items())
        },
        "failures": [
            {
                "question_id": item["question_id"],
                "question": item["question"],
                "category": item["category"],
                "answerable": item["answerable"],
                "predicted_answerable": item["predicted_answerable"],
                "expected_sources": item["expected_sources"],
                "retrieved_sources": item["retrieved_sources"],
                "hit": item["hit"],
            }
            for item in results
            if not item["answerability_correct"] or item["hit"] is False
        ],
        "results": results,
    }


def write_report(report, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)
        file.write("\n")


def print_summary(summary, counts):
    print(f"Questions: {counts['total']} ({counts['answerable']} answerable, {counts['unanswerable']} unanswerable)")
    print(f"Hit@K: {summary['hit_at_k']:.2%}")
    print(f"Source Recall@K: {summary['source_recall_at_k']:.2%}")
    print(f"MRR: {summary['mrr']:.4f}")
    print(f"Answerability accuracy: {summary['answerability_accuracy']:.2%}")
    print(f"False reject rate: {summary['false_reject_rate']:.2%}")
    print(f"False accept rate: {summary['false_accept_rate']:.2%}")


def parse_args():
    parser = argparse.ArgumentParser(description="Đánh giá retrieval và fallback của RAG Đông Sơn")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--fail-under-hit", type=float, default=0.0)
    return parser.parse_args()


def main():
    args = parse_args()
    dataset = load_dataset(args.dataset)
    stats = validate_dataset(dataset)
    print(
        f"Dataset hợp lệ: {stats['cases']} cases, {stats['questions']} questions, "
        f"{len(stats['categories'])} categories."
    )
    if args.validate_only:
        return 0

    if args.top_k < 1 or args.top_k > 10:
        raise DatasetValidationError("--top-k phải nằm trong khoảng 1..10")

    try:
        report = evaluate(dataset, args.top_k)
    except Exception as error:
        raise RuntimeError(f"Không chạy được retrieval evaluation: {error}") from error
    print_summary(report["summary"], report["counts"])

    if args.output:
        output_path = args.output if args.output.is_absolute() else BASE_DIR / args.output
        write_report(report, output_path)
        print(f"Đã ghi báo cáo: {output_path}")

    if report["summary"]["hit_at_k"] < args.fail_under_hit:
        print(
            f"Hit@K {report['summary']['hit_at_k']:.4f} thấp hơn ngưỡng "
            f"{args.fail_under_hit:.4f}.",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (DatasetValidationError, RuntimeError) as error:
        print(f"Lỗi: {error}", file=sys.stderr)
        raise SystemExit(1)
