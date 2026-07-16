# Hướng dẫn vai trò từng file trong Backend

> Cập nhật theo mã nguồn ngày 14/07/2026. Tài liệu này giải thích các file trong `BWD/BE` dùng để làm gì, được gọi từ đâu và khi nào nên sửa. Các file nhị phân do Chroma/Python sinh ra được giải thích theo nhóm vì không phải mã nguồn và không nên chỉnh tay.

## 1. Cách hiểu cấu trúc backend

Luồng API thông thường đi theo thứ tự:

```text
Frontend
  -> routes: URL nào nhận request
  -> controllers: đọc request và tạo HTTP response
  -> services: kiểm tra dữ liệu và xử lý nghiệp vụ
  -> repositories: chạy SQL
  -> config/db.py: kết nối PostgreSQL
```

Có thể hiểu đơn giản:

- `routes` là bảng chỉ đường.
- `controllers` là lớp tiếp nhận và trả lời HTTP.
- `services` là nơi quyết định nghiệp vụ phải làm gì.
- `repositories` là nơi duy nhất nên biết chi tiết SQL.
- `database` chứa cấu trúc bảng.
- `knowledge`, `evaluation` và nhóm service RAG tạo thành hệ thống chatbox.

Ví dụ luồng đăng nhập:

```text
POST /api/v1/auth/login
  -> routes/auth_routes.py
  -> controllers/auth_controller.py
  -> services/auth_service.py
  -> repositories/user_repo.py
  -> config/db.py
```

Ví dụ luồng chat:

```text
POST /api/v1/chat/ask
  -> routes/chat_routes.py
  -> controllers/chat_controller.py
  -> services/chat_service.py
       -> conversation_service.py
       -> query_understanding_service.py
       -> rag_service.py -> rag_v3_service.py
       -> hybrid_retrieval_service.py + embedding_service.py
       -> llm_service.py
       -> rag_analytics_service.py -> repositories/rag_log_repo.py
```

## 2. Các file ở thư mục gốc `BE`

| File | Tác dụng | Khi nào cần sửa |
|---|---|---|
| `.env` | Chứa cấu hình bí mật/cục bộ như URL database, JWT secret, Gemini key, model và các ngưỡng RAG. File bị Git bỏ qua. | Sửa khi đổi môi trường chạy. Không gửi file này lên Git hoặc chia sẻ khóa thật. |
| `.gitignore` | Quy định file nào trong BE không được Git theo dõi, ví dụ `.env`, cache Python và `node_modules`. | Sửa khi dự án sinh thêm file tạm hoặc file bí mật. |
| `app.py` | Điểm vào Flask. Hàm `create_app()` tạo ứng dụng, cấu hình CORS, đăng ký các blueprint và cung cấp `/` cùng `/health`. Biến `app` được Vercel/WSGI sử dụng. File này không tự kết nối hay sửa database. | Sửa khi thêm một nhóm route mới, đổi cấu hình Flask chung hoặc thêm health check. Không đặt nghiệp vụ/SQL ở đây. |
| `requirements.txt` | Danh sách thư viện Python cần cài: Flask, CORS, JWT, bcrypt, PostgreSQL, ChromaDB, YAML… | Sửa khi thêm/bỏ package. Nên ghim phiên bản trước khi deploy production. |
| `vercel.json` | Báo cho Vercel dùng `app.py` làm Python serverless entrypoint và chuyển mọi URL về ứng dụng Flask. | Sửa khi đổi nền tảng deploy hoặc đổi entrypoint. |
| `ARCHITECTURE.md` | Ghi quy tắc phụ thuộc giữa route/controller/service/repository, ranh giới các module RAG, lệnh kiểm tra và nợ kỹ thuật. | Đọc trước khi refactor; cập nhật khi kiến trúc thay đổi. |
| `FILE_GUIDE.md` | Chính là tài liệu này: bản đồ giải thích từng file cho người đọc code. | Cập nhật khi thêm, xóa hoặc đổi trách nhiệm của file. |
| `__pycache__/` và `*.pyc` | Bytecode Python sinh tự động để import nhanh hơn. Không phải mã nguồn. | Không sửa và không commit. Có thể xóa khi server đã dừng; Python sẽ tự tạo lại. |

