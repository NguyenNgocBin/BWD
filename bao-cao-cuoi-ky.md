# KẾT QUẢ THỰC HIỆN BÀI TẬP CUỐI KỲ - THIẾT KẾ WEB

**Đề tài:** Xây dựng giao diện website Bảo tàng số Đông Sơn - Đông Sơn Digital Museum

## Thông tin sinh viên

| Họ và tên | Lớp |
| --- | --- |
| Nguyễn Văn A | 24IT1 |
| Nguyễn Văn B |  |

## I. Thư viện, công cụ, ngôn ngữ thực hiện

### 1. Frontend

- **HTML5:** xây dựng cấu trúc các trang giao diện.
- **CSS3:** thiết kế bố cục, màu sắc, hiệu ứng, responsive layout và giao diện theo chủ đề văn hóa Đông Sơn.
- **JavaScript thuần:** xử lý tương tác người dùng, game, hiệu ứng, lưu dữ liệu tạm bằng `localStorage`/`sessionStorage` và gọi API backend.
- **Three.js:** hiển thị mô hình 3D trống đồng định dạng `.glb`, hỗ trợ xoay, phóng to/thu nhỏ, tự xoay và xem toàn màn hình.
- **Leaflet + OpenStreetMap:** xây dựng bản đồ các địa điểm, hiện vật và khu vực liên quan đến văn hóa Đông Sơn.
- **MediaPipe Tasks Vision:** nhận diện khuôn mặt/nghiêng đầu trong game quiz đúng sai.
- **Google Fonts / Material Symbols:** sử dụng font và biểu tượng cho giao diện đăng nhập, đăng ký.
- **Canvas API:** tạo hiệu ứng nền/particle cho trang chủ.

### 2. Backend

- **Python Flask:** xây dựng REST API cho tài khoản, hồ sơ, game session và chatbot.
- **Flask-CORS:** cho phép frontend gọi API từ domain hoặc cổng khác.
- **python-dotenv:** đọc cấu hình từ file `.env`.
- **bcrypt:** mã hóa mật khẩu người dùng.
- **PyJWT:** tạo và xác thực JSON Web Token khi đăng nhập.
- **psycopg2-binary:** kết nối PostgreSQL/Supabase PostgreSQL.
- **ChromaDB:** lưu vector store phục vụ chức năng chatbot RAG.
- **Gemini API:** sinh câu trả lời cho AI Đông Sơn dựa trên kho tri thức đã truy xuất.
- **Vercel Python Runtime:** dự án có file `vercel.json` để triển khai backend Flask lên Vercel.

### 3. Cơ sở dữ liệu và lưu trữ

- **PostgreSQL hoặc Supabase PostgreSQL:** lưu tài khoản, thông tin hồ sơ, danh sách game, level, câu hỏi, phiên chơi và thống kê điểm.
- **ChromaDB vector store:** lưu dữ liệu tri thức Đông Sơn đã được xử lý thành vector để chatbot tìm ngữ cảnh liên quan.
- **File tri thức Markdown:** dữ liệu nội dung nằm trong thư mục `BE/knowledge`, gồm các nhóm kiến thức về trống đồng, hoa văn, hiện vật, bản đồ, tài khoản, xếp hạng, học vui và trò chơi.

### 4. Mô tả backend và CSDL

Backend được tổ chức theo mô hình phân lớp:

- `routes`: khai báo các endpoint API.
- `controllers`: nhận request và trả response.
- `services`: xử lý nghiệp vụ.
- `repositories`: truy vấn cơ sở dữ liệu.
- `middlewares`: kiểm tra đăng nhập bằng JWT.
- `config`: cấu hình kết nối database.
- `database/schema.sql`: tạo bảng, index, view và dữ liệu mẫu ban đầu.

Các API chính đã xây dựng:

- `POST /api/v1/auth/register`: đăng ký tài khoản.
- `POST /api/v1/auth/login`: đăng nhập.
- `GET /api/v1/auth/me`: lấy thông tin người dùng hiện tại.
- `POST /api/v1/auth/logout`: đăng xuất.
- `PUT /api/v1/auth/change-password`: đổi mật khẩu.
- `PUT /api/v1/auth/profile`: cập nhật hồ sơ.
- `POST /api/v1/chat/ask`: hỏi đáp với chatbot AI Đông Sơn.
- `POST /api/v1/game-sessions/`: lưu kết quả chơi game.
- `GET /api/v1/game-sessions/me`: lấy lịch sử chơi game của người dùng.

