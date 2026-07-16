# Đông Sơn Digital Museum

Đông Sơn Digital Museum là website học tập và trò chơi tương tác về văn hóa Đông Sơn, tập trung vào trải nghiệm khám phá trống đồng, hoa văn, hiện vật và kiến thức lịch sử theo cách trực quan, dễ tiếp cận.

Dự án gồm frontend tĩnh viết bằng HTML/CSS/JavaScript và backend Flask kết nối PostgreSQL hoặc Supabase PostgreSQL. Backend đảm nhiệm xác thực tài khoản bằng JWT, quản lý hồ sơ người dùng, lưu lịch sử chơi game, thống kê điểm và dữ liệu bảng xếp hạng.

## Dự án có gì?

- Trang giới thiệu văn hóa Đông Sơn với hình ảnh, video và nội dung trực quan.
- Hệ thống đăng ký, đăng nhập, đăng xuất bằng JWT.
- Trang hồ sơ người dùng, hỗ trợ đồng bộ thông tin từ backend.
- Bảng xếp hạng và thống kê điểm người chơi.
- Chatbox RAG có hội thoại ngắn, trích dẫn nguồn mở được, câu hỏi gợi ý và phản hồi hữu ích/chưa đúng.
- Cụm trò chơi học tập:
  - Quiz đúng/sai về văn hóa Đông Sơn.
  - Tìm họa tiết trên trống đồng.
  - Ghép hình trống đồng.
- Database được khởi tạo chủ động bằng `BE/scripts/init_database.py`; import/chạy web app không tự sửa schema.
- Seed dữ liệu mặc định cho game, level và câu hỏi quiz.

## Công nghệ sử dụng

### Frontend

- HTML5
- CSS3
- JavaScript thuần
- Google Fonts: `Manrope`, `Newsreader`

### Backend

- Python
- Flask
- Flask-CORS
- PostgreSQL hoặc Supabase PostgreSQL
- bcrypt
- PyJWT
- python-dotenv
- psycopg2

## Yêu cầu môi trường

- Python 3.10 trở lên.
- PostgreSQL local hoặc Supabase PostgreSQL.
- Trình duyệt hiện đại như Chrome, Edge hoặc Firefox.
- Kết nối internet nếu dùng Supabase.

## Cấu trúc thư mục

Xem giải thích chi tiết tác dụng của từng file backend tại [`BE/FILE_GUIDE.md`](BE/FILE_GUIDE.md). Quy tắc phụ thuộc giữa các lớp nằm tại [`BE/ARCHITECTURE.md`](BE/ARCHITECTURE.md).

```text
BWD/
|-- BE/
|   |-- app.py
|   |-- ARCHITECTURE.md
|   |-- requirements.txt
|   |-- config/
|   |-- controllers/
|   |-- database/
|   |-- middlewares/
|   |-- repositories/
|   |-- routes/
|   |-- services/
|   `-- utils/
|-- FE/
|   |-- index.html
|   |-- css/
|   |-- images/
|   |-- js/
|   |-- pages/
|   |-- videos/
|   `-- skillFE.md
`-- README.md
```

## Cài đặt dự án

### 1. Tải mã nguồn

Di chuyển vào thư mục dự án:

```bash
cd BWD
```

### 2. Cài đặt backend

Di chuyển vào thư mục backend:

```bash
cd BE
```

Tạo môi trường ảo:

```bash
python -m venv .venv
```

Kích hoạt môi trường ảo trên Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Cài đặt thư viện:

```bash
pip install -r requirements.txt
```

Tạo file `.env` trong thư mục `BE`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-jwt-secret
PORT=5000
APP_ENV=development
APP_DEBUG=false
CORS_ORIGINS=http://localhost:5500

# RAG + LLM chatbox
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest

# Semantic RAG V3 (mặc định); đặt v2 để rollback
RAG_RETRIEVAL_VERSION=v3
RAG_EMBEDDING_MODEL=gemini-embedding-001
RAG_EMBEDDING_DIMENSIONS=768
RAG_EMBEDDING_REQUESTS_PER_MINUTE=80
RAG_QUERY_EMBEDDING_TIMEOUT=5
RAG_DOCUMENT_EMBEDDING_ATTEMPTS=1
RAG_MIN_CONFIDENCE=0.38
RAG_CHUNK_CONFIG=balanced

# RAG_MAX_DISTANCE chỉ còn dùng khi rollback về legacy hash
RAG_MAX_DISTANCE=1.35

# Bật/tắt log chất lượng RAG ẩn danh (mặc định true)
RAG_LOGGING_ENABLED=true

# Không gửi toàn bộ context RAG về trình duyệt (mặc định false)
CHAT_INCLUDE_CONTEXT=false
```