## 3. Thư mục `config` — cấu hình hệ thống

| File | Tác dụng | Được dùng bởi |
|---|---|---|
| `config/__init__.py` | Đánh dấu `config` là Python package. Không chứa nghiệp vụ. | Python import system. |
| `config/settings.py` | Đọc cấu hình ứng dụng cơ bản từ environment: `APP_ENV`, debug, host, port và CORS origins. Có class `Settings` để truyền cấu hình rõ ràng vào application factory. | `app.py`, test application factory. |
| `config/db.py` | Chuẩn hóa `DATABASE_URL`, bổ sung SSL cho Supabase, tạo connection pool psycopg2 và cung cấp `get_connection()`, `fetch_one()`, `fetch_all()`, `execute()`. | Tất cả repository và database bootstrap. |

Lưu ý: `settings.py` hiện quản lý cấu hình Flask chung; một số biến RAG/provider vẫn được đọc trực tiếp trong service tương ứng.

## 4. Thư mục `routes` — khai báo URL API

Route chỉ nên khai báo URL, HTTP method, middleware và controller đích.

| File | Endpoint được khai báo | Controller/middleware liên quan |
|---|---|---|
| `routes/__init__.py` | Không có endpoint; đánh dấu package. | Python import system. |
| `routes/auth_routes.py` | `POST /register`, `POST /login`, `GET /me`, `POST /logout`, `PUT /change-password`, `PUT /profile` dưới prefix `/api/v1/auth`. | `auth_controller.py`, `auth_middleware.require_auth`. |
| `routes/chat_routes.py` | `POST /ask`, `POST /feedback`, `GET /status` dưới prefix `/api/v1/chat`. | `chat_controller.py`. |
| `routes/game_session_routes.py` | `POST /` để lưu lượt chơi và `GET /me` để lấy lịch sử dưới prefix `/api/v1/game-sessions`. | `game_session_controller.py`; cả hai yêu cầu đăng nhập. |
| `routes/leaderboard_routes.py` | `GET /` dưới prefix `/api/v1/leaderboard`. | `leaderboard_controller.py`; dùng `optional_auth` để vẫn xem được khi chưa đăng nhập. |
| `routes/progression_routes.py` | `GET /me` dưới prefix `/api/v1/progression`. | `progression_controller.py`; yêu cầu đăng nhập. |

Khi thêm API mới, tạo controller/service trước rồi mới nối URL ở đây. Không viết SQL hoặc xử lý dữ liệu dài trong route.

## 5. Thư mục `controllers` — lớp HTTP

Controller biết Flask request/response nhưng không nên chứa SQL hoặc nghiệp vụ phức tạp.

| File | Tác dụng | Gọi service nào |
|---|---|---|
| `controllers/__init__.py` | Đánh dấu package. | Python import system. |
| `controllers/auth_controller.py` | Đọc JSON đăng ký/đăng nhập/cập nhật hồ sơ/đổi mật khẩu, lấy `g.current_user`, chuyển `AuthError` thành JSON và status code. | `services/auth_service.py`. |
| `controllers/chat_controller.py` | Tạo/kiểm tra request ID, xử lý `/ask`, `/feedback`, `/status`, thêm `X-Request-ID`, ghi lỗi kỹ thuật có cấu trúc và không lộ chi tiết provider ra client. | `chat_service.py`, `rag_analytics_service.py`. |
| `controllers/game_session_controller.py` | Nhận kết quả game, trả status `201`, lấy lịch sử chơi và chuyển `GameSessionError` thành response. | `game_session_service.py`. |
| `controllers/leaderboard_controller.py` | Đọc query `scope`, `limit`, `period`, `group`, lấy user tùy chọn và trả bảng xếp hạng. | `leaderboard_service.py`. |
| `controllers/progression_controller.py` | Trả thành tựu và nhiệm vụ hằng ngày của user đang đăng nhập. | `progression_service.py`. |

## 6. Thư mục `middlewares` — xử lý trước controller

