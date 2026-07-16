"""Write a machine-readable audit for the Markdown knowledge corpus."""

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = BASE_DIR / "evaluation" / "results" / "knowledge-audit-v3.json"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from services.knowledge_pipeline_service import (
    REQUIRED_METADATA_FIELDS,
    audit_corpus,
    compute_corpus_checksum,
    load_knowledge_documents,
)


def run(output_path):
    documents = load_knowledge_documents(strict=False)
    audit = audit_corpus(documents)
    valid_documents = [document for document in documents if not document.get("validation_errors")]
    corpus_counts = Counter(
        document.get("metadata", {}).get("corpus", "invalid") for document in documents
    )
    retrieval_counts = Counter(
        "enabled" if document.get("metadata", {}).get("retrieval_enabled") is True else "disabled"
        for document in documents
    )
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metadata_required_fields": list(REQUIRED_METADATA_FIELDS),
        "corpus_checksum": (
            compute_corpus_checksum(valid_documents)
            if len(valid_documents) == len(documents)
            else None
        ),
        "counts_by_corpus": dict(sorted(corpus_counts.items())),
        "retrieval_documents": dict(sorted(retrieval_counts.items())),
        **audit,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Đã ghi báo cáo: {output_path}")
    blocking = any(
        report.get(key)
        for key in ("empty_documents", "metadata_errors", "exact_duplicates")
    )
    return 1 if blocking else 0


def main():
    parser = argparse.ArgumentParser(description="Audit knowledge metadata và nội dung")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.output if args.output.is_absolute() else BASE_DIR / args.output
    return run(output)


if __name__ == "__main__":
    raise SystemExit(main())
