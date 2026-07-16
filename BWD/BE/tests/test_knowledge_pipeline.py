import copy
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from services.knowledge_pipeline_service import (
    CHUNK_CONFIGS,
    FrontmatterError,
    MetadataValidationError,
    audit_corpus,
    build_semantic_chunks,
    compute_collection_fingerprint,
    compute_corpus_checksum,
    load_knowledge_documents,
    parse_yaml_frontmatter,
    validate_document_metadata,
)


def valid_metadata(document_id="heritage.test", **overrides):
    metadata = {
        "schema_version": "1.0",
        "document_id": document_id,
        "title": "Trống đồng thử nghiệm",
        "corpus": "heritage",
        "topic": "trống đồng Đông Sơn",
        "entities": ["ngoc_lu", "hoa_van"],
        "references": ["https://example.org/reference"],
        "updated_at": "2026-07-14",
        "reviewed_by": "Ban biên tập",
        "review_status": "reviewed",
        "confidence": "high",
        "retrieval_enabled": True,
        "document_type": "artifact_profile",
    }
    metadata.update(overrides)
    return metadata


def yaml_document(body, metadata=None):
    metadata = metadata or valid_metadata()
    lines = ["---"]
    for key, value in metadata.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            lines.extend(f"  - {item}" for item in value)
        elif isinstance(value, bool):
            lines.append(f"{key}: {'true' if value else 'false'}")
        else:
            lines.append(f"{key}: {value}")
    lines.extend(["---", body])
    return "\n".join(lines)


def loaded_document(body, document_id="heritage.test", **metadata_overrides):
    metadata = valid_metadata(document_id, **metadata_overrides)
    content = yaml_document(body, metadata)
    return {
        "source": f"knowledge/{document_id}.md",
        "filename": f"{document_id}.md",
        "content": content,
        "body": body,
        "metadata": metadata,
        "source_sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
    }