| File | Tác dụng | Điểm cần nhớ |
|---|---|---|
| `middlewares/__init__.py` | Đánh dấu package. | Không có nghiệp vụ. |
| `middlewares/auth_middleware.py` | Đọc Bearer JWT, kiểm tra chữ ký/hết hạn, tải user từ database và gắn vào `flask.g.current_user`. Cung cấp `require_auth` và `optional_auth`. | `require_auth` chặn request thiếu/sai token; `optional_auth` cho khách đi tiếp nhưng vẫn nhận diện user nếu token hợp lệ. |

## 7. Thư mục `services` — nghiệp vụ chính

### 7.1. Tài khoản, game, xếp hạng và tiến trình

| File | Tác dụng | Gọi sang |
|---|---|---|
| `services/__init__.py` | Đánh dấu package service. | Python import system. |
| `services/auth_service.py` | Kiểm tra username/email/password, đăng ký, đăng nhập, tạo JWT, đổi mật khẩu, cập nhật hồ sơ và định dạng dữ liệu user trả về frontend. | `user_repo.py`, `utils/hash.py`. |
| `services/game_session_service.py` | Kiểm tra payload điểm không âm, accuracy, số câu, metadata và trạng thái game; lưu một lượt chơi; lấy thứ hạng mới; đánh giá lại progression; định dạng lịch sử game. | `game_repo.py`, `game_session_repo.py`, `leaderboard_repo.py`, `progression_service.py`. |
| `services/leaderboard_service.py` | Kiểm tra `scope/period/group/limit`, chọn truy vấn phù hợp, định dạng entry công khai, tìm game tốt nhất, thêm huy hiệu nổi bật và tạo phần dữ liệu riêng cho user hiện tại. | `leaderboard_repo.py`, `user_repo.py`, `progression_service.py`. |
| `services/progression_service.py` | Định nghĩa nhiệm vụ hằng ngày, tính tiến độ, mở khóa achievement, định dạng huy hiệu và cache kết quả 30 giây. | `progression_repo.py`. |

### 7.2. Điều phối chat và sinh câu trả lời

| File | Tác dụng | Gọi sang |
|---|---|---|
| `services/chat_service.py` | Bộ điều phối chính của một lượt chat: kiểm tra request, chuẩn hóa history, viết lại câu nối tiếp, hiểu intent, truy xuất chunk, lọc nguồn tin cậy, gọi LLM, tạo fallback/gợi ý, ghi analytics và trả version/checksum. | `conversation_service.py`, `query_understanding_service.py`, `rag_service.py`, `llm_service.py`, `rag_analytics_service.py`. |
| `services/conversation_service.py` | Kiểm tra cấu trúc tối đa 6 tin nhắn gần nhất và viết lại câu nối tiếp như “nó có gì?” thành câu độc lập dựa trên thực thể ở lịch sử. Hoạt động offline, không gọi LLM. | Được `chat_service.py` gọi. |
| `services/llm_service.py` | Kiểm tra context đủ tốt, tạo prompt bắt buộc citation `[1]`, `[2]`, gọi Gemini sinh câu trả lời, chuẩn hóa lỗi provider và xác nhận citation không vượt quá số nguồn có thật. | Gemini HTTP API; được `chat_service.py` gọi. |

### 7.3. Hiểu câu hỏi và truy xuất RAG

| File | Tác dụng | Khi nào được dùng |
|---|---|---|
| `services/query_understanding_service.py` | Chuẩn hóa Unicode/chữ thường/không dấu, sửa lỗi phổ biến, nhận diện alias hiện vật, phân loại intent, chọn nhóm nguồn được phép và từ chối sớm câu ngoài phạm vi/thiếu dữ liệu. | Trước mọi lần retrieval V2/V3 và trong benchmark. |
| `services/rag_service.py` | Facade công khai của RAG. Chọn `v3`, `v2` hoặc `legacy`; chọn tối đa 3 nguồn không trùng; tạo context cho LLM; tạo source card an toàn cho frontend. | `chat_service.py`; chuyển tiếp sang service retrieval theo version. |
| `services/rag_v3_service.py` | Retrieval đang dùng chính thức. Mở build active theo manifest, tách corpus `heritage/website`, semantic search với metadata filter, chạy BM25 và rerank rồi gắn version/checksum vào từng chunk. | Mặc định khi `RAG_RETRIEVAL_VERSION=v3`. |
| `services/rag_v2_service.py` | Retrieval semantic thế hệ trước, dùng collection `chroma_v2`, intent filter, semantic search + BM25 + rerank. | Chỉ dùng khi rollback sang `v2`. |
| `services/rag_legacy_service.py` | Retrieval hash cũ trên `vector_store/chroma`; kết hợp khoảng cách vector hash và keyword overlap. | Chỉ dùng khi rollback khẩn cấp sang `legacy`. |
| `services/hybrid_retrieval_service.py` | Chứa thuật toán dùng chung: làm sạch token, BM25, keyword overlap, reciprocal-rank fusion và heuristic reranker. | `rag_v2_service.py`, `rag_v3_service.py`, benchmark chunking. |

