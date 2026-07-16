import json
import math
import sys
import unittest
from pathlib import Path
from unittest import mock


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from scripts.ingest_knowledge import KNOWLEDGE_DIR, build_chunks, load_markdown_documents
from scripts.ingest_knowledge_v2 import CHROMA_V2_DIR, enrich_chunks
from services.embedding_service import _normalize_vector
from services.query_understanding_service import (
    INTENT_ACCOUNT_GAME,
    INTENT_AMBIGUOUS,
    INTENT_ARTIFACT,
    INTENT_OUT_OF_SCOPE,
    INTENT_WEBSITE,
    normalize_for_keyword,
    understand_query,
)
from services.hybrid_retrieval_service import bm25_rank, merge_and_rerank
from services.rag_service import retrieval_version


class QueryUnderstandingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        dataset_path = BASE_DIR / "evaluation" / "rag_eval_dataset.json"
        dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
        cls.questions = {
            question["id"]: question["text"]
            for case in dataset["cases"]
            for question in case["questions"]
        }

    def test_unicode_and_no_diacritic_normalization_match(self):
        accented = normalize_for_keyword("Trống đồng Đông Sơn là gì?")
        plain = normalize_for_keyword("trong dong dong son la gi")
        self.assertEqual(accented, plain)

    def test_named_artifact_intent_and_alias(self):
        result = understand_query(self.questions["artifact-002-a"])
        self.assertEqual(result["intent"], INTENT_ARTIFACT)
        self.assertIn("ngoc_lu", result["entities"])
        self.assertIn("Ngọc Lũ", result["expanded_text"])

    def test_website_and_account_intents(self):
        self.assertEqual(
            understand_query(self.questions["web-002-b"])["intent"],
            INTENT_WEBSITE,
        )
        self.assertEqual(
            understand_query(self.questions["web-009-a"])["intent"],
            INTENT_ACCOUNT_GAME,
        )
        self.assertEqual(
            understand_query(self.questions["web-005-b"])["intent"],
            INTENT_ACCOUNT_GAME,
        )
        self.assertEqual(
            understand_query(self.questions["artifact-010-b"])["intent"],
            INTENT_WEBSITE,
        )

    def test_out_of_scope_and_ambiguous_are_rejected_before_retrieval(self):
        out_of_scope = understand_query(self.questions["oos-001-a"])
        ambiguous = understand_query(self.questions["robust-005-a"])
        self.assertEqual(out_of_scope["intent"], INTENT_OUT_OF_SCOPE)
        self.assertEqual(ambiguous["intent"], INTENT_AMBIGUOUS)
        self.assertTrue(out_of_scope["should_reject"])
        self.assertTrue(ambiguous["should_reject"])

    def test_missing_knowledge_unsupported_feature_and_privacy_are_rejected(self):
        available = understand_query(self.questions["artifact-007-a"])
        missing = understand_query(self.questions["artifact-008-b"])
        unsupported = understand_query(self.questions["web-006-a"])
        privacy = understand_query(self.questions["oos-009-a"])
        self.assertFalse(available["should_reject"])
        self.assertIn("tan_long", available["entities"])
        self.assertTrue(missing["should_reject"])
        self.assertEqual(missing["rejection_reason"], "missing_knowledge")
        self.assertTrue(unsupported["should_reject"])
        self.assertEqual(unsupported["rejection_reason"], "unsupported_feature")
        self.assertTrue(privacy["should_reject"])
        self.assertEqual(privacy["intent"], INTENT_OUT_OF_SCOPE)


class SemanticEmbeddingTests(unittest.TestCase):
    def test_reduced_embedding_is_l2_normalized(self):
        vector = _normalize_vector([3, 4])
        self.assertAlmostEqual(math.sqrt(sum(value * value for value in vector)), 1.0)
        self.assertEqual(vector, [0.6, 0.8])

    def test_v2_collection_is_separate_from_legacy(self):
        self.assertEqual(CHROMA_V2_DIR.name, "chroma_v2")
        self.assertNotEqual(CHROMA_V2_DIR, BASE_DIR / "vector_store" / "chroma")

    def test_retrieval_version_can_rollback_without_mixing_collections(self):
        with mock.patch.dict("os.environ", {"RAG_RETRIEVAL_VERSION": "legacy"}):
            self.assertEqual(retrieval_version(), "legacy")
        with mock.patch.dict("os.environ", {"RAG_RETRIEVAL_VERSION": "v2"}):
            self.assertEqual(retrieval_version(), "v2")


class HybridRetrievalTests(unittest.TestCase):
    def test_v2_chunks_have_intent_topic_entities_and_version(self):
        chunks = enrich_chunks(build_chunks(load_markdown_documents(KNOWLEDGE_DIR)))
        self.assertGreater(len(chunks), 100)
        for chunk in chunks:
            metadata = chunk["metadata"]
            self.assertIn("intent", metadata)
            self.assertIn("topic", metadata)
            self.assertIn("entities", metadata)
            self.assertEqual(metadata["retrieval_version"], "v2")

    def test_heger_knowledge_contains_classification_instead_of_chim_lac_copy(self):
        content = (KNOWLEDGE_DIR / "dong_son" / "heger.md").read_text(encoding="utf-8")
        self.assertIn("Heger I", content)
        self.assertIn("Heger II", content)
        self.assertIn("Franz Heger", content)
        self.assertNotIn("# Câu hỏi thường gặp về Chim Lạc", content)

    def test_bm25_and_reranker_promote_relevant_document(self):
        corpus = [
            {
                "id": "right",
                "content": "Trống đồng Ngọc Lũ có hệ thống hoa văn phong phú.",
                "metadata": {
                    "intent": "artifact",
                    "heading": "Trống Ngọc Lũ",
                    "entities": "Trống Ngọc Lũ",
                    "entity_ids": "ngoc_lu",
                },
                "tokens": ["trong", "dong", "ngoc", "lu", "hoa", "van"],
            },
            {
                "id": "wrong",
                "content": "Hướng dẫn đổi mật khẩu tài khoản.",
                "metadata": {"intent": "account_game", "heading": "Tài khoản", "entities": ""},
                "tokens": ["doi", "mat", "khau", "tai", "khoan"],
            },
        ]
        lexical = bm25_rank("trong ngoc lu", corpus, ["artifact"], 10)
        self.assertEqual(lexical[0]["id"], "right")

        query_info = understand_query("Trống Ngọc Lũ có gì nổi bật?")
        semantic = [
            {
                **corpus[0],
                "distance": 0.2,
                "semantic_score": 0.8,
            }
        ]
        reranked = merge_and_rerank(query_info, semantic, lexical, 10)
        self.assertEqual(reranked[0]["id"], "right")
        self.assertEqual(reranked[0]["entity_score"], 1.0)
        self.assertGreater(reranked[0]["rerank_score"], 0.5)


if __name__ == "__main__":
    unittest.main()
