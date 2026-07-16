# Vector store runtime

Thư mục này chứa dữ liệu Chroma sinh từ `knowledge/**/*.md`, không phải nơi biên tập nội dung.

- `chroma_v3/active.json`: manifest của build V3 đang hoạt động.
- `chroma_v3/builds/<fingerprint>/`: các build V3 bất biến.
- `chroma_v2/`: semantic V2 để rollback.
- `chroma/`: hash legacy để rollback.
- `embedding_cache.sqlite3*`: cache cục bộ, đã được ignore khỏi Git.

Không sửa file Chroma bằng tay, không trộn collection giữa các version và không xóa build active. Dùng `python scripts/ingest_knowledge_v3.py --check` để kiểm tra đồng bộ; dùng lệnh ingest không có `--check` chỉ khi chấp nhận gọi embedding provider.