### 7.4. Embedding, knowledge và version collection

| File | Tác dụng | Điểm cần nhớ |
|---|---|---|
| `services/embedding_service.py` | Adapter Gemini embedding tương thích Chroma. Document và query dùng task type riêng. Query runtime chỉ gọi một key/một lần với timeout ngắn; ingest có policy riêng. | Đây là nơi đổi model embedding hoặc cách xử lý quota. Không lưu câu hỏi thật vào cache. |
| `services/legacy_embedding_service.py` | Tạo vector hash cục bộ 384 chiều cho collection legacy. | Chỉ phục vụ ingest/search legacy, không phải embedding semantic hiện tại. |
| `services/embedding_cache_service.py` | Cache vector bằng SQLite theo checksum của text, model, dimension và task type; tách cache document với cache query đánh giá công khai. | Giảm số lần gọi embedding khi ingest/evaluate lại. |
| `services/knowledge_pipeline_service.py` | Đọc YAML frontmatter, kiểm tra metadata bắt buộc, phát hiện file rỗng/trùng, tách Markdown thành semantic units/chunks, giữ heading cha và tính checksum/fingerprint. | Là lõi xử lý `knowledge/**/*.md`; sửa rất cẩn thận vì ảnh hưởng toàn collection. |
| `services/collection_manifest_service.py` | Quản lý build V3 bất biến: khóa tiến trình, checksum chunk/vector, fingerprint, manifest, deep verification, kích hoạt `active.json`, copy an toàn trên Vercel và báo trạng thái đồng bộ. | Bảo đảm ingest lỗi không làm hỏng build đang phục vụ. |

### 7.5. Theo dõi chất lượng RAG

| File | Tác dụng | Gọi sang |
|---|---|---|
| `services/rag_analytics_service.py` | Kiểm tra bật/tắt logging, rút gọn danh sách chunk/score, che dữ liệu nhạy cảm, ghi một lượt tương tác và xử lý phản hồi hữu ích/chưa đúng. | `utils/rag_privacy.py`, `rag_log_repo.py`. |

## 8. Thư mục `repositories` — giao tiếp PostgreSQL

Repository trả row từ database cho service; không nên tự tạo Flask response.

| File | Tác dụng | Bảng chính |
|---|---|---|
| `repositories/__init__.py` | Đánh dấu package repository. | Không có SQL. |
| `repositories/user_repo.py` | Class `User`, chuyển row thành object, tìm user theo id/email/username, tạo user, đổi password và cập nhật hồ sơ. | `users`. |
| `repositories/game_repo.py` | Class `Game`, chuyển row thành object và tìm game theo `code`. | `games`. |
| `repositories/game_session_repo.py` | Trong một transaction: thêm `game_sessions`, upsert `user_game_stats`, tính lại `users.total_score` bằng tổng best score từng game; đồng thời cung cấp lịch sử chơi gần đây. | `game_sessions`, `user_game_stats`, `users`, `games`. |
| `repositories/leaderboard_repo.py` | Chứa các CTE/window query để tính bảng tổng hoặc từng game, dense rank, best session, lọc hôm nay/tuần/lớp và tìm riêng thứ hạng một user. | `game_sessions`, `user_game_stats`, `users`, `games`. |
| `repositories/progression_repo.py` | Tính rule achievement, nhiệm vụ theo ngày Việt Nam, mở khóa achievement, lấy toàn bộ achievement và huy hiệu nổi bật theo user. | `achievements`, `user_achievements`, `game_sessions`, `user_game_stats`. |
| `repositories/rag_log_repo.py` | Ghi log tương tác RAG đã ẩn danh và cập nhật phản hồi hữu ích/lý do. | `rag_interaction_logs`. |

