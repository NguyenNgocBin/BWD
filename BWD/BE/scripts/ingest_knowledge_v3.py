"""Build and atomically activate an immutable semantic knowledge collection V3.

Examples:
    python scripts/ingest_knowledge_v3.py --validate-only
    python scripts/ingest_knowledge_v3.py --config balanced
    python scripts/ingest_knowledge_v3.py --check
    python scripts/ingest_knowledge_v3.py --watch --interval 5
"""

import argparse
import json
import os
import shutil
import sys
import time
from dataclasses import asdict, is_dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from services.collection_manifest_service import (
    BUILDS_DIR,
    CHUNKER_VERSION,
    COLLECTION_V3_NAME,
    activate_manifest,
    build_dir_for,
    build_fingerprint,
    collection_checksum,
    create_manifest,
    desired_build_identity,
    embeddings_checksum,
    fingerprint_build_lock,
    get_knowledge_status,
    load_json,
    verify_collection_build,
    verify_manifest_shape,
    write_build_manifest,
)
from services.embedding_cache_service import embed_documents_cached
from services.embedding_service import GeminiEmbeddingFunction
from services.knowledge_pipeline_service import (
    CHUNK_CONFIGS,
    audit_corpus,
    build_semantic_chunks,
    compute_corpus_checksum,
    load_knowledge_documents,
)


DEFAULT_BENCHMARK_REPORT = BASE_DIR / "evaluation" / "results" / "chunking-benchmark-v3.json"


def _config_dict(config):
    if is_dataclass(config):
        return asdict(config)
    if isinstance(config, dict):
        return dict(config)
    return {
        key: value
        for key, value in vars(config).items()
        if not key.startswith("_")
    }


def _print_audit(audit):
    print("Knowledge audit:")
    for key in (
        "document_count",
        "indexed_document_count",
        "empty_documents",
        "metadata_errors",
        "exact_duplicates",
        "near_duplicates",
    ):
        if key in audit:
            value = audit[key]
            count = len(value) if isinstance(value, list) else value
            print(f"- {key}: {count}")


def _audit_errors(audit):
    errors = []
    for key in ("empty_documents", "metadata_errors", "exact_duplicates"):
        value = audit.get(key) or []
        if value:
            errors.append(f"{key}: {value}")
    return errors


def load_and_validate(verbose=True):
    documents = load_knowledge_documents()
    audit = audit_corpus(documents)
    if verbose:
        _print_audit(audit)
    errors = _audit_errors(audit)
    if errors:
        raise RuntimeError("Knowledge audit chưa đạt:\n- " + "\n- ".join(errors))
    if not documents:
        raise RuntimeError("Kho tri thức không có tài liệu hợp lệ.")
    return documents, audit


def _load_benchmark(path, config_name):
    path = Path(path)
    if not path.is_file():
        return {}
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    selected = report.get("selected_config")
    configs = report.get("configs") or {}
    return {
        "report": str(path.relative_to(BASE_DIR)).replace("\\", "/"),
        "selected_config": selected,
        "active_config_metrics": configs.get(config_name, {}),
        "dataset_version": report.get("dataset_version"),
    }


def _reuse_existing(final_dir, fingerprint, activate):
    manifest_path = final_dir / "manifest.json"
    if not manifest_path.is_file():
        raise RuntimeError(
            f"Build path đã tồn tại nhưng thiếu manifest: {final_dir}. "
            "Không ghi đè collection bất biến."
        )
    manifest = verify_manifest_shape(load_json(manifest_path))
    if manifest["fingerprint"] != fingerprint:
        raise RuntimeError("Manifest hiện có không khớp fingerprint build.")
    verify_collection_build(manifest, final_dir)
    if activate:
        activate_manifest(manifest)
    print(f"Tái sử dụng collection V3 đã có: {manifest['collection_version']}")
    return manifest


def _prepare_locked_build_dir(final_dir, fingerprint):
    """Create an incomplete build while holding its external fingerprint lock.

    Chroma keeps HNSW files open on Windows, so a staging-directory rename can
    fail even after a successful write. The lock lives outside this directory,
    therefore a crashed partial directory can be removed only after no writer
    still owns the fingerprint. A `.building` marker keeps readers out.
    """

    if final_dir.exists():
        if (
            final_dir.parent.resolve() != BUILDS_DIR.resolve()
            or final_dir.name != fingerprint
        ):
            raise RuntimeError(
                f"Build path nằm ngoài vị trí fingerprint hợp lệ: {final_dir}"
            )
        shutil.rmtree(final_dir)
    final_dir.mkdir(parents=True)
    (final_dir / ".building").write_text("incomplete\n", encoding="utf-8")


