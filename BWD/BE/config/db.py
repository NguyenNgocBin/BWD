import os
import urllib.parse
from contextlib import contextmanager
from threading import Lock

import psycopg2
import psycopg2.extras
import psycopg2.pool


_connection_pool = None
_pool_lock = Lock()


# Lay chuoi ket noi database tu bien moi truong va kiem tra gia tri co hop le khong.
def get_database_url():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL chua duoc cau hinh trong file .env")

    if "username:password@host" in database_url or "[YOUR-PASSWORD]" in database_url:
        raise RuntimeError(
            "DATABASE_URL dang la gia tri mau. Hay thay bang connection string Supabase that."
        )

    database_url = database_url.replace("postgres://", "postgresql://", 1)
    parts = urllib.parse.urlsplit(database_url)

    if "supabase.com" in parts.hostname and "sslmode=" not in parts.query:
        query = dict(urllib.parse.parse_qsl(parts.query, keep_blank_values=True))
        query["sslmode"] = "require"
        database_url = urllib.parse.urlunsplit(
            (
                parts.scheme,
                parts.netloc,
                parts.path,
                urllib.parse.urlencode(query),
                parts.fragment,
            )
        )

    return database_url


# Tao ket noi moi toi Supabase Postgres de thuc thi truy van.
def _get_connection_pool():
    global _connection_pool
    if _connection_pool is None:
        with _pool_lock:
            if _connection_pool is None:
                _connection_pool = psycopg2.pool.ThreadedConnectionPool(
                    1,
                    10,
                    get_database_url(),
                    cursor_factory=psycopg2.extras.RealDictCursor,
                )
    return _connection_pool


@contextmanager
def get_connection():
    global _connection_pool
    pool = _get_connection_pool()
    connection = pool.getconn()
    is_broken = False
    try:
        if connection.closed != 0:
            try:
                pool.putconn(connection, close=True)
            except Exception:
                pass
            connection = pool.getconn()
        yield connection
        connection.commit()
    except (psycopg2.OperationalError, psycopg2.DatabaseError, psycopg2.InterfaceError):
        is_broken = True
        try:
            connection.rollback()
        except Exception:
            pass
        raise
    except Exception:
        try:
            connection.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            pool.putconn(connection, close=is_broken)
        except Exception:
            pass


# Chay truy van va lay ve duy nhat mot dong du lieu.
def fetch_one(query, params=None):
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()
    except (psycopg2.OperationalError, psycopg2.DatabaseError, psycopg2.InterfaceError):
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()


# Chay truy van va lay ve nhieu dong du lieu.
def fetch_all(query, params=None):
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()
    except (psycopg2.OperationalError, psycopg2.DatabaseError, psycopg2.InterfaceError):
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()


# Chay truy van insert, update, delete va co the lay ve mot dong neu can.
def execute(query, params=None, fetch_one_result=False):
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                result = cursor.fetchone() if fetch_one_result else None
                connection.commit()
                return result
    except (psycopg2.OperationalError, psycopg2.DatabaseError, psycopg2.InterfaceError):
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                result = cursor.fetchone() if fetch_one_result else None
                connection.commit()
                return result