Các bảng/view chính trong CSDL:

- `users`: lưu tài khoản, email, mật khẩu đã hash, avatar và tổng điểm.
- `games`: lưu danh sách game trong hệ thống.
- `game_levels`: lưu level/cấu hình theo từng game.
- `game_questions`: lưu câu hỏi cho game quiz.
- `game_sessions`: lưu từng lượt chơi của người dùng.
- `user_game_stats`: thống kê điểm theo người dùng và game.
- `leaderboard_view`: view phục vụ bảng xếp hạng.

## II. Liệt kê các trang giao diện hoàn thành

### 1. Trang chủ - `FE/index.html`

- Giới thiệu tổng quan website Đông Sơn Digital Museum.
- Có hero video nền, hình ảnh trống đồng, hiệu ứng canvas particle và hiệu ứng cuộn trang.
- Dẫn người dùng đến các khu vực chính: Học vui, Tài liệu, Trò chơi, Triển lãm, Bản đồ, Xếp hạng và Cá nhân.
- Trình bày các nội dung nổi bật về trống đồng, hoa văn, hiện vật tiêu biểu và hành trình khám phá văn hóa Đông Sơn.

### 2. Trang Học vui - `FE/pages/hocvui.html`

- Cung cấp kiến thức nhập môn về trống đồng Đông Sơn bằng cách trình bày ngắn gọn, dễ hiểu.
- Phù hợp cho người dùng lần đầu tìm hiểu chủ đề Đông Sơn.
- Có hiệu ứng tương tác bằng JavaScript và giao diện riêng trong `hocvui.css`.

### 3. Trang Tài liệu - `FE/pages/tailieu.html`

- Trình bày nội dung chuyên sâu hơn về trống đồng, cấu tạo, hoa văn, biểu tượng, kỹ thuật đúc đồng và phân loại.
- Đóng vai trò như kho tài liệu đọc và tra cứu cho người dùng.
- Có tích hợp chatbox AI để hỏi nhanh nội dung liên quan.

### 4. Trang Triển lãm - `FE/pages/trienlam.html`

- Xây dựng không gian triển lãm trực tuyến về văn hóa Đông Sơn.
- Tích hợp thư viện hiện vật 3D bằng Three.js.
- Hiển thị các mô hình `.glb` trong thư mục `FE/models`, gồm:
  - `TrongDong1.glb`
  - `TrongDong2.glb`
  - `trong_dong 4.glb`
  - `DongSonBronzeDrum.glb`
- Người dùng có thể chọn mô hình, xoay, zoom, bật/tắt tự xoay, reset góc nhìn và xem toàn màn hình.
- Có giao diện gallery, viewer chi tiết, mô tả hiện vật và trạng thái tải mô hình.

### 5. Trang Bản đồ Đông Sơn - `FE/pages/Map.html`

- Sử dụng Leaflet và OpenStreetMap để hiển thị bản đồ di sản Đông Sơn.
- Có marker cho các địa điểm/hiện vật như trống Ngọc Lũ, Sông Đà, Hoàng Hạ, Cổ Loa, Cẩm Giang, Hữu Chung, Sao Vàng, Sông Mã, Quỳ Chử...
- Mỗi địa điểm có thông tin chi tiết, hình ảnh, khu vực, năm phát hiện và mô tả lịch sử.
- Giúp người dùng hiểu sự phân bố địa lý của hiện vật Đông Sơn trên không gian Việt Nam.

### 6. Trang Trò chơi - `FE/pages/trochoi.html`

- Là trang trung tâm giới thiệu các trò chơi học tập.
- Điều hướng đến các game chính của website.
- Có giao diện riêng, thẻ trò chơi, trạng thái người dùng và liên kết đến bảng xếp hạng.

### 7. Game Ghép hình trống đồng - `FE/pages/game/puzzle.html`

- Game kéo thả mảnh ghép để hoàn thiện hình trống đồng.
- Có 3 cấp độ: 2x2, 2x3 và 3x3.
- Có tính điểm, combo, thời gian giới hạn, mở khóa level và bảng điểm cục bộ.
- Dữ liệu điểm cục bộ được lưu bằng `localStorage`.