def build_collection(config_name="balanced", activate=True, benchmark_report=DEFAULT_BENCHMARK_REPORT):
    if config_name not in CHUNK_CONFIGS:
        raise RuntimeError(
            f"Chunk config không hợp lệ: {config_name}. Chọn: {', '.join(CHUNK_CONFIGS)}"
        )

    documents, _ = load_and_validate()
    corpus_checksum = compute_corpus_checksum(documents)
    chunks = build_semantic_chunks(documents, config_name=config_name)
    if not chunks:
        raise RuntimeError("Semantic chunker không tạo được chunk nào.")

    embedding = GeminiEmbeddingFunction()
    config = _config_dict(CHUNK_CONFIGS[config_name])
    fingerprint = build_fingerprint(
        corpus_checksum,
        config,
        embedding.model,
        embedding.dimensions,
    )
    final_dir = build_dir_for(fingerprint)
    BUILDS_DIR.mkdir(parents=True, exist_ok=True)
    # The lock is outside final_dir, so a second process must wait and can never
    # remove the directory while this process is embedding/writing Chroma.
    with fingerprint_build_lock(fingerprint):
        if (final_dir / "manifest.json").is_file() and not (
            final_dir / ".building"
        ).exists():
            return _reuse_existing(final_dir, fingerprint, activate)
        _prepare_locked_build_dir(final_dir, fingerprint)

        try:
            import chromadb
        except ImportError as error:
            raise RuntimeError("Thiếu chromadb. Hãy cài requirements.txt.") from error

        print(f"Tạo {len(chunks)} semantic chunks ({config_name})...")
        vectors, cache_stats = embed_documents_cached(
            [chunk["embed_text"] for chunk in chunks],
            embedding,
        )
        print(
            "Embedding cache: "
            f"{cache_stats.get('hits', 0)} hit, {cache_stats.get('misses', 0)} miss."
        )

        client = None
        try:
            client = chromadb.PersistentClient(path=str(final_dir))
            collection = client.get_or_create_collection(
                name=COLLECTION_V3_NAME,
                embedding_function=embedding,
                configuration={"hnsw": {"space": "cosine"}},
                metadata={
                    "description": "RAG V3: validated metadata + semantic chunks + separated corpora",
                    "pipeline_version": "knowledge-v3",
                    "chunker_version": CHUNKER_VERSION,
                    "fingerprint": fingerprint,
                    "corpus_checksum": corpus_checksum,
                    "chunk_config": config_name,
                    "embedding_model": embedding.model,
                    "embedding_dimensions": embedding.dimensions,
                },
            )
            collection.add(
                ids=[chunk["id"] for chunk in chunks],
                embeddings=vectors,
                documents=[chunk["text"] for chunk in chunks],
                metadatas=[chunk["metadata"] for chunk in chunks],
            )
            actual_count = collection.count()
            if actual_count != len(chunks):
                raise RuntimeError(
                    f"Collection chỉ có {actual_count}/{len(chunks)} chunks sau ingest."
                )
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

        manifest = create_manifest(
            fingerprint=fingerprint,
            corpus_checksum=corpus_checksum,
            collection_checksum_value=collection_checksum(chunks),
            documents=documents,
            chunks=chunks,
            chunk_config_name=config_name,
            chunk_config=config,
            embedding_model=embedding.model,
            embedding_dimensions=embedding.dimensions,
            embedding_checksum_value=embeddings_checksum(chunks, vectors),
            embedding_cache_stats=cache_stats,
            benchmark=_load_benchmark(benchmark_report, config_name),
        )
        write_build_manifest(final_dir, manifest)
        verify_collection_build(manifest, final_dir, allow_building=True)
        (final_dir / ".building").unlink()
        if activate:
            activate_manifest(manifest)
        print("Ingest knowledge V3 thành công.")
        print(f"- Knowledge version: {manifest['knowledge_version']}")
        print(f"- Collection version: {manifest['collection_version']}")
        print(f"- Corpus checksum: {manifest['corpus_checksum']}")
        print(f"- Collection checksum: {manifest['collection_checksum']}")
        print(f"- Build: {final_dir}")
        print(f"- Chunks: {manifest['chunk_count']}")
        return manifest


def check_active(config_name="balanced"):
    status = get_knowledge_status(check_source=True, config_name=config_name)
    print(json.dumps(status, ensure_ascii=False, indent=2))
    return bool(status.get("ready") and status.get("in_sync"))


def watch(config_name, interval, benchmark_report):
    print(
        f"Đang theo dõi knowledge/**/*.md mỗi {interval:g}s. "
        "Nhấn Ctrl+C để dừng."
    )
    last_seen = None
    while True:
        try:
            documents, _ = load_and_validate(verbose=False)
            desired = desired_build_identity(documents, config_name=config_name)
            status = get_knowledge_status(check_source=False)
            active_fingerprint = status.get("fingerprint") if status.get("ready") else None
            if desired["fingerprint"] != active_fingerprint and desired["fingerprint"] != last_seen:
                print("Phát hiện desired fingerprint V3 thay đổi; bắt đầu build bất biến...")
                build_collection(
                    config_name=config_name,
                    activate=True,
                    benchmark_report=benchmark_report,
                )
                last_seen = desired["fingerprint"]
            time.sleep(interval)
        except KeyboardInterrupt:
            print("Đã dừng watcher knowledge.")
            return 0
        except Exception as error:
            print(f"Auto-ingest chưa thành công: {error}", file=sys.stderr)
            time.sleep(interval)


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest immutable semantic knowledge V3")
    parser.add_argument(
        "--config",
        default=os.getenv("RAG_CHUNK_CONFIG", "balanced"),
        choices=sorted(CHUNK_CONFIGS),
    )
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--check", action="store_true", help="Fail nếu source lệch active manifest")
    parser.add_argument("--watch", action="store_true", help="Tự ingest khi knowledge thay đổi")
    parser.add_argument("--interval", type=float, default=5.0)
    parser.add_argument("--no-activate", action="store_true")
    parser.add_argument("--benchmark-report", type=Path, default=DEFAULT_BENCHMARK_REPORT)
    return parser.parse_args()


def main():
    args = parse_args()
    if args.interval < 1 or args.interval > 60:
        raise RuntimeError("--interval phải nằm trong khoảng 1..60 giây.")
    if args.validate_only:
        load_and_validate()
        print("Knowledge metadata và corpus hợp lệ.")
        return 0
    if args.check:
        return 0 if check_active(args.config) else 2
    if args.watch:
        return watch(args.config, args.interval, args.benchmark_report)
    build_collection(
        config_name=args.config,
        activate=not args.no_activate,
        benchmark_report=args.benchmark_report,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Lỗi ingest V3: {error}", file=sys.stderr)
        raise SystemExit(1)
