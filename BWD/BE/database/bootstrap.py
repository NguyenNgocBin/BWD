"""Explicit database bootstrap; importing the Flask app never runs this code."""

from pathlib import Path

import config.db as db


SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def load_schema(schema_path=SCHEMA_PATH):
    path = Path(schema_path)
    if not path.is_file():
        raise RuntimeError(f"Khong tim thay database schema: {path}")

    sql_script = path.read_text(encoding="utf-8").strip()
    if not sql_script:
        raise RuntimeError(f"Database schema dang rong: {path}")
    return sql_script


def initialize_database(schema_path=SCHEMA_PATH):
    """Apply the idempotent schema in one explicit database operation."""

    sql_script = load_schema(schema_path)
    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql_script)
