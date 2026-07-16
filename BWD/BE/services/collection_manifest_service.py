"""Immutable RAG V3 build manifests and atomic active-version pointer."""

import hashlib
import json
import os
import shutil
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
CHROMA_V3_ROOT = BASE_DIR / "vector_store" / "chroma_v3"
BUILDS_DIR = CHROMA_V3_ROOT / "builds"
ACTIVE_MANIFEST_PATH = CHROMA_V3_ROOT / "active.json"
RUNTIME_CHROMA_V3_ROOT = Path("/tmp/chroma_v3")
COLLECTION_V3_NAME = "dong_son_knowledge_v3"
PIPELINE_VERSION = "knowledge-v3"
METADATA_SCHEMA_VERSION = 1
CHUNKER_VERSION = "semantic-units-v2"


class CollectionManifestError(Exception):
    pass


def _remove_path(path):
    """Remove one known build/runtime path without following directory symlinks."""

    path = Path(path)
    if path.is_symlink() or (path.exists() and not path.is_dir()):
        path.unlink()
    elif path.exists():
        shutil.rmtree(path)


def _try_lock(handle):
    handle.seek(0)
    if os.name == "nt":
        import msvcrt

        msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        return

    import fcntl

    fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)


def _unlock(handle):
    handle.seek(0)
    if os.name == "nt":
        import msvcrt

        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        return

    import fcntl

    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


@contextmanager
def exclusive_file_lock(path, timeout=600.0, poll_interval=0.1):
    """Hold an OS-level exclusive lock, including against other processes."""

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = path.open("a+b")
    acquired = False
    try:
        handle.seek(0, os.SEEK_END)
        if handle.tell() == 0:
            handle.write(b"\0")
            handle.flush()
        deadline = None if timeout is None else time.monotonic() + float(timeout)
        while True:
            try:
                _try_lock(handle)
                acquired = True
                break
            except (BlockingIOError, OSError):
                if deadline is not None and time.monotonic() >= deadline:
                    raise CollectionManifestError(
                        f"Hết thời gian chờ khóa độc quyền: {path}"
                    )
                time.sleep(max(0.01, float(poll_interval)))
        yield path
    finally:
        if acquired:
            _unlock(handle)
        handle.close()


@contextmanager
def fingerprint_build_lock(fingerprint, timeout=600.0):
    """Serialize all writers for one immutable content-addressed build."""

    # Validate before using the fingerprint as a path component.
    build_dir_for(fingerprint)
    lock_path = BUILDS_DIR / ".locks" / f"{fingerprint}.lock"
    with exclusive_file_lock(lock_path, timeout=timeout):
        yield lock_path


def _json_bytes(value):
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def sha256_json(value):
    return hashlib.sha256(_json_bytes(value)).hexdigest()


def collection_checksum(chunks):
    rows = []
    for chunk in sorted(chunks, key=lambda item: item["id"]):
        rows.append(
            {
                "id": chunk["id"],
                "text_sha256": hashlib.sha256(chunk["text"].encode("utf-8")).hexdigest(),
                "metadata_sha256": sha256_json(chunk["metadata"]),
            }
        )
    return sha256_json(rows)


def embeddings_checksum(chunks, embeddings):
    if len(chunks) != len(embeddings):
        raise CollectionManifestError("Số embeddings không khớp số chunks khi checksum.")
    rows = []
    for chunk, vector in sorted(
        zip(chunks, embeddings),
        key=lambda pair: pair[0]["id"],
    ):
        vector_payload = json.dumps(
            [float(value) for value in vector],
            separators=(",", ":"),
        ).encode("utf-8")
        rows.append(
            {
                "id": chunk["id"],
                "vector_sha256": hashlib.sha256(vector_payload).hexdigest(),
            }
        )
    return sha256_json(rows)


def build_fingerprint(corpus_checksum, chunk_config, embedding_model, dimensions):
    return sha256_json(
        {
            "pipeline_version": PIPELINE_VERSION,
            "metadata_schema_version": METADATA_SCHEMA_VERSION,
            "chunker_version": CHUNKER_VERSION,
            "corpus_checksum": corpus_checksum,
            "chunk_config": chunk_config,
            "embedding_model": embedding_model,
            "embedding_dimensions": int(dimensions),
        }
    )