## 9. Thư mục `database` — cấu trúc dữ liệu

| File | Tác dụng | Cách dùng |
|---|---|---|
| `database/__init__.py` | Đánh dấu package database. | Python import system. |
| `database/bootstrap.py` | Đọc toàn bộ `schema.sql` và thực thi khi người vận hành chủ động gọi. Import Flask không chạy file này. | Được `scripts/init_database.py` gọi. |
| `database/schema.sql` | Tạo bảng/index/view, seed game/level/quiz/achievement, bổ sung `class_group` và đồng bộ một số dữ liệu. Các bảng chính: `users`, `games`, `game_levels`, `game_questions`, `game_sessions`, `user_game_stats`, `achievements`, `user_achievements`, `rag_interaction_logs`; có `leaderboard_view`. | Chạy bằng `python scripts/init_database.py`. Hiện là schema idempotent kèm seed, chưa phải migration history. |

Không sửa database bằng cách đặt `cursor.execute()` trong `app.py`. Khi schema lớn hơn, nên chuyển thay đổi mới sang Alembic/Flask-Migrate.

## 10. Thư mục `scripts` — các lệnh vận hành chủ động

| File | Tác dụng | Có gọi provider không? |
|---|---|---|
| `scripts/__init__.py` | Đánh dấu package scripts. | Không. |
| `scripts/init_database.py` | Entry point gọi `database.bootstrap.initialize_database()` và báo thành công/thất bại. | Không gọi AI nhưng có thay đổi PostgreSQL. |
| `scripts/audit_knowledge.py` | Đọc knowledge, kiểm tra metadata/file rỗng/trùng, tính checksum và ghi báo cáo `knowledge-audit-v3.json`. | Không. |
| `scripts/ingest_knowledge.py` | Pipeline legacy: đọc Markdown, chunk cố định, tạo lại collection hash trong `vector_store/chroma`. | Không gọi API; chỉ dùng hash local. |
| `scripts/ingest_knowledge_v2.py` | Tạo hoặc cập nhật collection semantic V2 và bổ sung metadata intent/topic/entity. | Có thể gọi Gemini embedding. Chỉ dùng cho rollback V2. |
| `scripts/ingest_knowledge_v3.py` | Pipeline chính: validate/audit knowledge, semantic chunk, dùng cache embedding, tạo build fingerprint bất biến, deep-check rồi mới kích hoạt. Có các chế độ `--validate-only`, `--check`, `--watch`, `--no-activate`. | `--validate-only` và `--check` không gọi provider; build mới có thể gọi Gemini cho cache miss. |

## 11. Thư mục `evaluation` — đo chất lượng RAG

| File | Tác dụng | Có nên sửa tay? |
|---|---|---|
| `evaluation/__init__.py` | Đánh dấu package evaluation. | Thường không cần sửa. |
| `evaluation/README.md` | Hướng dẫn dataset, metric, benchmark và quy trình cập nhật RAG. | Cập nhật khi thay quy trình đánh giá. |
| `evaluation/rag_eval_dataset.json` | Golden set gồm 60 case/120 câu, đáp án tham chiếu, nguồn mong đợi và nhãn answerable. | Có; bổ sung khi knowledge hoặc loại câu hỏi thực tế thay đổi. Phải giữ dữ liệu công khai, không đưa PII. |
| `evaluation/run_rag_eval.py` | Validate dataset hoặc chạy retrieval theo version đang cấu hình; tính Hit@K, Source Recall, MRR, false accept/reject và ghi report. | Sửa khi thêm metric hoặc đổi schema dataset. Chế độ retrieval semantic có thể gọi embedding provider. |
| `evaluation/benchmark_chunking.py` | So sánh `compact`, `balanced`, `broad` bằng nhánh BM25 offline và chọn cấu hình ổn định. | Sửa khi đổi cách chấm/chunk; không gọi Gemini. |
| `evaluation/results/baseline-local-hash.json` | Kết quả baseline của RAG hash cũ. | Giữ để so sánh; chỉ tạo lại có chủ đích. |
| `evaluation/results/semantic-v2-hybrid-final.json` | Báo cáo semantic hybrid V2 sau tinh chỉnh. | Là mốc rollback/so sánh, không phải cấu hình runtime. |
| `evaluation/results/chunking-benchmark-v3.json` | Kết quả benchmark ba kích thước chunk và config được chọn. | Được script benchmark tạo lại. |
| `evaluation/results/knowledge-audit-v3.json` | Snapshot audit kho knowledge: số file, lỗi metadata, file rỗng/trùng và checksum. | Được script audit tạo lại. |

