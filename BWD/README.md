# Đông Sơn Digital Museum

Đông Sơn Digital Museum là website học tập và trò chơi tương tác về văn hóa Đông Sơn, tập trung vào trải nghiệm khám phá trống đồng, hoa văn, hiện vật và kiến thức lịch sử theo cách trực quan, dễ tiếp cận.

Dự án gồm frontend tĩnh viết bằng HTML/CSS/JavaScript và backend Flask kết nối PostgreSQL hoặc Supabase PostgreSQL. Backend đảm nhiệm xác thực tài khoản bằng JWT, quản lý hồ sơ người dùng, lưu lịch sử chơi game, thống kê điểm và dữ liệu bảng xếp hạng.

## Dự án có gì?

- Trang giới thiệu văn hóa Đông Sơn với hình ảnh, video và nội dung trực quan.
- Hệ thống đăng ký, đăng nhập, đăng xuất bằng JWT.
- Trang hồ sơ người dùng, hỗ trợ đồng bộ thông tin từ backend.
- Bảng xếp hạng và thống kê điểm người chơi.
- Cụm trò chơi học tập:
  - Quiz đúng/sai về văn hóa Đông Sơn.
  - Tìm họa tiết trên trống đồng.
  - Ghép hình trống đồng.
- Backend tự khởi tạo bảng database từ `BE/database/schema.sql` khi chạy server.
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

```text
BWD/
|-- BE/
|   |-- app.py
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
FLASK_ENV=development
```

Nếu dùng Supabase, connection string thường có dạng:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres?sslmode=require
```

Lưu ý: không đưa file `.env` lên Git vì file này chứa thông tin kết nối database và khóa JWT.

### 3. Chạy backend

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
GET http://localhost:5000/
```

Kết quả mong đợi:

```text
Server dang chay
```

Khi backend khởi động, file `BE/database/schema.sql` sẽ được đọc để tạo bảng cần thiết nếu các bảng chưa tồn tại.

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

Frontend gọi backend tại port `5000`, vì vậy cần chạy Flask server trước khi sử dụng các chức năng đăng ký, đăng nhập, hồ sơ người dùng hoặc lưu điểm game.

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
FE/pages/game/pattern-match.html
FE/pages/game/puzzle.html
```

## Gợi ý quy trình chạy dự án

1. Mở terminal thứ nhất và chạy backend:

```bash
cd BWD/BE
.\.venv\Scripts\Activate.ps1
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

### Backend báo thiếu `DATABASE_URL`

Kiểm tra file `BE/.env` đã tồn tại và có biến:

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
- Khi thêm game mới, cần cập nhật schema/seed dữ liệu nếu game có level, câu hỏi hoặc thống kê riêng.
- Nên chạy backend trước, sau đó mới kiểm thử các luồng đăng ký, đăng nhập và lưu điểm từ frontend.

## Trạng thái hiện tại

- Frontend đã có giao diện cho các trang chính và các game.
- Backend đã có API xác thực, hồ sơ người dùng và lưu phiên chơi game.
- Database schema đã có bảng tài khoản, game, level, câu hỏi, lịch sử chơi, thống kê và bảng xếp hạng.
- API đổi mật khẩu đã có ở backend, nhưng frontend hiện chưa có form riêng để gọi chức năng này.