### 8. Game Quiz đúng/sai - `FE/pages/game/codechayquiz.html`

- Game trả lời câu hỏi kiến thức về trống đồng và văn hóa Đông Sơn.
- Có 5 chương, mỗi chương 5 câu hỏi:
  - Nguồn gốc trống đồng.
  - Hoa văn và biểu tượng.
  - Kỹ thuật và cấu tạo.
  - Giá trị lịch sử.
  - Bảo tồn và phát huy.
- Hỗ trợ chọn đáp án bằng nút bấm, bàn phím và nhận diện nghiêng đầu qua camera bằng MediaPipe.
- Có điểm số, thời gian, streak, độ chính xác và điểm tốt nhất.

### 9. Trang Bảng xếp hạng - `FE/pages/bxh.html`

- Hiển thị giao diện bảng xếp hạng theo các nhóm điểm.
- Có khu vực top 3, bảng người chơi và thông tin điểm cá nhân.
- Có lấy thông tin người dùng hiện tại từ backend nếu người dùng đã đăng nhập.

### 10. Trang Đăng nhập - `FE/pages/login.html`

- Cho phép người dùng đăng nhập bằng email và mật khẩu.
- Kiểm tra định dạng email, trạng thái nhập liệu và hiển thị lỗi.
- Gọi API backend `/api/v1/auth/login`.
- Lưu token và thông tin người dùng vào `localStorage` hoặc `sessionStorage`.

### 11. Trang Đăng ký - `FE/pages/register.html`

- Cho phép tạo tài khoản mới.
- Gọi API backend `/api/v1/auth/register`.
- Có giao diện nhập thông tin, kiểm tra lỗi và phản hồi trạng thái đăng ký.

### 12. Trang Cá nhân - `FE/pages/profile.html`

- Hiển thị thông tin người dùng đang đăng nhập.
- Gọi API `/api/v1/auth/me` để lấy dữ liệu mới nhất.
- Hỗ trợ cập nhật hồ sơ qua API `/api/v1/auth/profile`.
- Có chức năng đăng xuất và xóa token khỏi trình duyệt.

### 13. Chatbox AI Đông Sơn - `FE/js/chatbox-ui.js`

- Chatbox được tích hợp trên nhiều trang chính.
- Người dùng có thể đặt câu hỏi về trống đồng và văn hóa Đông Sơn.
- Frontend gửi câu hỏi đến API `/api/v1/chat/ask`.
- Backend tìm ngữ cảnh trong ChromaDB, tạo prompt RAG và gọi Gemini API để trả lời.
- Có gợi ý câu hỏi, trạng thái đang trả lời và thông báo lỗi khi backend không kết nối.

## III. Kết quả đạt được

- Hoàn thành website theo chủ đề bảo tàng số Đông Sơn với nhiều trang giao diện riêng.
- Có hệ thống điều hướng thống nhất giữa các trang.
- Có nội dung học tập, tài liệu, triển lãm, bản đồ, trò chơi, xếp hạng và tài khoản người dùng.
- Có backend Flask phục vụ xác thực, hồ sơ, phiên chơi game và chatbot AI.
- Có cơ sở dữ liệu PostgreSQL/Supabase với schema rõ ràng.
- Có chức năng 3D tương tác bằng Three.js và mô hình GLB.
- Có bản đồ tương tác bằng Leaflet/OpenStreetMap.
- Có chatbot AI sử dụng mô hình RAG trên kho tri thức Đông Sơn.
- Giao diện có sử dụng hình ảnh, video, hiệu ứng và bố cục responsive để tăng trải nghiệm người dùng.

## IV. Ghi chú

- Dự án hiện không phải website bán hàng mà là website bảo tàng số/học tập tương tác về văn hóa Đông Sơn.
- Một số chức năng cần backend và database hoạt động để sử dụng đầy đủ, ví dụ: đăng nhập, đăng ký, hồ sơ cá nhân, lưu phiên chơi và chatbot AI.
- Frontend hiện có gọi backend đã triển khai tại `https://bwd-d6e2.vercel.app`.
- Khi chạy local có thể mở frontend bằng web server tĩnh và chạy backend Flask riêng.