## 12. Thư mục `knowledge` — nguồn tri thức cho chatbox

Mỗi file knowledge có YAML frontmatter gồm các metadata như tiêu đề, corpus, topic, entity, nguồn tham khảo, ngày cập nhật, người duyệt, độ tin cậy và trạng thái retrieval. Nội dung ở đây mới là nguồn gốc; vector store chỉ là dữ liệu được sinh lại từ các file này.

### 12.1. Hồ sơ hiện vật `knowledge/artifacts`

| File | Nội dung cung cấp cho RAG |
|---|---|
| `knowledge/artifacts/ngoc_lu.md` | Hồ sơ trống Ngọc Lũ: phát hiện, cấu tạo, hoa văn, giá trị và các câu hỏi thường gặp. |
| `knowledge/artifacts/hoang_ha.md` | Hồ sơ trống Hoàng Hạ: bối cảnh phát hiện, đặc điểm, hoa văn và so sánh liên quan. |
| `knowledge/artifacts/co_loa.md` | Hồ sơ trống Cổ Loa và bối cảnh di tích/không gian Âu Lạc. |
| `knowledge/artifacts/tan_long.md` | Hồ sơ trống Tân Long loại Heger II, nơi phát hiện, đặc điểm và giới hạn dữ liệu chưa được xác nhận. |

### 12.2. Kiến thức Đông Sơn `knowledge/dong_son`

| File | Nội dung cung cấp cho RAG |
|---|---|
| `knowledge/dong_son/van_hoa_dong_son.md` | Tổng quan văn hóa Đông Sơn, cư dân Việt cổ, thời gian, không gian và đời sống. |
| `knowledge/dong_son/trong_dong.md` | Định nghĩa, chức năng, phân bố và giá trị tổng quan của trống đồng Đông Sơn. |
| `knowledge/dong_son/cau_tao.md` | Các phần mặt/tang/thân/chân và diễn biến kiểu dáng trống. |
| `knowledge/dong_son/heger.md` | Hệ thống phân loại Heger I–IV, đặc điểm và phạm vi áp dụng. |
| `knowledge/dong_son/hoa_van.md` | Các nhóm hoa văn, bố cục, cảnh sinh hoạt và cách diễn giải thận trọng. |
| `knowledge/dong_son/chim_lac.md` | Hình chim trên trống, đặc điểm tạo hình và giới hạn của các cách gọi/diễn giải biểu tượng. |
| `knowledge/dong_son/mat_troi.md` | Hình ngôi sao trung tâm, số tia và các giả thuyết diễn giải; nguồn độ tin cậy thấp bị retrieval loại khi cần. |
| `knowledge/dong_son/ky_thuat_duc_dong.md` | Nguyên liệu, khuôn đúc, hợp kim, quy trình và trình độ luyện kim Đông Sơn. |

### 12.3. FAQ và quiz

| File | Nội dung | Có được index vào RAG? |
|---|---|---|
| `knowledge/faq/faq.md` | Hỏi–đáp thường gặp về trống đồng, văn hóa, công dụng và các vấn đề cơ bản. | Có. |
| `knowledge/quiz/basic_quiz.md` | Ngân hàng câu hỏi cơ bản phục vụ quiz/biên tập nội dung. | Không (`retrieval_enabled: false`) để tránh đáp án quiz lẫn vào chat. |
| `knowledge/quiz/advanced_quiz.md` | Câu hỏi nâng cao/phái sinh để tham khảo trò chơi. | Không (`retrieval_enabled: false`). |

### 12.4. Hướng dẫn website `knowledge/website`