Nếu dùng Supabase, connection string thường có dạng:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres?sslmode=require
```

Lưu ý: không đưa file `.env` lên Git vì file này chứa thông tin kết nối database và khóa JWT.

### 3. Khởi tạo database và chạy backend

Sau khi cấu hình `DATABASE_URL`, áp dụng schema/seed một lần hoặc mỗi khi `schema.sql` thay đổi:

```bash
python scripts/init_database.py
```

Backend không còn chạy schema khi import `app.py`, vì vậy test, health check và tiến trình WSGI không tự tạo bảng hoặc seed dữ liệu.

Từ thư mục `BE`, chạy:

```bash
python app.py
```

Nếu chạy thành công, backend sẽ hoạt động tại:

```text
http://localhost:5000
```

Kiểm tra nhanh server:

```text
GET http://localhost:5000/health
```

Kết quả mong đợi:

```text
{"status":"ok"}
```

### 4. Chạy frontend

Frontend là website tĩnh, có thể mở trực tiếp file:

```text
FE/index.html
```

Tuy nhiên, nên chạy frontend bằng local server để tránh giới hạn của trình duyệt khi mở bằng `file://`.

Ví dụ dùng Python:

```bash
cd ../FE
python -m http.server 5500
```

Sau đó mở trình duyệt tại:

```text
http://localhost:5500
```

Frontend gọi backend tại port `5000`, vì vậy cần chạy Flask server trước khi sử dụng các chức năng đăng ký, đăng nhập, hồ sơ người dùng, lưu điểm game hoặc chatbox AI Đông Sơn.

### 5. Chuẩn bị RAG cho chatbox

Chatbox dùng ChromaDB để truy xuất các file Markdown trong `BE/knowledge`. Phiên bản mặc định là Semantic RAG V3, kế thừa embedding đa ngôn ngữ, chuẩn hóa tiếng Việt, intent filter, hybrid semantic–BM25 và reranker của V2; V3 bổ sung metadata bắt buộc, tách corpus lịch sử/website, semantic chunks giữ heading cha và manifest checksum.

Audit metadata, file rỗng và nội dung trùng:

```bash
cd BWD/BE
python scripts/audit_knowledge.py
```

So sánh ba cấu hình chunk `compact`, `balanced`, `broad` bằng bộ 120 câu:

```bash
python evaluation/benchmark_chunking.py --top-k 5
```

Validate rồi tạo và kích hoạt collection V3 bất biến:

```bash
python scripts/ingest_knowledge_v3.py --validate-only
python scripts/ingest_knowledge_v3.py --config balanced
```

Gemini free tier giới hạn số embedding theo phút. Embedding của knowledge công khai được cache cục bộ theo model, task type và checksum; khi tài liệu thay đổi, build mới chỉ gọi API cho semantic chunks chưa có trong cache. Câu hỏi người dùng thật không được lưu vào cache. Query runtime dùng một key, một lần gọi và timeout mặc định 5 giây; ingest mặc định không retry, có thể chủ động tăng `RAG_DOCUMENT_EMBEDDING_ATTEMPTS` khi chấp nhận chờ quota.

Mỗi build V3 nằm tại `BE/vector_store/chroma_v3/builds/<fingerprint>`. Backend chỉ đọc build trong `active.json`; pointer này được thay nguyên tử sau khi deep-check manifest, metadata và số chunk, nên ingest lỗi không làm hỏng bản đang chạy. Writer cùng fingerprint dùng khóa độc quyền liên tiến trình; trên Vercel, build được copy qua staging, xác minh rồi mới đổi tên nguyên tử trong `/tmp`.

Kiểm tra collection active có khớp toàn bộ fingerprint mong muốn hay không. Fingerprint bao gồm corpus, chunk config/chunker và embedding model/dimension, không chỉ nội dung Markdown:

