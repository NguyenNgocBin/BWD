# Kiến trúc backend

Tài liệu này mô tả ranh giới module đang được áp dụng sau đợt clean ngày 14/07/2026. Mục tiêu là giữ API hiện tại nhưng tránh để khởi động ứng dụng, nghiệp vụ, SQL và pipeline RAG phụ thuộc lẫn nhau.

## Luồng phụ thuộc chính

```text
HTTP request
  -> routes/          khai báo URL, method và middleware
  -> controllers/     đọc request, gọi use case, tạo HTTP response
  -> services/        validation và nghiệp vụ
  -> repositories/    truy vấn PostgreSQL
  -> config/db.py     connection pool
```

Quy tắc:

- Route không chứa nghiệp vụ hoặc SQL.
- Controller không gọi repository trực tiếp.
- Service không phụ thuộc Flask request/response.
- Repository không quyết định thông báo hoặc status HTTP.
- Cấu hình môi trường của ứng dụng nằm ở `config/settings.py`; kết nối database nằm riêng ở `config/db.py`.

## Khởi động ứng dụng và database

`app.py` cung cấp `create_app()` và biến WSGI `app`. Import ứng dụng chỉ đăng ký route, không mở kết nối và không chạy `schema.sql`.

Khởi tạo hoặc cập nhật schema là thao tác chủ động:

```bash
python scripts/init_database.py
python app.py
```

`database/schema.sql` hiện vẫn là schema idempotent kèm seed, chưa phải lịch sử migration. Khi có nhiều môi trường hoặc nhiều người cùng phát triển, bước tiếp theo nên chuyển các thay đổi schema mới sang Alembic/Flask-Migrate; không đưa side effect database trở lại `app.py`.

## Ranh giới RAG

| Module | Trách nhiệm |
|---|---|
| `chat_service.py` | Điều phối một lượt chat, history, fallback, log và response metadata |
| `rag_service.py` | Facade chọn version; tạo context cho LLM và source card công khai |
| `rag_v3_service.py` | Truy xuất collection V3 active theo manifest và metadata filter |
| `rag_v2_service.py` | Collection semantic V2 để rollback |
| `rag_legacy_service.py` | Collection hash cũ, chỉ để rollback khẩn cấp |
| `hybrid_retrieval_service.py` | BM25, reciprocal-rank fusion và heuristic reranker dùng chung |
| `embedding_service.py` | Gemini embedding; query runtime fail-fast, ingest có policy riêng |
| `knowledge_pipeline_service.py` | Đọc metadata, audit và semantic chunking |
| `collection_manifest_service.py` | Build bất biến, active manifest, checksum và kiểm tra đồng bộ |

V3 không được import hàm private của V2. Câu hỏi runtime chỉ dùng key embedding đầu tiên, một lần gọi và timeout ngắn; không sleep hoặc thử lần lượt nhiều key trong request người dùng. Retry ingest là opt-in qua biến môi trường vì pipeline đã có cache/checkpoint.

## Dữ liệu sinh tự động

- `knowledge/**/*.md` là nguồn nội dung gốc cần review và version control.
- `vector_store/chroma_v3/active.json` chỉ tới build V3 đang phục vụ.
- `vector_store/chroma_v3/builds/<fingerprint>/` là output bất biến của ingest.
- `vector_store/chroma_v2/` và `vector_store/chroma/` chỉ giữ cho rollback; không trộn vector giữa các version.
- `embedding_cache.sqlite3*`, log và response thử nghiệm là runtime artifact, không phải mã nguồn.

Không xóa build mà `active.json` đang trỏ tới. Trước khi dọn build cũ, luôn chạy:

```bash
python scripts/ingest_knowledge_v3.py --check
```

## Lệnh kiểm tra chuẩn

Các kiểm tra mặc định không gọi Gemini thật:

```bash
python -m unittest discover -s tests -v
python -m compileall -q app.py config controllers database evaluation middlewares repositories routes scripts services tests utils
python scripts/ingest_knowledge_v3.py --validate-only
python scripts/ingest_knowledge_v3.py --check
```

Chỉ chạy ingest/evaluation semantic khi chủ động muốn dùng quota provider.

## Nợ kỹ thuật còn lại

- `knowledge_pipeline_service.py` và `collection_manifest_service.py` vẫn lớn; chỉ nên tách tiếp sau khi bổ sung characterization test cho từng chức năng.
- `leaderboard_repo.py` còn nhiều SQL gần giống nhau và chưa có integration test với PostgreSQL thật.
- Coverage auth, progression, leaderboard và các transaction game còn mỏng; hiện mới có test validation game cùng test RAG/chat.
- CI offline đã chạy test, compile, validate knowledge/dataset và benchmark chunking; semantic/LLM evaluation, integration PostgreSQL và kiểm tra deploy vẫn chưa tự động.
- Các controller ngoài chat chưa dùng chung một error envelope và structured logging.