def desired_build_identity(documents=None, config_name=None):
    """Compute the complete desired build identity without calling an API."""

    from services.embedding_service import GeminiEmbeddingFunction
    from services.knowledge_pipeline_service import (
        CHUNK_CONFIGS,
        compute_corpus_checksum,
        load_knowledge_documents,
    )

    selected_config = config_name or os.getenv("RAG_CHUNK_CONFIG", "balanced")
    if selected_config not in CHUNK_CONFIGS:
        raise CollectionManifestError(
            f"Chunk config không hợp lệ: {selected_config}. "
            f"Chọn: {', '.join(sorted(CHUNK_CONFIGS))}"
        )
    if documents is None:
        documents = load_knowledge_documents()
    corpus_checksum = compute_corpus_checksum(documents)
    embedding = GeminiEmbeddingFunction()
    config = dict(CHUNK_CONFIGS[selected_config])
    fingerprint = build_fingerprint(
        corpus_checksum,
        config,
        embedding.model,
        embedding.dimensions,
    )
    return {
        "fingerprint": fingerprint,
        "corpus_checksum": corpus_checksum,
        "chunk_config_name": selected_config,
        "chunk_config": config,
        "chunker_version": CHUNKER_VERSION,
        "embedding_model": embedding.model,
        "embedding_dimensions": embedding.dimensions,
    }


def build_dir_for(fingerprint):
    if not fingerprint or any(character not in "0123456789abcdef" for character in fingerprint):
        raise CollectionManifestError("Fingerprint collection không hợp lệ.")
    return BUILDS_DIR / fingerprint


def create_manifest(
    *,
    fingerprint,
    corpus_checksum,
    collection_checksum_value,
    documents,
    chunks,
    chunk_config_name,
    chunk_config,
    embedding_model,
    embedding_dimensions,
    embedding_checksum_value=None,
    embedding_cache_stats=None,
    benchmark=None,
):
    files = {}
    chunks_per_source = {}
    for chunk in chunks:
        source = chunk["metadata"]["source"]
        chunks_per_source[source] = chunks_per_source.get(source, 0) + 1
    for document in documents:
        source = document["source"]
        files[source] = {
            "sha256": document["source_sha256"],
            "chunks": chunks_per_source.get(source, 0),
            "retrieval_enabled": bool(document["metadata"]["retrieval_enabled"]),
        }

    return {
        "manifest_schema_version": 1,
        "pipeline_version": PIPELINE_VERSION,
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "chunker_version": CHUNKER_VERSION,
        "fingerprint": fingerprint,
        "knowledge_version": f"knowledge-v3-{corpus_checksum[:12]}",
        "collection_version": f"rag-v3-{fingerprint[:12]}",
        "collection_name": COLLECTION_V3_NAME,
        "build_path": f"builds/{fingerprint}",
        "corpus_checksum": corpus_checksum,
        "collection_checksum": collection_checksum_value,
        "embedding_checksum": embedding_checksum_value,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "document_count": len(documents),
        "indexed_document_count": sum(
            1 for document in documents if document["metadata"]["retrieval_enabled"]
        ),
        "chunk_count": len(chunks),
        "files": files,
        "chunk_config_name": chunk_config_name,
        "chunk_config": dict(chunk_config),
        "embedding_model": embedding_model,
        "embedding_dimensions": int(embedding_dimensions),
        "embedding_cache": embedding_cache_stats or {},
        "benchmark": benchmark or {},
    }


def write_build_manifest(build_dir, manifest):
    build_dir = Path(build_dir)
    build_dir.mkdir(parents=True, exist_ok=True)
    path = build_dir / "manifest.json"
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, path)
    return path


def load_json(path):
    path = Path(path)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise CollectionManifestError(f"Không tìm thấy manifest: {path}") from error
    except json.JSONDecodeError as error:
        raise CollectionManifestError(f"Manifest JSON không hợp lệ: {path}") from error