```bash
python scripts/ingest_knowledge_v3.py --check
```

Tự ingest khi `knowledge/**/*.md` thay đổi trong môi trường phát triển:

```bash
python scripts/ingest_knowledge_v3.py --watch --interval 5
```

Không chạy watcher bên trong Flask/Vercel. Với production, chạy `--check` và ingest ở CI/build để tránh timeout hoặc nhiều process cùng ghi Chroma. V2 vẫn nằm ở `BE/vector_store/chroma_v2`; có thể rollback mà không trộn vector:

```env
RAG_RETRIEVAL_VERSION=v2
```

Cấu hình LLM sinh câu trả lời:

```env
# Gemini
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest
```

Khi người dùng hỏi, backend nhận tối đa 6 tin nhắn lịch sử gần nhất và viết lại câu nối tiếp bằng luật cục bộ, không gọi thêm LLM. Mỗi lượt vẫn được truy xuất lại độc lập: câu hỏi được chuẩn hóa, phân loại intent, tìm bằng semantic search và BM25, hợp nhất bằng reciprocal-rank fusion rồi rerank top 20. Tối đa 3 tài liệu đủ tin cậy và không trùng được đưa vào Gemini với mã `[1]`–`[3]`; câu trả lời bị fallback nếu thiếu nguồn hoặc dùng mã trích dẫn không tồn tại. Câu ngoài phạm vi, tính năng chưa có hoặc knowledge đang thiếu bị fallback trước khi gọi embedding/LLM.

Mỗi yêu cầu chỉ thử một Gemini API key và không fan-out sang các key khác khi free tier trả 429. Lỗi kỹ thuật chi tiết chỉ được ghi ở server cùng mã lỗi, provider, latency và request ID.

## API chính

Base URL:

```text
http://localhost:5000/api/v1
```

### Auth

```text
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/logout
PUT  /auth/change-password
PUT  /auth/profile
```

Các endpoint yêu cầu đăng nhập cần gửi header:

```http
Authorization: Bearer <token>
```

### Chat RAG

```text
POST /chat/ask
```

Body:

```json
{
  "question": "Nó là hiện vật gì?",
  "top_k": 5,
  "history": [
    {"role": "user", "content": "Hãy nói về trống Ngọc Lũ"},
    {"role": "assistant", "content": "Bạn muốn tìm hiểu phần nào?"}
  ]
}
```

`history` là tùy chọn. Backend chỉ dùng các lượt gần nhất để làm rõ đại từ/câu nối tiếp; mọi câu hỏi vẫn truy xuất lại nguồn và lịch sử không được coi là bằng chứng kiến thức.

Response chính:

```json
{
  "answer": "Trống Ngọc Lũ là một hiện vật trống đồng Đông Sơn tiêu biểu [1].",
  "question": "Nó là hiện vật gì?",
  "context": null,
  "sources": [
    {
      "id": 1,
      "citation": "[1]",
      "title": "Trống đồng Ngọc Lũ",
      "section_title": "Đặc điểm chung",
      "excerpt": "Đoạn trích nguồn ngắn dùng để kiểm tra câu trả lời...",
      "url": "/pages/hien-vat.html?id=ngoc-lu",
      "external_url": null,
      "source_type": "artifact"
    }
  ],
  "suggested_questions": [
    "Trống Ngọc Lũ có những hoa văn nổi bật nào?",
    "Trống Ngọc Lũ được phát hiện ở đâu?"
  ],
  "fallback": false,
  "fallback_reason": null,
  "interaction_id": "7c4c1808-9631-4ced-a0dd-7cebf10d52c4",
  "request_id": "request-01HR...",
  "query_rewritten": true,
  "retrieval_question": "Nó là hiện vật gì?\nChủ thể đang được hỏi: trống đồng Ngọc Lũ",
  "intent": "artifact",
  "retrieval_version": "v3",
  "knowledge_version": "knowledge-v3-966437aca17c",
  "collection_version": "rag-v3-b59c44aa3345",
  "corpus_checksum": "966437aca17c20b7891501ddedbdd453c702678273e305e7af18d255ed95e470"
}
```

