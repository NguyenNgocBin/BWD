import json
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from services import collection_manifest_service as manifest_service
from services.collection_manifest_service import (
    ACTIVE_MANIFEST_PATH,
    CollectionManifestError,
    build_fingerprint,
    collection_checksum,
    embeddings_checksum,
    exclusive_file_lock,
    get_knowledge_status,
    runtime_build_dir,
    verify_collection_build,
)
from services.embedding_cache_service import (
    embed_documents_cached,
    embed_evaluation_queries_cached,
    embedding_cache_key,
)
from services.query_understanding_service import (
    INTENT_ARTIFACT,
    INTENT_KNOWLEDGE,
    INTENT_WEBSITE,
    classify_source_intent,
    understand_query,
)
from services.rag_service import retrieval_version


class FakeEmbedding:
    model = "fake-multilingual"
    dimensions = 3
    batch_size = 2

    def __init__(self):
        self.document_calls = []
        self.query_calls = []

    @staticmethod
    def _vectors(texts):
        return [[float(len(text)), 1.0, 0.0] for text in texts]

    def embed_documents(self, texts):
        self.document_calls.append(list(texts))
        return self._vectors(texts)

    def embed_query(self, texts):
        self.query_calls.append(list(texts))
        return self._vectors(texts)


class EmbeddingCacheTests(unittest.TestCase):
    def test_document_cache_reuses_vectors_and_checkpoints_batches(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "cache.sqlite3"
            embedding = FakeEmbedding()
            texts = ["một", "hai", "ba"]
            first, stats = embed_documents_cached(texts, embedding, path)
            self.assertEqual(stats["misses"], 3)
            self.assertEqual(len(embedding.document_calls), 2)
            second, stats = embed_documents_cached(texts, embedding, path)
            self.assertEqual(first, second)
            self.assertEqual(stats["hits"], 3)
            self.assertEqual(len(embedding.document_calls), 2)

    def test_public_eval_query_cache_is_separate_from_document_cache(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "cache.sqlite3"
            embedding = FakeEmbedding()
            embed_documents_cached(["Trống Tân Long"], embedding, path)
            _, stats = embed_evaluation_queries_cached(
                ["Trống Tân Long"], embedding, path
            )
            self.assertEqual(stats["misses"], 1)
            self.assertEqual(len(embedding.query_calls), 1)
            self.assertNotEqual(
                embedding_cache_key(
                    "Trống Tân Long", "RETRIEVAL_DOCUMENT", embedding.model, 3
                ),
                embedding_cache_key(
                    "Trống Tân Long",
                    "RETRIEVAL_QUERY_EVALUATION",
                    embedding.model,
                    3,
                ),
            )


class ManifestTests(unittest.TestCase):
    @staticmethod
    def _manifest(fingerprint="a" * 64, chunk_count=2):
        return {
            "manifest_schema_version": 1,
            "pipeline_version": "knowledge-v3",
            "metadata_schema_version": 1,
            "chunker_version": "semantic-units-v2",
            "fingerprint": fingerprint,
            "knowledge_version": "knowledge-v3-test",
            "collection_version": f"rag-v3-{fingerprint[:12]}",
            "collection_name": "dong_son_knowledge_v3",
            "build_path": f"builds/{fingerprint}",
            "corpus_checksum": "b" * 64,
            "collection_checksum": "c" * 64,
            "chunk_count": chunk_count,
            "chunk_config_name": "balanced",
            "embedding_model": "gemini-embedding-001",
            "embedding_dimensions": 768,
        }

    def test_fingerprint_and_collection_checksum_cover_content(self):
        fingerprint = build_fingerprint(
            "a" * 64,
            {"max_chars": 1000, "overlap_units": 1},
            "gemini-embedding-001",
            768,
        )
        self.assertRegex(fingerprint, r"^[0-9a-f]{64}$")
        chunks = [
            {"id": "a", "text": "Nội dung", "metadata": {"source": "a.md"}}
        ]
        baseline = collection_checksum(chunks)
        changed = [
            {"id": "a", "text": "Nội dung đổi", "metadata": {"source": "a.md"}}
        ]
        self.assertNotEqual(baseline, collection_checksum(changed))
        self.assertNotEqual(
            embeddings_checksum(chunks, [[1.0, 0.0]]),
            embeddings_checksum(chunks, [[0.0, 1.0]]),
        )

    def test_exclusive_file_lock_blocks_a_second_writer(self):
        with tempfile.TemporaryDirectory() as temporary:
            lock_path = Path(temporary) / "fingerprint.lock"
            result = []

            def contender():
                try:
                    with exclusive_file_lock(
                        lock_path, timeout=0.05, poll_interval=0.01
                    ):
                        result.append("acquired")
                except CollectionManifestError:
                    result.append("timed_out")

            with exclusive_file_lock(lock_path, timeout=1):
                thread = threading.Thread(target=contender)
                thread.start()
                thread.join(timeout=1)
            self.assertFalse(thread.is_alive())
            self.assertEqual(result, ["timed_out"])

    def test_deep_check_rejects_count_and_metadata_mismatch(self):
        manifest = self._manifest()
        expected_metadata = {
            "pipeline_version": "knowledge-v3",
            "fingerprint": manifest["fingerprint"],
            "corpus_checksum": manifest["corpus_checksum"],
            "chunk_config": "balanced",
            "embedding_model": "gemini-embedding-001",
            "embedding_dimensions": 768,
            "chunker_version": "semantic-units-v2",
        }
        with tempfile.TemporaryDirectory() as temporary:
            build_dir = Path(temporary)
            (build_dir / "chroma.sqlite3").touch()
            (build_dir / "manifest.json").write_text(
                json.dumps(manifest), encoding="utf-8"
            )
            client = mock.Mock()
            collection = client.get_collection.return_value
            collection.metadata = expected_metadata
            collection.count.return_value = 1
            with mock.patch("chromadb.PersistentClient", return_value=client):
                with self.assertRaisesRegex(CollectionManifestError, "1/2 chunks"):
                    verify_collection_build(manifest, build_dir)

            collection.count.return_value = 2
            collection.metadata = {**expected_metadata, "fingerprint": "d" * 64}
            with mock.patch("chromadb.PersistentClient", return_value=client):
                with self.assertRaisesRegex(CollectionManifestError, "metadata"):
                    verify_collection_build(manifest, build_dir)

    def test_status_compares_full_desired_fingerprint_not_only_corpus(self):
        active = self._manifest(fingerprint="a" * 64)
        desired = {
            "fingerprint": "d" * 64,
            "corpus_checksum": active["corpus_checksum"],
            "chunk_config_name": "balanced",
            "chunk_config": {"max_chars": 1000, "overlap_units": 1},
            "chunker_version": "semantic-units-v2",
            "embedding_model": active["embedding_model"],
            "embedding_dimensions": active["embedding_dimensions"],
        }
        with (
            mock.patch.object(manifest_service, "load_active_manifest", return_value=active),
            mock.patch.object(manifest_service, "runtime_build_dir"),
            mock.patch.object(
                manifest_service, "desired_build_identity", return_value=desired
            ),
        ):
            status = get_knowledge_status(check_source=True, config_name="balanced")
        self.assertTrue(status["ready"])
        self.assertFalse(status["in_sync"])
        self.assertEqual(status["current_corpus_checksum"], active["corpus_checksum"])
        self.assertEqual(status["desired_fingerprint"], desired["fingerprint"])

    def test_vercel_runtime_copy_recovers_partial_target_via_staging(self):
        manifest = self._manifest()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source"
            runtime_root = root / "runtime"
            target = runtime_root / manifest["fingerprint"]
            source.mkdir()
            (source / "valid.snapshot").write_text("ok", encoding="utf-8")
            target.mkdir(parents=True)
            (target / "partial.snapshot").write_text("bad", encoding="utf-8")

            def fake_verify(_manifest, path, allow_building=False):
                path = Path(path)
                if not (path / "valid.snapshot").is_file():
                    raise CollectionManifestError("partial")
                return path

            with (
                mock.patch.dict(os.environ, {"VERCEL": "1"}),
                mock.patch.object(manifest_service, "RUNTIME_CHROMA_V3_ROOT", runtime_root),
                mock.patch.object(manifest_service, "resolve_build_dir", return_value=source),
                mock.patch.object(
                    manifest_service, "verify_collection_build", side_effect=fake_verify
                ),
            ):
                result = runtime_build_dir(manifest)

            self.assertEqual(result, target)
            self.assertTrue((target / "valid.snapshot").is_file())
            self.assertFalse((target / "partial.snapshot").exists())
            self.assertEqual(list(runtime_root.glob(".*.staging")), [])

    def test_watcher_rebuilds_when_full_fingerprint_changes(self):
        from scripts import ingest_knowledge_v3 as ingest

        desired = {
            "fingerprint": "d" * 64,
            "corpus_checksum": "b" * 64,
            "chunk_config_name": "balanced",
            "chunker_version": "semantic-units-v2",
            "embedding_model": "gemini-embedding-001",
            "embedding_dimensions": 768,
        }
        with (
            mock.patch.object(ingest, "load_and_validate", return_value=([{}], {})),
            mock.patch.object(
                ingest, "desired_build_identity", return_value=desired
            ),
            mock.patch.object(
                ingest,
                "get_knowledge_status",
                return_value={"ready": True, "fingerprint": "a" * 64},
            ),
            mock.patch.object(ingest, "build_collection") as build_collection_mock,
            mock.patch.object(ingest.time, "sleep", side_effect=KeyboardInterrupt),
        ):
            self.assertEqual(ingest.watch("balanced", 1, Path("benchmark.json")), 0)
        build_collection_mock.assert_called_once_with(
            config_name="balanced",
            activate=True,
            benchmark_report=Path("benchmark.json"),
        )


class V3RoutingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        dataset = json.loads(
            (BASE_DIR / "evaluation" / "rag_eval_dataset.json").read_text(
                encoding="utf-8"
            )
        )
        cls.questions = {
            question["id"]: question["text"]
            for case in dataset["cases"]
            for question in case["questions"]
        }

    def test_v3_is_default_but_v2_and_legacy_remain_available(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            self.assertEqual(retrieval_version(), "v3")
        for version in ("v2", "legacy"):
            with mock.patch.dict("os.environ", {"RAG_RETRIEVAL_VERSION": version}):
                self.assertEqual(retrieval_version(), version)

    def test_tan_long_is_answerable_except_unverified_storage_location(self):
        profile = understand_query(self.questions["artifact-007-a"])
        storage = understand_query(self.questions["artifact-008-b"])
        self.assertEqual(profile["intent"], INTENT_ARTIFACT)
        self.assertFalse(profile["should_reject"])
        self.assertTrue(storage["should_reject"])
        self.assertEqual(storage["rejection_reason"], "missing_knowledge")

    def test_unverified_solar_symbol_meaning_is_rejected(self):
        for question in (
            "Hình mặt trời giữa trống đồng có ý nghĩa gì?",
            "Tại sao biểu tượng ngôi sao lại nằm ở tâm mặt trống?",
        ):
            query = understand_query(question)
            self.assertTrue(query["should_reject"])
            self.assertEqual(query["rejection_reason"], "missing_knowledge")

    def test_heritage_faq_is_no_longer_classified_as_account_game(self):
        self.assertEqual(
            classify_source_intent("knowledge/faq/faq.md"),
            INTENT_KNOWLEDGE,
        )

    def test_artifact_navigation_question_routes_to_website(self):
        query = understand_query(
            "Hồ sơ hiện vật trống Ngọc Lũ nằm ở đâu trên website?"
        )
        self.assertEqual(query["intent"], INTENT_WEBSITE)
        self.assertFalse(query["should_reject"])

    def test_semantic_filter_excludes_low_confidence_sources(self):
        from services.rag_v3_service import _semantic_candidates

        class FakeCollection:
            def __init__(self):
                self.where = None

            def count(self):
                return 5

            def query(self, **kwargs):
                self.where = kwargs["where"]
                return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

        collection = FakeCollection()
        query = understand_query("Trống Ngọc Lũ có gì nổi bật?")
        _semantic_candidates(
            collection,
            query,
            "heritage",
            5,
            query_embedding=[0.0, 1.0],
        )
        self.assertIn({"confidence": {"$ne": "low"}}, collection.where["$and"])

    @unittest.skipUnless(ACTIVE_MANIFEST_PATH.is_file(), "Chưa có active V3 build")
    def test_active_collection_routes_heritage_and_website_without_api_call(self):
        from services.rag_v3_service import get_v3_collection, search_v3

        collection = get_v3_collection()
        scenarios = (
            (
                "artifact-007-a",
                "knowledge/artifacts/tan_long.md",
                "heritage",
            ),
            (
                "web-005-b",
                "knowledge/website/tai_khoan.md",
                "website",
            ),
        )
        for question_id, expected_source, expected_corpus in scenarios:
            stored = collection.get(
                where={"source": expected_source},
                include=["embeddings"],
            )
            vector = stored["embeddings"][0]
            if hasattr(vector, "tolist"):
                vector = vector.tolist()
            chunks = search_v3(
                self.questions[question_id],
                top_k=3,
                query_embedding=vector,
            )
            self.assertIn(expected_source, [chunk["source"] for chunk in chunks])
            self.assertTrue(
                all(chunk["corpus"] == expected_corpus for chunk in chunks)
            )
            self.assertTrue(
                all(chunk["collection_version"].startswith("rag-v3-") for chunk in chunks)
            )

    @unittest.skipUnless(ACTIVE_MANIFEST_PATH.is_file(), "Chưa có active V3 build")
    @mock.patch("services.chat_service.rag_analytics_service.record_interaction")
    @mock.patch("services.chat_service.generate_answer")
    @mock.patch("services.chat_service.search_relevant_chunks")
    def test_chat_response_exposes_active_knowledge_version(
        self,
        search_chunks,
        generate_answer,
        record_interaction,
    ):
        from services.chat_service import ask_chatbot

        search_chunks.return_value = [
            {
                "content": "Trống Tân Long thuộc Heger II.",
                "source": "knowledge/artifacts/tan_long.md",
                "title": "Trống Tân Long",
                "filename": "tan_long.md",
                "section_index": 0,
                "chunk_index": 0,
                "distance": 0.1,
                "confidence": 0.9,
                "type": "rag_chunk_v3",
            }
        ]
        generate_answer.return_value = "Câu trả lời thử nghiệm."
        record_interaction.return_value = "00000000-0000-0000-0000-000000000001"
        result = ask_chatbot({"question": self.questions["artifact-007-a"]})
        self.assertEqual(result["retrieval_version"], "v3")
        self.assertTrue(result["knowledge_version"].startswith("knowledge-v3-"))
        self.assertTrue(result["collection_version"].startswith("rag-v3-"))
        self.assertRegex(result["corpus_checksum"], r"^[0-9a-f]{64}$")

    @mock.patch("services.chat_service.get_chat_status")
    @mock.patch("services.chat_service.rag_analytics_service.record_interaction")
    @mock.patch("services.chat_service.generate_answer")
    @mock.patch("services.chat_service.search_relevant_chunks")
    def test_chat_response_keeps_retrieval_snapshot_when_active_changes(
        self,
        search_chunks,
        generate_answer,
        record_interaction,
        get_status,
    ):
        from services.chat_service import ask_chatbot

        old_checksum = "a" * 64
        search_chunks.return_value = [
            {
                "content": "Trống Tân Long thuộc Heger II.",
                "source": "knowledge/artifacts/tan_long.md",
                "title": "Trống Tân Long",
                "filename": "tan_long.md",
                "section_index": 0,
                "chunk_index": 0,
                "distance": 0.1,
                "confidence": 0.9,
                "knowledge_version": "knowledge-v3-old",
                "collection_version": "rag-v3-old",
                "corpus_checksum": old_checksum,
                "type": "rag_chunk_v3",
            }
        ]
        generate_answer.return_value = "Câu trả lời thử nghiệm."
        record_interaction.return_value = "00000000-0000-0000-0000-000000000001"
        get_status.return_value = {
            "knowledge_version": "knowledge-v3-new",
            "collection_version": "rag-v3-new",
            "corpus_checksum": "b" * 64,
        }

        result = ask_chatbot({"question": self.questions["artifact-007-a"]})

        self.assertEqual(result["knowledge_version"], "knowledge-v3-old")
        self.assertEqual(result["collection_version"], "rag-v3-old")
        self.assertEqual(result["corpus_checksum"], old_checksum)
        get_status.assert_not_called()


if __name__ == "__main__":
    unittest.main()