def load_active_manifest(required=True):
    if not ACTIVE_MANIFEST_PATH.is_file():
        if required:
            raise CollectionManifestError(
                "Chưa có collection V3 active. Hãy chạy scripts/ingest_knowledge_v3.py."
            )
        return None
    manifest = load_json(ACTIVE_MANIFEST_PATH)
    verify_manifest_shape(manifest)
    return manifest


def verify_manifest_shape(manifest):
    required = {
        "fingerprint",
        "knowledge_version",
        "collection_version",
        "collection_name",
        "build_path",
        "corpus_checksum",
        "collection_checksum",
        "chunk_count",
        "embedding_model",
        "embedding_dimensions",
    }
    missing = required - set(manifest or {})
    if missing:
        raise CollectionManifestError(f"Manifest thiếu trường: {sorted(missing)}")
    if manifest["collection_name"] != COLLECTION_V3_NAME:
        raise CollectionManifestError("Manifest trỏ sai collection V3.")
    return manifest


def resolve_build_dir(manifest):
    verify_manifest_shape(manifest)
    path = (CHROMA_V3_ROOT / manifest["build_path"]).resolve()
    root = CHROMA_V3_ROOT.resolve()
    if root not in path.parents:
        raise CollectionManifestError("build_path nằm ngoài vector_store/chroma_v3.")
    if (path / ".building").exists():
        raise CollectionManifestError(f"Collection build vẫn đang được tạo: {path}")
    if not (path / "chroma.sqlite3").is_file():
        raise CollectionManifestError(f"Collection build bị thiếu hoặc chưa hoàn tất: {path}")
    return path


def verify_collection_build(manifest, build_dir=None, allow_building=False):
    """Open a persisted collection and validate its manifest, count and metadata."""

    verify_manifest_shape(manifest)
    path = Path(build_dir) if build_dir is not None else resolve_build_dir(manifest)
    if not allow_building and (path / ".building").exists():
        raise CollectionManifestError(f"Collection build vẫn đang được tạo: {path}")
    if not (path / "chroma.sqlite3").is_file():
        raise CollectionManifestError(f"Collection build bị thiếu hoặc chưa hoàn tất: {path}")

    local_manifest = load_json(path / "manifest.json")
    verify_manifest_shape(local_manifest)
    if sha256_json(local_manifest) != sha256_json(manifest):
        raise CollectionManifestError(
            f"Manifest trong build không khớp active manifest: {path}"
        )

    try:
        import chromadb
    except ImportError as error:
        raise CollectionManifestError(
            "Thiếu chromadb nên không thể kiểm tra sâu collection V3."
        ) from error

    client = None
    try:
        client = chromadb.PersistentClient(path=str(path))
        collection = client.get_collection(name=manifest["collection_name"])
        actual_count = int(collection.count())
        expected_count = int(manifest["chunk_count"])
        if actual_count != expected_count:
            raise CollectionManifestError(
                f"Collection có {actual_count}/{expected_count} chunks so với manifest."
            )

        metadata = dict(collection.metadata or {})
        expected_metadata = {
            "pipeline_version": manifest.get("pipeline_version", PIPELINE_VERSION),
            "fingerprint": manifest["fingerprint"],
            "corpus_checksum": manifest["corpus_checksum"],
            "embedding_model": manifest["embedding_model"],
            "embedding_dimensions": int(manifest["embedding_dimensions"]),
        }
        if manifest.get("chunk_config_name"):
            expected_metadata["chunk_config"] = manifest["chunk_config_name"]
        # New builds persist this field. Older valid V3 builds are still
        # accepted; their complete fingerprint comparison marks them stale
        # when CHUNKER_VERSION changes.
        if "chunker_version" in metadata and manifest.get("chunker_version"):
            expected_metadata["chunker_version"] = manifest["chunker_version"]

        mismatches = []
        for key, expected in expected_metadata.items():
            actual = metadata.get(key)
            if key == "embedding_dimensions":
                try:
                    actual = int(actual)
                except (TypeError, ValueError):
                    pass
            if actual != expected:
                mismatches.append(f"{key}={actual!r} (cần {expected!r})")
        if mismatches:
            raise CollectionManifestError(
                "Collection metadata không khớp manifest: " + "; ".join(mismatches)
            )
    except CollectionManifestError:
        raise
    except Exception as error:
        raise CollectionManifestError(
            f"Không mở/kiểm tra được collection V3 tại {path}: {error}"
        ) from error
    finally:
        close = getattr(client, "close", None)
        if callable(close):
            close()
    return path