`context` mặc định là `null` để không gửi toàn bộ nội dung truy xuất về frontend. Chỉ bật `CHAT_INCLUDE_CONTEXT=true` khi debug trong môi trường được kiểm soát; nếu `APP_ENV=production`, backend luôn bỏ qua cờ này. Context gửi tới LLM cũng không chứa đường dẫn file nội bộ hoặc chunk index. Mỗi source công khai chỉ gồm tiêu đề, đoạn trích ngắn và liên kết tới tài liệu/trang hiện vật; score, đường dẫn collection và metadata nội bộ không được trả về.

Client có thể gửi header `X-Request-ID`; nếu hợp lệ backend sẽ dùng lại, nếu không sẽ tự tạo UUID. Response luôn trả cùng ID trong header `X-Request-ID` và trường `request_id`. Lỗi chat có dạng ngắn gọn:

```json
{
  "message": "Chatbot tạm thời chưa thể tra cứu. Vui lòng thử lại sau.",
  "error_code": "chat_temporarily_unavailable",
  "request_id": "request-01HR..."
}
```

Xem version/checksum và phát hiện source đang lệch collection:

```text
GET /chat/status
```

Mỗi lượt chat được ghi log chất lượng mà không gắn tài khoản hoặc địa chỉ IP. Trước khi lưu, hệ thống che email, số điện thoại, token và mật khẩu; danh sách chunk chỉ lưu source/title/score, không lưu toàn bộ nội dung truy xuất hoặc lịch sử hội thoại. Lỗi analytics không làm hỏng câu trả lời chat. Lỗi kỹ thuật được ghi riêng ở server với mã lỗi, provider, latency và request ID nhưng không lộ chi tiết cho người dùng.

Gửi phản hồi hữu ích/không hữu ích:

```text
POST /chat/feedback
```

```json
{
  "interaction_id": "7c4c1808-9631-4ced-a0dd-7cebf10d52c4",
  "helpful": true,
  "reason": "Nguồn và nội dung phù hợp"
}
```

Frontend giữ tối đa 6 tin nhắn gần nhất trong bộ nhớ trang, hiển thị tối đa 3 nguồn kèm đoạn trích/link, câu hỏi gợi ý theo ngữ cảnh và các nút “Xem nguồn”, “Hỏi lại”, “Hữu ích/Chưa đúng”. “Hỏi lại” chỉ đưa câu cũ về ô nhập để chỉnh sửa, không tự gọi API. Có thể tắt toàn bộ ghi log bằng `RAG_LOGGING_ENABLED=false`.

### Đánh giá chất lượng RAG

Bộ đánh giá nằm tại `BE/evaluation/rag_eval_dataset.json`, gồm 120 câu có đáp án tham chiếu, nguồn mong đợi và nhãn trả lời được/không đủ dữ liệu.

Kiểm tra dataset:

```bash
cd BWD/BE
python evaluation/run_rag_eval.py --validate-only
```

Chạy đánh giá collection đang cấu hình và xuất báo cáo:

```bash
python evaluation/run_rag_eval.py --top-k 5 --output evaluation/results/semantic-v3-knowledge-final.json
```

V3 precompute embedding cho riêng golden set công khai và checkpoint từng batch để có thể tiếp tục sau rate-limit; không gọi LLM sinh câu trả lời. Query thật của người dùng không đi qua cache đánh giá. Báo cáo semantic V3 chỉ hợp lệ khi đủ 120/120 query; lần chạy hiện tại đang bị provider chặn HTTP 429 nên chưa có report semantic V3 hoàn chỉnh. Xem benchmark offline và hướng dẫn chạy lại tại `BE/evaluation/README.md`.

### Game Sessions

```text
POST /game-sessions/
GET  /game-sessions/me
```

Nhóm API này dùng để lưu kết quả chơi game và lấy lịch sử chơi gần đây của người dùng đang đăng nhập.

## Database

Schema database nằm tại:

```text
BE/database/schema.sql
```

Chạy `python scripts/init_database.py` để áp dụng schema. Hiện đây là schema idempotent có seed, chưa phải lịch sử migration; xem ranh giới module và nợ kỹ thuật tại `BE/ARCHITECTURE.md`.

Các bảng và view chính:

- `users`: lưu tài khoản, thông tin hồ sơ và tổng điểm.
- `games`: lưu danh sách game.
- `game_levels`: lưu level/cấu hình theo từng game.
- `game_questions`: lưu câu hỏi cho quiz.
- `game_sessions`: lưu từng lượt chơi của người dùng.
- `user_game_stats`: lưu thống kê tổng hợp theo người dùng và game.
- `leaderboard_view`: view phục vụ bảng xếp hạng.