| File | Nội dung cung cấp cho RAG |
|---|---|
| `knowledge/website/homepage.md` | Tổng quan website và đường đi tới các chức năng chính. |
| `knowledge/website/hoc_vui.md` | Cách dùng trang Học vui và lộ trình học. |
| `knowledge/website/tai_lieu.md` | Cách đọc/tìm nội dung trong trang Tài liệu. |
| `knowledge/website/trien_lam.md` | Cách mở, xoay, xem mô hình và fallback của triển lãm 3D. |
| `knowledge/website/ban_do.md` | Cách dùng bản đồ, marker và thông tin địa điểm. |
| `knowledge/website/tro_choi.md` | Danh sách game, luật chơi, cách tính/lưu điểm và điều kiện đăng nhập. |
| `knowledge/website/tai_khoan.md` | Đăng ký, đăng nhập, hồ sơ, đổi mật khẩu và các giới hạn hiện có. |
| `knowledge/website/xep_hang.md` | Scope, bộ lọc thời gian/lớp, điểm và cách xem thứ hạng. |
| `knowledge/website/chatbox.md` | Phạm vi chatbox, cách hỏi, nguồn, feedback và fallback. |
| `knowledge/website/website_qa.md` | Các câu hỏi nhanh về cách sử dụng toàn website. |

Sau khi sửa knowledge:

```bash
python scripts/audit_knowledge.py
python scripts/ingest_knowledge_v3.py --validate-only
python scripts/ingest_knowledge_v3.py --check
```

Nếu `--check` báo lệch, chỉ chạy build mới khi chấp nhận dùng embedding quota.

## 13. Thư mục `tests` — kiểm tra hồi quy

| File | Phạm vi kiểm tra |
|---|---|
| `tests/__init__.py` | Đánh dấu package test. |
| `tests/test_backend_cleanup.py` | Application factory không chạm DB, debug mặc định tắt, bootstrap chủ động, embedding query không retry/sleep, production không lộ context và game dùng lỗi riêng. |
| `tests/test_chat_phase4.py` | History, viết lại câu nối tiếp, citation, nguồn, fallback confidence thấp, lỗi provider, request ID và response chat an toàn. |
| `tests/test_knowledge_pipeline.py` | Frontmatter chặt chẽ, metadata, audit trùng/rỗng, semantic chunk, QA atomic, config chunk và fingerprint. |
| `tests/test_rag_phase1.py` | Dataset tối thiểu 100 câu, đáp án/nguồn, che dữ liệu nhạy cảm, hash ổn định, log ẩn danh và feedback. |
| `tests/test_rag_v2.py` | Chuẩn hóa tiếng Việt, entity/intent, từ chối ngoài phạm vi, embedding normalize, tách collection và hybrid BM25/rerank. |
| `tests/test_rag_v3.py` | Cache embedding, manifest/checksum/lock, Vercel staging, watcher, V3 routing/filter, Tân Long, source version snapshot và rollback. |

Chạy toàn bộ:

```bash
python -m unittest discover -s tests -v
```

Các test hiện dùng mock/offline và không cần gọi Gemini thật.

## 14. Thư mục `utils` — hàm dùng chung nhỏ

| File | Tác dụng | Được dùng bởi |
|---|---|---|
| `utils/__init__.py` | Đánh dấu package utility. | Python import system. |
| `utils/hash.py` | Hash password bằng bcrypt và so sánh password với hash. | `auth_service.py`. |
| `utils/rag_privacy.py` | Che email, số điện thoại, token, password khỏi câu hỏi log; tạo SHA-256 ổn định cho câu hỏi đã chuẩn hóa. | `rag_analytics_service.py`, test privacy. |

## 15. Thư mục `vector_store` — dữ liệu vector sinh tự động

Không chỉnh trực tiếp bất kỳ file SQLite/HNSW/binary nào trong thư mục này.

