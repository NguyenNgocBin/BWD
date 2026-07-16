import os
import sys
import unittest
from pathlib import Path
from unittest import mock


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config.settings import Settings, load_settings
from database.bootstrap import initialize_database
from services.chat_service import _include_full_context
from services.embedding_service import (
    EmbeddingRateLimitError,
    GeminiEmbeddingFunction,
)
from services.game_session_service import GameSessionError, parse_non_negative_int
from services.rag_service import build_rag_context


class ApplicationFactoryTests(unittest.TestCase):
    def test_app_factory_has_health_route_without_database_side_effect(self):
        from app import create_app

        settings = Settings(debug=False, cors_origins="*")
        with mock.patch("config.db.get_connection") as get_connection:
            application = create_app(settings)
            response = application.test_client().get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})
        self.assertFalse(application.debug)
        get_connection.assert_not_called()

    def test_settings_keep_debug_off_unless_explicitly_enabled(self):
        with mock.patch.dict(
            os.environ,
            {"APP_ENV": "production", "APP_DEBUG": "false", "PORT": "70000"},
            clear=True,
        ):
            settings = load_settings()

        self.assertEqual(settings.app_env, "production")
        self.assertFalse(settings.debug)
        self.assertEqual(settings.port, 5000)


class DatabaseBootstrapTests(unittest.TestCase):
    @mock.patch("database.bootstrap.load_schema", return_value="select 1;")
    @mock.patch("database.bootstrap.db.get_connection")
    def test_schema_runs_only_through_explicit_initializer(self, get_connection, _load):
        connection = get_connection.return_value.__enter__.return_value
        cursor = connection.cursor.return_value.__enter__.return_value

        initialize_database()

        cursor.execute.assert_called_once_with("select 1;")


class RuntimeSafetyTests(unittest.TestCase):
    def test_query_embedding_uses_one_key_one_attempt_and_no_sleep(self):
        with mock.patch.dict(
            os.environ,
            {
                "GEMINI_API_KEYS": "first-key,second-key",
                "RAG_EMBEDDING_DIMENSIONS": "2",
                "RAG_QUERY_EMBEDDING_TIMEOUT": "4",
            },
            clear=False,
        ):
            embedding = GeminiEmbeddingFunction()
            with mock.patch.object(
                embedding,
                "_post_batch",
                side_effect=EmbeddingRateLimitError("quota", retry_after=55),
            ) as post_batch, mock.patch("services.embedding_service.time.sleep") as sleep:
                with self.assertRaises(EmbeddingRateLimitError):
                    embedding.embed_query(["trống đồng"])

        self.assertEqual(post_batch.call_count, 1)
        self.assertEqual(post_batch.call_args.args[0], "first-key")
        self.assertEqual(post_batch.call_args.kwargs["timeout"], 4)
        sleep.assert_not_called()

    def test_production_never_returns_full_context(self):
        with mock.patch.dict(
            os.environ,
            {"APP_ENV": "production", "CHAT_INCLUDE_CONTEXT": "true"},
            clear=False,
        ):
            self.assertFalse(_include_full_context())

    def test_llm_context_does_not_contain_internal_path_or_chunk_index(self):
        context = build_rag_context(
            [
                {
                    "source": "knowledge/artifacts/ngoc_lu.md",
                    "chunk_index": 17,
                    "document_title": "Trống Ngọc Lũ",
                    "title": "Hoa văn",
                    "review_status": "reviewed",
                    "document_confidence": "high",
                    "content": "Nội dung đã kiểm chứng.",
                }
            ]
        )
        self.assertNotIn("knowledge/", context)
        self.assertNotIn("chunk 17", context)
        self.assertIn("Trống Ngọc Lũ", context)

    def test_game_validation_uses_its_own_domain_error(self):
        with self.assertRaises(GameSessionError):
            parse_non_negative_int("không-phải-số", "score")


if __name__ == "__main__":
    unittest.main()