## Các trang frontend

```text
FE/index.html
FE/pages/hocvui.html
FE/pages/trienlam.html
FE/pages/tailieu.html
FE/pages/trochoi.html
FE/pages/bxh.html
FE/pages/profile.html
FE/pages/login.html
FE/pages/register.html
FE/pages/game/codechayquiz.html
FE/pages/game/puzzle.html
```

## Gợi ý quy trình chạy dự án

1. Mở terminal thứ nhất và chạy backend:

```bash
cd BWD/BE
.\.venv\Scripts\Activate.ps1
python scripts/init_database.py  # lần đầu hoặc khi schema thay đổi
python app.py
```

2. Mở terminal thứ hai và chạy frontend:

```bash
cd BWD/FE
python -m http.server 5500
```

3. Truy cập website:

```text
http://localhost:5500
```

## Lỗi thường gặp

### API database báo thiếu `DATABASE_URL`

Health check vẫn có thể chạy không cần database. Nếu auth, game, hồ sơ hoặc bảng xếp hạng báo thiếu kết nối, kiểm tra file `BE/.env` đã tồn tại và có biến:

```env
DATABASE_URL=...
```

### Không đăng nhập hoặc đăng ký được

Kiểm tra backend đã chạy tại:

```text
http://localhost:5000
```

Đồng thời kiểm tra database có thể kết nối được từ `DATABASE_URL`.

### Supabase không kết nối được

Kiểm tra lại password, host, port và tên database trong connection string. Với Supabase, nên dùng `sslmode=require`. Backend cũng có xử lý tự thêm tham số này nếu connection string là Supabase nhưng chưa có `sslmode`.

### Frontend mở được nhưng dữ liệu không đồng bộ

Frontend có thể hiển thị giao diện tĩnh mà không cần backend, nhưng các chức năng liên quan đến tài khoản, điểm số, hồ sơ và lịch sử chơi game cần backend đang chạy.

## Ghi chú phát triển

- Không chỉnh sửa hoặc commit các file trong `__pycache__`.
- Không commit file `.env`.
- Khi thêm API mới, nên tách rõ theo mô hình hiện tại: `routes`, `controllers`, `services`, `repositories`.
- Không mở kết nối hoặc chạy migration/schema khi import module; bootstrap database phải là lệnh chủ động.
- Không sửa trực tiếp Chroma build hoặc xóa build được `vector_store/chroma_v3/active.json` tham chiếu.
- Khi thêm game mới, cần cập nhật schema/seed dữ liệu nếu game có level, câu hỏi hoặc thống kê riêng.
- Nên chạy backend trước, sau đó mới kiểm thử các luồng đăng ký, đăng nhập và lưu điểm từ frontend.

## Trạng thái hiện tại

- Frontend đã có giao diện cho các trang chính, các game và chatbox RAG có nguồn, lịch sử ngắn, gợi ý cùng phản hồi.
- Backend đã có API xác thực, hồ sơ người dùng, lưu phiên chơi game và chat RAG V3.
- Database schema đã có bảng tài khoản, game, level, câu hỏi, lịch sử chơi, thống kê và bảng xếp hạng.
- Bốn giai đoạn RAG đã được triển khai: bộ đánh giá/log ẩn danh, semantic hybrid retrieval, kho tri thức V3 có manifest và trải nghiệm trả lời có trích dẫn.
- Backend đã được clean theo application factory, database bootstrap chủ động, shared hybrid retrieval và legacy RAG tách riêng; query embedding fail-fast thay vì sleep qua quota.
- Toàn bộ 67 test backend hiện đạt; các kiểm tra mặc định chạy offline bằng mock và không gọi Gemini thật.
- GitHub Actions tự chạy test, compile, validate knowledge/dataset và benchmark chunking offline khi backend hoặc tài liệu liên quan thay đổi.
- Phần còn lại cần ưu tiên là chuyên gia duyệt nội dung di sản, đánh giá end-to-end chất lượng câu trả lời/citation, timeout-hủy request ở frontend và cấu hình API origin theo môi trường thay cho localhost.
