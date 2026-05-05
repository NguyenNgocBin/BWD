import os

import psycopg2
from psycopg2.extras import RealDictCursor


# Lay chuoi ket noi database tu bien moi truong va kiem tra gia tri co hop le khong.
def get_database_url():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL chua duoc cau hinh trong file .env")

    if "username:password@host" in database_url:
        raise RuntimeError("DATABASE_URL dang la gia tri mau. Hay thay bang connection string Supabase that.")

    return database_url.replace("postgres://", "postgresql://", 1)


# Tao ket noi moi toi Supabase Postgres de thuc thi truy van.
def get_connection():
    return psycopg2.connect(get_database_url(), cursor_factory=RealDictCursor)


# Chay truy van va lay ve duy nhat mot dong du lieu.
def fetch_one(query, params=None):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchone()


# Chay truy van va lay ve nhieu dong du lieu.
def fetch_all(query, params=None):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchall()


# Chay truy van insert, update, delete va co the lay ve mot dong neu can.
def execute(query, params=None, fetch_one_result=False):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            result = cursor.fetchone() if fetch_one_result else None
            connection.commit()
            return result