class StrictFrontmatterTests(unittest.TestCase):
    def test_parse_frontmatter_rejects_missing_and_duplicate_keys(self):
        with self.assertRaises(FrontmatterError):
            parse_yaml_frontmatter("# Không có metadata", "missing.md")

        duplicate = "---\ntitle: A\ntitle: B\n---\nNội dung"
        with self.assertRaisesRegex(FrontmatterError, "duplicate key"):
            parse_yaml_frontmatter(duplicate, "duplicate.md")

    def test_metadata_schema_is_strict_and_normalizes_yaml_date(self):
        content = yaml_document("# Nội dung")
        metadata, body = parse_yaml_frontmatter(content)
        normalized = validate_document_metadata(
            {"source": "knowledge/good.md", "metadata": metadata}
        )
        self.assertEqual(normalized["updated_at"], "2026-07-14")
        self.assertEqual(body, "# Nội dung")

        bad = valid_metadata(corpus="mixed", confidence="certain", retrieval_enabled="yes")
        with self.assertRaises(MetadataValidationError) as caught:
            validate_document_metadata({"source": "bad.md", "metadata": bad})
        message = str(caught.exception)
        self.assertIn("`corpus`", message)
        self.assertIn("`confidence`", message)
        self.assertIn("`retrieval_enabled`", message)

    def test_load_documents_returns_required_shape_and_non_strict_audit_input(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "knowledge"
            (root / "artifacts").mkdir(parents=True)
            good_content = yaml_document("# Tân Long\n\nNội dung đã kiểm chứng.")
            (root / "artifacts" / "tan_long.md").write_text(good_content, encoding="utf-8")
            (root / "empty.md").write_text("", encoding="utf-8")

            with self.assertRaises(FrontmatterError):
                load_knowledge_documents(root)

            documents = load_knowledge_documents(root, strict=False)
            good = next(item for item in documents if item["filename"] == "tan_long.md")
            self.assertEqual(good["source"], "knowledge/artifacts/tan_long.md")
            self.assertEqual(
                good["source_sha256"],
                hashlib.sha256(good_content.encode("utf-8")).hexdigest(),
            )
            self.assertEqual(
                {"source", "content", "body", "metadata", "source_sha256"} - set(good),
                set(),
            )
            empty = next(item for item in documents if item["filename"] == "empty.md")
            self.assertTrue(empty["validation_errors"])


class CorpusAuditTests(unittest.TestCase):
    def test_audit_finds_empty_exact_and_near_duplicates(self):
        exact_body = (
            "Trống đồng Đông Sơn là hiện vật khảo cổ tiêu biểu. "
            "Hoa văn phản ánh đời sống và kỹ thuật đúc đồng cổ."
        )
        near_body = exact_body.replace("tiêu biểu", "đặc sắc")
        documents = [
            loaded_document(exact_body, "doc.a"),
            loaded_document(exact_body.upper(), "doc.b"),
            loaded_document(near_body, "doc.c"),
            loaded_document("", "doc.empty"),
        ]

        report = audit_corpus(documents, near_duplicate_threshold=0.80)
        self.assertEqual(report["document_count"], 4)
        self.assertEqual(report["empty_documents"], ["knowledge/doc.empty.md"])
        self.assertEqual(len(report["exact_duplicates"]), 1)
        self.assertEqual(
            report["exact_duplicates"][0]["sources"],
            ["knowledge/doc.a.md", "knowledge/doc.b.md"],
        )
        self.assertTrue(report["near_duplicates"])
        self.assertFalse(report["is_clean"])


class SemanticChunkTests(unittest.TestCase):
    def setUp(self):
        paragraphs = [
            f"Đoạn {index}: " + (f"nội dung lịch sử thứ {index} " * 14).strip() + "."
            for index in range(1, 6)
        ]
        long_answer = " ".join(["Thông tin kiểm chứng"] * 70)
        self.body = (
            "# Trống đồng thử nghiệm\n\n"
            + "\n\n".join(paragraphs)
            + "\n\n## Hoa văn\n\nMô tả hoa văn chính."
            + "\n\n### Trống có hoa văn gì?\n\n"
            + f"**Câu trả lời:** {long_answer}"
        )
        self.document = loaded_document(self.body)

    def test_named_chunk_configs_have_expected_size_and_overlap(self):
        self.assertEqual(CHUNK_CONFIGS["compact"], {"max_chars": 700, "overlap_units": 0})
        self.assertEqual(CHUNK_CONFIGS["balanced"], {"max_chars": 1000, "overlap_units": 1})
        self.assertEqual(CHUNK_CONFIGS["broad"], {"max_chars": 1400, "overlap_units": 1})

        compact = build_semantic_chunks([self.document], "compact")
        balanced = build_semantic_chunks([self.document], "balanced")
        broad = build_semantic_chunks([self.document], "broad")
        for config_name, chunks in (
            ("compact", compact),
            ("balanced", balanced),
            ("broad", broad),
        ):
            self.assertTrue(chunks)
            self.assertTrue(
                all(chunk["metadata"]["chunk_config"] == config_name for chunk in chunks)
            )
            ordinary_chunks = [
                chunk for chunk in chunks if chunk["metadata"]["chunk_kind"] != "qa"
            ]
            self.assertTrue(
                all(
                    len(chunk["text"]) <= CHUNK_CONFIGS[config_name]["max_chars"]
                    for chunk in ordinary_chunks
                )
            )

    def test_chunk_preserves_heading_hierarchy_and_keeps_qa_atomic(self):
        chunks = build_semantic_chunks([self.document], "compact")
        qa_chunks = [chunk for chunk in chunks if chunk["metadata"]["chunk_kind"] == "qa"]
        self.assertEqual(len(qa_chunks), 1)
        qa = qa_chunks[0]
        self.assertIn("**Câu trả lời:**", qa["text"])
        self.assertGreater(len(qa["text"]), CHUNK_CONFIGS["compact"]["max_chars"])
        self.assertEqual(
            qa["metadata"]["heading_path"],
            "Trống đồng thử nghiệm > Hoa văn > Trống có hoa văn gì?",
        )
        self.assertEqual(qa["metadata"]["parent_heading"], "Hoa văn")
        self.assertIn("Đường dẫn:", qa["embed_text"])

    def test_colon_at_end_of_camera_does_not_turn_section_into_qa(self):
        document = loaded_document(
            "# Trò chơi\n\n## Quiz camera\n\n"
            "Cách chơi bằng camera:\n\n"
            + " ".join(["Hướng dẫn thao tác an toàn"] * 90)
        )
        chunks = build_semantic_chunks([document], "balanced")
        self.assertGreater(len(chunks), 1)
        self.assertTrue(
            all(chunk["metadata"]["chunk_kind"] == "semantic" for chunk in chunks)
        )
        self.assertTrue(
            all(len(chunk["text"]) <= CHUNK_CONFIGS["balanced"]["max_chars"] for chunk in chunks)
        )

    def test_real_camera_quiz_section_respects_balanced_limit(self):
        chunks = build_semantic_chunks(load_knowledge_documents(), "balanced")
        camera_chunks = [
            chunk
            for chunk in chunks
            if chunk["metadata"]["source"] == "knowledge/website/tro_choi.md"
            and "Quiz camera" in chunk["metadata"]["heading_path"]
        ]
        self.assertGreater(len(camera_chunks), 1)
        self.assertTrue(
            all(chunk["metadata"]["chunk_kind"] == "semantic" for chunk in camera_chunks)
        )
        self.assertTrue(
            all(
                len(chunk["text"]) <= CHUNK_CONFIGS["balanced"]["max_chars"]
                for chunk in camera_chunks
            )
        )

    def test_chunk_metadata_contains_only_chroma_scalars(self):
        chunks = build_semantic_chunks([self.document], "balanced")
        self.assertTrue(chunks)
        for chunk in chunks:
            self.assertEqual(set(chunk), {"id", "text", "embed_text", "metadata"})
            self.assertRegex(chunk["id"], r"^[0-9a-f]{64}$")
            for value in chunk["metadata"].values():
                self.assertIsInstance(value, (str, int, float, bool))
            self.assertEqual(chunk["metadata"]["entities"], "ngoc_lu,hoa_van")
            self.assertEqual(chunk["metadata"]["entity_ids"], "ngoc_lu")
            self.assertEqual(
                json.loads(chunk["metadata"]["references"]),
                ["https://example.org/reference"],
            )
            self.assertEqual(chunk["metadata"]["document_confidence"], "high")
            self.assertEqual(chunk["metadata"]["intent"], "dong_son_knowledge")

    def test_retrieval_disabled_document_is_not_chunked(self):
        disabled = copy.deepcopy(self.document)
        disabled["metadata"]["retrieval_enabled"] = False
        self.assertEqual(build_semantic_chunks([disabled]), [])

    def test_document_can_exclude_operational_headings_from_retrieval(self):
        document = loaded_document(
            "# Hướng dẫn\n\nNội dung người dùng.\n\n"
            "## Vận hành nội bộ\n\nKhông đưa mục này vào RAG.",
            retrieval_exclude_headings=["Vận hành nội bộ"],
        )
        chunks = build_semantic_chunks([document])
        self.assertTrue(chunks)
        self.assertFalse(
            any("Vận hành nội bộ" in chunk["metadata"]["heading_path"] for chunk in chunks)
        )


class FingerprintTests(unittest.TestCase):
    def test_checksum_is_order_independent_and_changes_with_source_content(self):
        first = loaded_document("Nội dung A", "doc.a")
        second = loaded_document("Nội dung B", "doc.b")
        checksum = compute_corpus_checksum([first, second])
        self.assertEqual(checksum, compute_corpus_checksum([second, first]))

        changed = loaded_document("Nội dung B đã sửa", "doc.b")
        self.assertNotEqual(checksum, compute_corpus_checksum([first, changed]))

    def test_collection_fingerprint_covers_embedding_and_chunk_configuration(self):
        documents = [loaded_document("Nội dung A", "doc.a")]
        checksum = compute_corpus_checksum(documents)
        baseline = compute_collection_fingerprint(
            checksum,
            "gemini-embedding-001",
            768,
            "balanced",
            collection_name="dong_son_knowledge_v3",
        )
        self.assertEqual(
            baseline,
            compute_collection_fingerprint(
                documents=documents,
                embedding_model="gemini-embedding-001",
                embedding_dimensions=768,
                chunk_config_name="balanced",
                collection_name="dong_son_knowledge_v3",
            ),
        )
        self.assertNotEqual(
            baseline,
            compute_collection_fingerprint(
                checksum,
                "gemini-embedding-001",
                768,
                "compact",
                collection_name="dong_son_knowledge_v3",
            ),
        )
        self.assertNotEqual(
            baseline,
            compute_collection_fingerprint(
                checksum,
                "another-embedding-model",
                768,
                "balanced",
                collection_name="dong_son_knowledge_v3",
            ),
        )


if __name__ == "__main__":
    unittest.main()