def activate_manifest(manifest):
    verify_manifest_shape(manifest)
    resolve_build_dir(manifest)
    CHROMA_V3_ROOT.mkdir(parents=True, exist_ok=True)
    temporary = ACTIVE_MANIFEST_PATH.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, ACTIVE_MANIFEST_PATH)


def runtime_build_dir(manifest):
    source = resolve_build_dir(manifest)
    if not os.environ.get("VERCEL"):
        return verify_collection_build(manifest, source)

    target = RUNTIME_CHROMA_V3_ROOT / manifest["fingerprint"]
    lock_path = RUNTIME_CHROMA_V3_ROOT / ".locks" / f"{manifest['fingerprint']}.lock"
    RUNTIME_CHROMA_V3_ROOT.mkdir(parents=True, exist_ok=True)
    with exclusive_file_lock(lock_path, timeout=60.0):
        if target.exists():
            try:
                return verify_collection_build(manifest, target)
            except CollectionManifestError:
                # A previous cold start may have died while using the old
                # direct-copy implementation. Under the fingerprint lock this
                # target is safe to replace.
                _remove_path(target)

        for stale in RUNTIME_CHROMA_V3_ROOT.glob(
            f".{manifest['fingerprint']}.*.staging"
        ):
            _remove_path(stale)

        staging = RUNTIME_CHROMA_V3_ROOT / (
            f".{manifest['fingerprint']}.{os.getpid()}.{uuid.uuid4().hex}.staging"
        )
        try:
            shutil.copytree(source, staging)
            verify_collection_build(manifest, staging)
            # target does not exist while this fingerprint lock is held, so
            # the directory rename publishes a fully verified snapshot.
            os.replace(staging, target)
            return verify_collection_build(manifest, target)
        finally:
            if staging.exists():
                _remove_path(staging)


def get_knowledge_status(check_source=True, config_name=None):
    active = load_active_manifest(required=False)
    if not active:
        return {
            "retrieval_version": "v3",
            "ready": False,
            "in_sync": False,
            "message": "Chưa có collection V3 active.",
        }

    status = {
        "retrieval_version": "v3",
        "ready": True,
        "fingerprint": active["fingerprint"],
        "knowledge_version": active["knowledge_version"],
        "collection_version": active["collection_version"],
        "corpus_checksum": active["corpus_checksum"],
        "collection_checksum": active["collection_checksum"],
        "embedding_checksum": active.get("embedding_checksum"),
        "chunk_count": active["chunk_count"],
        "chunk_config": active.get("chunk_config_name"),
        "embedding_model": active["embedding_model"],
        "embedding_dimensions": active["embedding_dimensions"],
        "created_at": active.get("created_at"),
        "in_sync": None,
    }
    try:
        runtime_build_dir(active)
    except CollectionManifestError as error:
        status.update({"ready": False, "in_sync": False, "message": str(error)})

    if check_source:
        try:
            desired = desired_build_identity(config_name=config_name)
            status.update(
                {
                    "current_corpus_checksum": desired["corpus_checksum"],
                    "desired_fingerprint": desired["fingerprint"],
                    "desired_chunk_config": desired["chunk_config_name"],
                    "desired_chunker_version": desired["chunker_version"],
                    "desired_embedding_model": desired["embedding_model"],
                    "desired_embedding_dimensions": desired["embedding_dimensions"],
                }
            )
            identity_matches = desired["fingerprint"] == active["fingerprint"]
            status["in_sync"] = bool(status["ready"] and identity_matches)
            if status["ready"] and not identity_matches:
                status["message"] = (
                    "Build V3 active không khớp fingerprint mong muốn "
                    "(corpus/chunk config/chunker/embedding); cần ingest lại."
                )
        except Exception as error:
            status["in_sync"] = False
            if status["ready"]:
                status["message"] = f"Không kiểm tra được fingerprint mong muốn: {error}"
    return status