| File/thư mục | Tác dụng |
|---|---|
| `vector_store/README.md` | Quy tắc quản lý vector store và cảnh báo không xóa build active. |
| `vector_store/embedding_cache.sqlite3` | Cache vector embedding để ingest/evaluation không gọi lại provider cho cùng input. File runtime, đã ignore khỏi Git. |
| `vector_store/chroma/` | Collection hash legacy dùng để rollback. |
| `vector_store/chroma_v2/` | Collection semantic V2 dùng để rollback. |
| `vector_store/chroma_v3/active.json` | Con trỏ/manifest cho biết build V3 nào đang được backend phục vụ. Đây là file quan trọng nhất để xác định version active. |
| `vector_store/chroma_v3/builds/<fingerprint>/manifest.json` | Mô tả một build bất biến: checksum, model, dimension, số chunk, file knowledge và config chunk. |
| `vector_store/chroma_v3/builds/<fingerprint>/chroma.sqlite3` | Metadata/document/index của collection Chroma thuộc build đó. |
| `data_level0.bin`, `header.bin`, `length.bin`, `link_lists.bin` | Các file HNSW index nội bộ do Chroma tạo; tên UUID cha cũng do Chroma sinh. |
| `vector_store/chroma_v3/builds/.locks/` | File khóa giúp hai tiến trình không cùng ghi một fingerprint. |

Quy tắc an toàn:

- Không xóa build được `active.json` trỏ tới.
- Không trộn file giữa `chroma`, `chroma_v2` và `chroma_v3`.
- Không copy riêng lẻ các file `.bin`.
- Dùng `python scripts/ingest_knowledge_v3.py --check` để kiểm tra trước khi dọn dữ liệu cũ.

## 16. Khi muốn thay đổi một chức năng thì sửa file nào?

| Nhu cầu | Bắt đầu từ file | Các file thường liên quan |
|---|---|---|
| Thêm endpoint mới | `routes/*_routes.py` | controller, service, repository tương ứng; đăng ký blueprint trong `app.py` nếu là nhóm mới. |
| Sửa quy tắc đăng nhập/hồ sơ | `services/auth_service.py` | `auth_controller.py`, `user_repo.py`, `auth_middleware.py`. |
| Sửa cách lưu điểm | `services/game_session_service.py` | `game_session_repo.py`, `schema.sql`, frontend game. |
| Sửa cách xếp hạng | `services/leaderboard_service.py` | `leaderboard_repo.py`, `progression_service.py`. |
| Thêm huy hiệu/nhiệm vụ | `progression_service.py` | `progression_repo.py`, seed `schema.sql`. |
| Bổ sung kiến thức chatbox | `knowledge/**/*.md` | dataset evaluation, audit và ingest V3. |
| Sửa nhận diện câu hỏi | `query_understanding_service.py` | test RAG V2/V3 và golden dataset. |
| Sửa thuật toán retrieval | `hybrid_retrieval_service.py` hoặc `rag_v3_service.py` | benchmark, evaluator và test V2/V3. |
| Đổi embedding model | `embedding_service.py` và biến môi trường | phải tạo build/collection mới; không trộn vector cũ. |
| Đổi prompt/model sinh câu trả lời | `llm_service.py` | `chat_service.py`, test citation và đánh giá end-to-end. |
| Sửa metadata/chunk knowledge | `knowledge_pipeline_service.py` | manifest service, audit, benchmark và ingest V3. |
| Sửa bảng database | `database/schema.sql` | repository/service liên quan; chạy `scripts/init_database.py`. |
| Sửa deploy | `vercel.json`, environment của nền tảng | `app.py`, `config/settings.py`. |

## 17. Thứ tự đọc code dành cho người mới

1. Đọc `app.py` để biết những nhóm API nào tồn tại.
2. Chọn một file trong `routes` để biết URL gọi controller nào.
3. Mở controller tương ứng để thấy dữ liệu HTTP được lấy ra sao.
4. Mở service tương ứng để hiểu quy tắc nghiệp vụ.
5. Chỉ mở repository khi cần hiểu SQL và bảng database.
6. Với chatbox, đọc lần lượt `chat_service.py` → `query_understanding_service.py` → `rag_service.py` → `rag_v3_service.py` → `hybrid_retrieval_service.py` → `llm_service.py`.
7. Đọc test tương ứng trước khi sửa để biết hành vi nào phải được giữ nguyên.

Tài liệu này mô tả trách nhiệm ở mức file. Chi tiết nguyên tắc phụ thuộc và nợ kỹ thuật nằm trong `ARCHITECTURE.md`; hướng dẫn cài/chạy toàn dự án nằm trong `BWD/README.md`.
