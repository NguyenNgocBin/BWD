# Đông Sơn Digital Museum

Website học tập và trò chơi tương tác về trống đồng Đông Sơn. Dự án gồm frontend tĩnh bằng HTML/CSS/JavaScript và backend Flask dùng PostgreSQL/Supabase để quản lý tài khoản, xác thực JWT và lưu kết quả chơi game.

## Tính Năng Chính

- Trang giới thiệu di sản Đông Sơn với video, hình ảnh và các khu nội dung trực quan.
- Đăng ký, đăng nhập, đăng xuất bằng JWT.
- Trang hồ sơ người dùng, cập nhật tên hiển thị và đồng bộ thông tin từ backend.
- Bảng xếp hạng và thống kê điểm.
- Ba trò chơi học tập:
  - Tìm họa tiết.
  - Ghép hình trống đồng.
  - Quiz đúng/sai về văn hóa Đông Sơn.
- Backend tự tạo bảng và seed dữ liệu mặc định từ `BE/database/schema.sql` khi khởi động.

## Công Nghệ Sử Dụng

### Frontend

- HTML5
- CSS3
- JavaScript thuần
- Google Fonts: `Manrope`, `Newsreader`

### Backend

- Python
- Flask
- Flask-CORS
- PostgreSQL/Supabase
- bcrypt
- PyJWT
- python-dotenv
- psycopg2

## Cấu Trúc Thư Mục

```text
BWD_codechay/
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
|   `-- videos/
`-- README.md
```

## Yêu Cầu Môi Trường

- Python 3.10 trở lên.
- PostgreSQL hoặc Supabase PostgreSQL.
- Trình duyệt hiện đại như Chrome, Edge, Firefox.

## Cài Đặt Backend

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

Cài dependencies:

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

Không commit `.env` lên Git vì file này chứa thông tin kết nối database và JWT secret.

Chạy backend:

```bash
python app.py
```

Nếu thành công, backend chạy tại:

```text
http://localhost:5000
```

Endpoint kiểm tra nhanh:

```text
GET /
```

Kết quả mong đợi:

```text
Server dang chay
```

## Chạy Frontend

Frontend là HTML/CSS/JS tĩnh, có thể mở trực tiếp:

```text
FE/index.html
```

Khuyến nghị chạy bằng local server để tránh một số giới hạn của trình duyệt khi dùng `file://`.

Ví dụ dùng Python:

```bash
cd FE
python -m http.server 5500
```

Sau đó mở:

```text
http://localhost:5500
```

Frontend hiện gọi backend theo host hiện tại và port `5000`, vì vậy cần chạy Flask server trước khi đăng nhập, đăng ký hoặc đồng bộ profile.

## API Chính

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

Những endpoint yêu cầu đăng nhập cần header:

```http
Authorization: Bearer <token>
```

### Game Sessions

```text
POST /game-sessions/
GET  /game-sessions/me
```

Hai endpoint này dùng JWT để lưu và lấy lịch sử chơi game của user hiện tại.

## Database

File schema nằm tại:

```text
BE/database/schema.sql
```

Khi backend khởi động, `app.py` sẽ đọc file schema và tạo các bảng nếu chưa tồn tại. Các bảng chính:

- `users`
- `games`
- `game_levels`
- `game_questions`
- `game_sessions`
- `user_game_stats`
- `leaderboard_view`

Schema cũng seed sẵn danh sách game, level và câu hỏi mặc định cho `codechayquiz`.

## Trang Frontend

```text
FE/index.html
FE/pages/hocvui.html
FE/pages/trochoi.html
FE/pages/bxh.html
FE/pages/profile.html
FE/pages/login.html
FE/pages/register.html
FE/pages/game/codechayquiz.html
FE/pages/game/pattern-match.html
FE/pages/game/puzzle.html
```

## Ghi Chú Phát Triển

- Không sửa trực tiếp file trong `__pycache__`; đây là output do Python sinh ra.
- Không commit `.env`.
- Nếu frontend báo không kết nối được backend, kiểm tra Flask server đã chạy ở port `5000` chưa.
- Nếu backend báo lỗi `DATABASE_URL chua duoc cau hinh`, kiểm tra file `BE/.env`.
- Nếu dùng Supabase, connection string nên có `sslmode=require`; backend sẽ tự thêm tham số này nếu thiếu.

## Trạng Thái Hiện Tại

- Frontend đã có giao diện cho các trang chính và game.
- Backend đã có API auth, profile và game session.
- API đổi mật khẩu đã có ở backend, nhưng frontend hiện chưa có form riêng để gọi chức năng này.
