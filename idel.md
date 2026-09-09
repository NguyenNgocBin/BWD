# Đông Sơn Digital Museum — Hiện trạng sản phẩm và định hướng phát triển

> Cập nhật theo mã nguồn tại ngày 16/07/2026. Tài liệu này phân biệt rõ ba trạng thái: **đã có trong mã nguồn**, **đã kiểm thử**, và **mới là đề xuất**. Các ý tưởng ở phần cuối chưa được xem là tính năng đã hoàn thành.

## 1. Tóm tắt dự án

Đông Sơn Digital Museum là website bảo tàng số kết hợp giáo dục, khám phá di sản và trò chơi hóa. Sản phẩm giúp người dùng tìm hiểu văn hóa Đông Sơn qua nội dung trực quan, hồ sơ hiện vật, mô hình 3D, bản đồ, lộ trình học, trò chơi, bảng xếp hạng và trợ lý AI có truy xuất nguồn.

Dự án hiện đã vượt mức website giới thiệu tĩnh. Frontend và backend đã kết nối thành một hệ thống tương đối hoàn chỉnh:

- Frontend có 12 trang chính và 3 trò chơi bằng HTML, CSS và JavaScript thuần.
- Backend Flask cung cấp API cho tài khoản, hồ sơ, game session, bảng xếp hạng, tiến trình và chatbot.
- PostgreSQL lưu tài khoản, lượt chơi, thống kê, thành tựu và log đánh giá RAG.
- Chatbox sử dụng RAG V3 với ChromaDB, Gemini embedding, hybrid retrieval, trích dẫn nguồn và fallback an toàn.
- Bộ kiểm thử hiện có 70 unit test; golden dataset RAG gồm 120 câu hỏi.

Điểm mạnh của dự án là chủ đề rõ, có bản sắc thị giác riêng và các tính năng hỗ trợ nhau: người dùng đọc kiến thức, xem hiện vật, chơi game, lưu kết quả, nhận thành tựu và tiếp tục khám phá bằng AI.

Điểm còn thiếu để trở thành sản phẩm có thể vận hành ổn định là cấu hình deploy thống nhất, kiểm thử end-to-end, quản trị nội dung, bảo vệ điểm game, đo hiệu năng production và đánh giá đầy đủ chất lượng câu trả lời RAG V3.

## 2. Mục tiêu và người dùng

### 2.1. Mục tiêu sản phẩm

- Số hóa kiến thức về văn hóa và trống đồng Đông Sơn theo cách dễ tiếp cận.
- Biến việc học lịch sử thành trải nghiệm khám phá thay vì chỉ đọc văn bản.
- Kết nối nội dung, hiện vật, địa điểm, trò chơi và AI trong cùng một hành trình.
- Tạo nền tảng có thể mở rộng cho trường học, bảo tàng hoặc hoạt động trải nghiệm di sản.

### 2.2. Nhóm người dùng phù hợp

- Học sinh, sinh viên cần tài liệu nhập môn và hoạt động ôn tập.
- Giáo viên muốn có nội dung trực quan hỗ trợ bài giảng.
- Người trẻ yêu thích lịch sử, trò chơi và trải nghiệm số.
- Khách tham quan muốn tra cứu nhanh hiện vật, địa điểm và câu chuyện Đông Sơn.
- Người quản trị nội dung hoặc chuyên gia lịch sử trong phiên bản phát triển tiếp theo.

## 3. Các chức năng hiện có

### 3.1. Trang chủ và khu vực nội dung

| Khu vực | Hiện trạng |
|---|---|
| Trang chủ | Có video nền, hình ảnh, hiệu ứng chuyển động, nội dung giới thiệu và liên kết tới các khu vực chính. |
| Học vui | Cung cấp kiến thức nhập môn, trình bày ngắn gọn và trực quan. |
| Tài liệu | Có nội dung chuyên sâu hơn về văn hóa, trống đồng, cấu tạo, hoa văn, kỹ thuật đúc và phân loại. |
| Lộ trình học | Có 5 bài học, đánh dấu hoàn thành bằng `localStorage` và đối chiếu kết quả quiz từ backend. |
| Chatbox | Được nhúng trên hầu hết các trang chính, hỗ trợ hỏi kiến thức Đông Sơn và cách dùng website. |

Nội dung hiện vẫn nằm rải rác trong HTML, JavaScript và kho Markdown của RAG. Vì chưa có một nguồn dữ liệu dùng chung nên cùng một hiện vật có thể được mô tả ở nhiều nơi và có nguy cơ lệch nhau khi cập nhật.

### 3.2. Triển lãm 3D và hồ sơ hiện vật

- Triển lãm sử dụng Three.js, OrbitControls và GLTFLoader.
- Có 3 mô hình GLB: `TrongDong1.glb`, `TrongDong2.glb` và `trong_dong 4.glb`.
- Người dùng có thể xoay, phóng to/thu nhỏ, đặt lại góc nhìn, tự xoay và xem toàn màn hình.
- Có kiểm tra WebGL, nhận biết thiết bị yếu, trạng thái tải và ảnh thay thế khi không dựng được 3D.
- Trang hiện vật có hồ sơ cho Ngọc Lũ, Hoàng Hạ, Cổ Loa và Tân Long.
- Dữ liệu hiện vật hiện được khai báo trực tiếp ở frontend, chưa lấy từ database hoặc CMS.

Dự án **chưa có WebAR đặt trống đồng vào không gian thật**. Camera hiện chỉ được dùng cho thao tác nghiêng đầu trong game quiz; không nên giới thiệu WebAR như một tính năng đã hoàn thành.

### 3.3. Bản đồ Đông Sơn

- Sử dụng Google Maps (hỗ trợ các chế độ Đường sá, Vệ tinh, Địa hình).
- Có marker, ảnh, mô tả và thông tin cho nhiều địa điểm liên quan đến di sản Đông Sơn.
- Có danh sách địa điểm, popup và chế độ bản đồ toàn màn hình.
- Dữ liệu bản đồ hiện nằm trong JavaScript, chưa dùng chung với dữ liệu hiện vật hoặc kho tri thức.

### 3.4. Ba trò chơi

#### Game lật thẻ họa tiết — `motifhunt`

- Ghép 6 cặp thẻ có hình họa tiết Đông Sơn.
- Có thời gian 120 giây, điểm, combo, phạt khi ghép sai và thống kê độ chính xác.
- Lưu thành tích cục bộ và gửi game session lên backend khi đã đăng nhập.

#### Game ghép hình — `puzzle`

- Kéo thả các mảnh để hoàn thiện hình trống đồng.
- Có các cấp độ 2×2, 2×3 và 3×3.
- Có điểm, thời gian, mở khóa level, thành tích cục bộ và bảng xếp hạng.

#### Quiz đúng/sai — `codechayquiz`

- Gồm 25 câu chia thành 5 chương.
- Có điểm, giới hạn thời gian, chuỗi trả lời đúng, độ chính xác và thống kê cuối lượt.
- Có thể trả lời bằng nút bấm, bàn phím hoặc nghiêng đầu qua camera.
- Camera sử dụng MediaPipe Face Landmarker; người dùng có thể tắt camera và tiếp tục chơi bằng nút bấm.
- Kết quả được gửi lên backend khi người dùng đăng nhập.

Backend hiện kiểm tra kiểu dữ liệu và các giá trị không âm, nhưng chưa có luật chặt theo từng game để xác minh điểm tối đa, thời lượng hợp lý hoặc chống gửi lại cùng một lượt. Vì vậy điểm do frontend gửi vẫn có thể bị can thiệp.

### 3.5. Tài khoản và hồ sơ

Hệ thống đã có:

- Đăng ký bằng tên, email và mật khẩu.
- Đăng nhập bằng JWT; lựa chọn ghi nhớ dùng `localStorage` hoặc `sessionStorage`.
- Lấy thông tin người dùng hiện tại.
- Cập nhật tên, lớp/nhóm và ảnh đại diện.
- Đổi mật khẩu khi đã đăng nhập.
- Đăng xuất ở phía giao diện.
- Xem tổng điểm, thứ hạng, game tốt nhất và lịch sử chơi gần đây.
- Thống kê từng game, biểu đồ điểm 7 ngày, thành tựu và nhiệm vụ hằng ngày.

Chưa có quên mật khẩu qua email, xác minh email, refresh token, thu hồi token hoặc quản lý danh sách thiết bị đăng nhập. Logout hiện chưa phải cơ chế vô hiệu hóa JWT ở server.

### 3.6. Bảng xếp hạng, huy hiệu và nhiệm vụ

- Có bảng tổng và bảng riêng cho ba game.
- Có bộ lọc mọi thời gian, tuần này, hôm nay và lớp/nhóm.
- Có top 3, danh sách người chơi, thông tin người dùng hiện tại và cache ngắn ở frontend.
- Thành tựu được lưu trong database và tự mở khóa theo luật tiến trình.
- Nhiệm vụ hằng ngày gồm chơi lật thẻ, hoàn thành level ghép hình và trả lời đúng 5 câu quiz.
- Huy hiệu nổi bật được hiển thị ở hồ sơ và bảng xếp hạng.

Phần này đã có dữ liệu thật từ backend, nhưng vẫn cần kiểm thử quy tắc tính điểm, đồng hạng, múi giờ, nhận thưởng và các trường hợp gửi game session trùng.

## 4. Backend và dữ liệu hiện tại

### 4.1. Kiến trúc backend

Backend được tổ chức theo luồng:

```text
HTTP request
    → route
    → controller
    → service
    → repository
    → PostgreSQL / ChromaDB / Gemini
```

Vai trò chính:

- `routes`: khai báo URL và middleware xác thực.
- `controllers`: đọc request, chuyển lỗi thành HTTP response.
- `services`: xử lý nghiệp vụ.
- `repositories`: chứa truy vấn PostgreSQL.
- `middlewares`: xác thực JWT bắt buộc hoặc tùy chọn.
- `knowledge`: kho Markdown dùng cho RAG.
- `evaluation`: golden dataset, benchmark và báo cáo RAG.
- `tests`: unit test cho backend, pipeline và chatbox.

Application factory không tự kết nối hoặc thay đổi database khi import. Schema được khởi tạo chủ động bằng script riêng, phù hợp hơn cho test và deploy serverless.

### 4.2. API đang có

| Nhóm | Endpoint | Trạng thái |
|---|---|---|
| Hệ thống | `GET /health` | Kiểm tra backend hoạt động. |
| Auth | `POST /api/v1/auth/register` | Đăng ký. |
| Auth | `POST /api/v1/auth/login` | Đăng nhập. |
| Auth | `GET /api/v1/auth/me` | Lấy hồ sơ hiện tại. |
| Auth | `PUT /api/v1/auth/profile` | Cập nhật hồ sơ. |
| Auth | `PUT /api/v1/auth/change-password` | Đổi mật khẩu. |
| Auth | `POST /api/v1/auth/logout` | Đăng xuất ở mức nghiệp vụ hiện tại. |
| Game | `POST /api/v1/game-sessions/` | Lưu lượt chơi. |
| Game | `GET /api/v1/game-sessions/me` | Lấy lịch sử chơi. |
| Xếp hạng | `GET /api/v1/leaderboard/` | Lọc theo scope, thời gian và lớp/nhóm. |
| Tiến trình | `GET /api/v1/progression/me` | Lấy thành tựu và nhiệm vụ hằng ngày. |
| Chat | `POST /api/v1/chat/ask` | Hỏi chatbot RAG. |
| Chat | `POST /api/v1/chat/feedback` | Gửi phản hồi hữu ích/chưa đúng. |
| Chat | `GET /api/v1/chat/status` | Kiểm tra trạng thái collection RAG. |

### 4.3. Database

PostgreSQL hiện có các bảng chính:

- `users`
- `games`
- `game_levels`
- `game_questions`
- `game_sessions`
- `user_game_stats`
- `achievements`
- `user_achievements`
- `rag_interaction_logs`
- `leaderboard_view`

Schema đã có seed cho ba game, level, câu hỏi và thành tựu. Dữ liệu nghiệp vụ hiện thiên về game và hồ sơ; tài liệu, hiện vật, địa điểm, bài học và nội dung triển lãm chưa được quản trị trong database.

## 5. Chatbox RAG V3

### 5.1. Luồng hoạt động hiện tại

1. Frontend gửi câu hỏi và tối đa 6 tin nhắn gần nhất tới backend.
2. Backend chuẩn hóa câu hỏi, sửa một số biến thể, nhận diện thực thể và phân loại intent.
3. Câu ngoài phạm vi, mơ hồ hoặc hỏi dữ kiện chưa có được từ chối trước khi truy xuất.
4. Câu hợp lệ được tìm trong đúng corpus bằng Gemini embedding kết hợp BM25.
5. Kết quả được hợp nhất, rerank, lọc theo độ tin cậy và rút xuống tối đa 3 tài liệu.
6. Gemini chỉ được phép trả lời từ context RAG và phải dùng mã nguồn `[1]`–`[3]`.
7. Câu trả lời thiếu citation hoặc dùng citation không tồn tại bị thay bằng fallback an toàn.
8. API trả câu trả lời, thẻ nguồn mở được, gợi ý tiếp theo, request ID và version collection.

### 5.2. Kho tri thức hiện tại

- 25 file Markdown có metadata bắt buộc.
- 15 tài liệu thuộc corpus di sản và 10 tài liệu hướng dẫn website.
- 23 tài liệu được index; 2 file quiz phái sinh không đưa vào retrieval.
- Collection active: `rag-v3-b59c44aa3345`.
- Chunker: `semantic-units-v2`, cấu hình `balanced`.
- 204 chunks, embedding `gemini-embedding-001` với 768 chiều.
- Audit hiện không phát hiện file rỗng, lỗi metadata, bản trùng chính xác hoặc gần trùng.
- Collection đang `ready=true` và `in_sync=true` với knowledge hiện tại.

### 5.3. Mức độ nghiệm thu RAG

| Tiêu chí | Hiện trạng ngày 16/07/2026 | Kết luận |
|---|---|---|
| Recall@5 ≥ 90% | Semantic V2 đạt 95,74%, nhưng benchmark offline của V3 active đạt 84,07%; chưa có semantic V3 end-to-end hoàn chỉnh. | Chưa nghiệm thu. |
| ≥ 85% câu trong phạm vi trả lời đúng và có căn cứ | Runner hiện chỉ đo retrieval/fallback, chưa sinh và chấm toàn bộ câu trả lời cuối. | Chưa đo. |
| ≥ 95% câu ngoài phạm vi được xử lý đúng | Bộ nội bộ hiện có false-accept 0%; V3 từ chối sớm trước retrieval. | Đạt trên bộ nội bộ. |
| 100% câu trả lời dữ kiện có nguồn hiển thị | Backend bắt buộc ít nhất một citation hợp lệ và trả thẻ nguồn tương ứng. | Đạt ở mức cơ chế và unit test. |
| Không lộ lỗi provider, khóa, đường dẫn hoặc stack trace | Lỗi kỹ thuật được log ở server; response công khai dùng thông báo chung và request ID. | Đạt theo code và unit test. |
| P95 dưới 6 giây, có timeout và thử lại | Chưa có báo cáo P95; timeout sinh câu trả lời hiện có thể tới 30 giây; frontend chưa có `AbortController`. | Chưa đạt. |
| Tự động đánh giá lại khi thay knowledge, embedding, chunking, prompt hoặc model | Có workflow offline cho test, validate và benchmark chunk; chưa chạy semantic V3 và chấm câu trả lời cuối. Thư mục `.github` hiện chưa được Git theo dõi. | Mới một phần. |

Không nên dùng kết quả tốt của V2 để tuyên bố V3 đã đạt. `Answerability accuracy` cũng không đồng nghĩa với tỷ lệ câu trả lời đúng ý; hai chỉ số cần được đo riêng.

## 6. Chất lượng và kiểm thử hiện tại

Các kiểm tra cục bộ gần nhất:

- 70/70 unit test đạt.
- Golden dataset hợp lệ: 60 case, 120 câu hỏi, 6 nhóm nội dung.
- Knowledge audit sạch.
- Collection V3 đồng bộ với knowledge, embedding và chunk config hiện tại.
- Có unit test cho application factory, database bootstrap, pipeline knowledge, query understanding, retrieval, citation, nguồn công khai, fallback, privacy và một số luồng chat.

Những kiểm thử còn thiếu:

- End-to-end trên trình duyệt cho đăng ký → đăng nhập → chơi → lưu điểm → hồ sơ → bảng xếp hạng.
- Test API đầy đủ cho auth, game session, leaderboard và progression bằng database test độc lập.
- Test responsive và thiết bị thật cho bản đồ, 3D, kéo thả và camera.
- Load test và đo P50/P95/P99.
- Kiểm thử accessibility bằng bàn phím và screen reader.
- Đánh giá chất lượng câu trả lời cuối của RAG bằng rubric hoặc LLM judge có kiểm soát.
- Kiểm thử bảo mật cơ bản: rate limit, brute force, token, CORS, payload lớn và thao túng điểm game.

## 7. Vấn đề và rủi ro cần ưu tiên

### P0 — Cần xử lý trước khi demo hoặc deploy công khai

#### 1. Chuẩn hóa cấu hình backend

Frontend hiện gắn cứng `http://localhost:5000` trong nhiều file JavaScript, gồm auth, hồ sơ, game, bảng xếp hạng, lộ trình và chatbox. Cần có một `config.js` hoặc biến build duy nhất cho local, staging và production.

Kết quả mong muốn:

- Không sửa từng file khi đổi backend.
- Không deploy nhầm URL local.
- Có health check và thông báo rõ khi backend không sẵn sàng.

#### 2. Bảo vệ luồng lưu điểm

- Thêm `client_session_id` hoặc idempotency key để chống lưu trùng.
- Đặt giới hạn điểm, số câu, thời lượng và level theo từng game ở backend.
- Không tin hoàn toàn `score`, `accuracy` và `best_streak` do trình duyệt gửi.
- Hiển thị trạng thái “đã lưu”, “chỉ lưu trên máy” hoặc “lưu thất bại — thử lại”.
- Làm mới hồ sơ và bảng xếp hạng sau khi lưu thành công.

#### 3. Hoàn tất nghiệm thu RAG V3

- Chạy lại semantic V3 trên 120 câu khi quota cho phép.
- Thêm đánh giá câu trả lời cuối theo `reference_answer` và nguồn được trích.
- Đặt gate Recall@5 ≥ 90%, grounded-answer ≥ 85%, out-of-scope ≥ 95%.
- Đo latency thật và giảm timeout tổng về mục tiêu phù hợp.

#### 4. Đưa CI vào Git và chạy thật

Workflow `.github/workflows/backend-quality.yml` đang tồn tại trong workspace nhưng `.github/` chưa được Git theo dõi. Cần commit workflow, xác nhận chạy thành công trên pull request và lưu artifact báo cáo.

### P1 — Hoàn thiện chất lượng sản phẩm

- Tạo nguồn dữ liệu chung cho hiện vật, địa điểm, bài học, quiz và RAG.
- Xây Admin Dashboard/CMS tối thiểu.
- Đồng bộ tiến độ lộ trình học theo tài khoản thay vì chỉ dùng `localStorage`.
- Hoàn thiện quên mật khẩu, xác minh email và chính sách phiên đăng nhập.
- Tối ưu GLB, ảnh, video, lazy loading và cache.
- Thêm tìm kiếm thống nhất cho hiện vật và tài liệu.
- Rà soát accessibility, SEO và `prefers-reduced-motion`.
- Chuẩn hóa lỗi công khai cho toàn bộ API theo cách chatbox đang làm.

### P2 — Tăng giá trị học tập và khả năng vận hành

- Chế độ lớp học cho giáo viên.
- Báo cáo tiến độ, phần kiến thức yếu và gợi ý ôn tập.
- Nội dung song ngữ Việt–Anh.
- Audio guide và transcript.
- Quy trình chuyên gia duyệt nội dung, phiên bản hóa và ngày cập nhật.
- Dashboard quan sát lỗi, latency, tỷ lệ fallback và phản hồi “chưa đúng”.

## 8. Đề xuất các tính năng mới thú vị

### 8.1. Ma trận ưu tiên

| Ý tưởng | Giá trị trải nghiệm | Công sức ước tính | Nên làm khi |
|---|---:|---:|---|
| Hộ chiếu nhà khảo cổ | Cao | Thấp–trung bình | Sau khi lưu tiến độ ổn định. |
| Giải mã mặt trống tương tác | Rất cao | Trung bình | Dữ liệu hiện vật đã dùng chung. |
| Bản đồ dòng thời gian | Cao | Trung bình | Địa điểm và niên đại đã được chuẩn hóa. |
| Xưởng phục chế hiện vật | Cao | Trung bình | Hệ thống game session đã chống gian lận. |
| Tour AI theo chủ đề | Cao | Trung bình | RAG V3 đã nghiệm thu. |
| Chế độ lớp học | Rất cao | Cao | Auth và báo cáo tiến trình ổn định. |
| Audio guide song ngữ | Cao | Trung bình | Nội dung đã được chuyên gia duyệt. |
| WebAR đặt hiện vật trong phòng | Rất cao | Cao | 3D đã tối ưu tốt trên di động. |
| Đấu quiz thời gian thực | Cao | Rất cao | Có hạ tầng realtime và chống gian lận. |

### 8.2. Hộ chiếu nhà khảo cổ

Mỗi người dùng có một “hộ chiếu” gồm các con dấu tương ứng với hiện vật, địa điểm và chủ đề đã khám phá.

MVP có thể gồm:

- Mở hồ sơ Ngọc Lũ → nhận dấu “Nhà nghiên cứu Ngọc Lũ”.
- Xem đủ ba mô hình 3D → nhận dấu “Giám tuyển tập sự”.
- Hoàn thành lộ trình và ba game → mở huy hiệu đặc biệt.
- Trang hộ chiếu hiển thị bộ sưu tập, tiến độ và gợi ý điểm đến tiếp theo.

Ý tưởng này tận dụng sẵn tài khoản, thành tựu, game session và progression nên tạo cảm giác mới mà không cần kiến trúc quá lớn.

### 8.3. Giải mã mặt trống tương tác

Cho phép người dùng bấm vào từng vùng trên hình hoặc mô hình 3D để mở lớp thông tin:

- Ngôi sao trung tâm.
- Chim, người, thuyền, nhà sàn và hoa văn hình học.
- Vị trí trên mặt, tang, thân hoặc chân trống.
- Mức độ chắc chắn của diễn giải: “đã xác nhận”, “có nhiều giả thuyết”, “chưa đủ nguồn”.

Có thể thêm chế độ thử thách: hệ thống yêu cầu “tìm họa tiết chim”, người dùng xoay trống và chọn đúng vị trí. Đây là cầu nối tự nhiên giữa triển lãm 3D, nội dung học và game.

### 8.4. Bản đồ dòng thời gian

Kết hợp bản đồ hiện tại với thanh thời gian để người dùng khám phá:

- Địa điểm phát hiện theo thời kỳ.
- Tuyến phân bố và giao lưu văn hóa.
- So sánh vị trí phát hiện, nơi lưu giữ và bảo tàng hiện nay.
- Nhấn marker để mở hồ sơ hiện vật hoặc bắt đầu câu hỏi AI liên quan.

Tính năng này hấp dẫn về mặt trực quan nhưng chỉ nên làm khi niên đại và tọa độ đã được chuyên gia xác nhận.

### 8.5. Xưởng phục chế hiện vật

Một minigame mới theo phong cách bảo tồn bảo tàng:

1. Làm sạch bề mặt đúng cách.
2. Ghép mảnh vỡ theo hình dáng.
3. Nhận diện vùng hoa văn bị mất.
4. Chọn phương án bảo quản phù hợp.

Game không chỉ cho điểm mà còn giải thích vì sao một lựa chọn đúng hoặc sai. Nội dung cần được thiết kế thận trọng để không biến quy trình bảo tồn thật thành hướng dẫn đơn giản hóa quá mức.

### 8.6. Tour AI theo vai trò

Thay vì chat tự do hoàn toàn, người dùng chọn một tour 5–10 phút:

- “Khám phá trống Ngọc Lũ”.
- “Hoa văn kể chuyện gì?”.
- “Kỹ thuật đúc đồng của người xưa”.
- “Dành cho học sinh tiểu học”.
- “Ôn tập trước bài kiểm tra”.

AI dẫn từng bước, đặt câu hỏi ngắn, mở đúng trang/hiện vật và tổng kết cuối tour. Cách này dễ kiểm soát chất lượng hơn chatbot mở và tận dụng tốt RAG hiện có.

### 8.7. Chế độ lớp học

- Giáo viên tạo mã lớp và mời học sinh tham gia.
- Giao lộ trình, tài liệu hoặc thử thách game.
- Xem tỷ lệ hoàn thành và câu hỏi thường sai.
- Xuất báo cáo CSV/PDF.
- Bảng xếp hạng có thể giới hạn trong lớp thay vì công khai toàn hệ thống.

Đây là hướng có giá trị thực tế cao nhất nếu dự án muốn phát triển thành sản phẩm EdTech.

### 8.8. Audio guide và nội dung song ngữ

- Nút nghe mô tả tại trang hiện vật và triển lãm.
- Transcript đầy đủ để hỗ trợ accessibility.
- Hai mức nội dung: bản ngắn cho khách tham quan và bản chi tiết cho học sinh/sinh viên.
- Tiếng Việt và tiếng Anh dùng chung một mã nội dung, không chép cứng ở từng trang.

### 8.9. WebAR trong tương lai

WebAR có thể cho phép đặt mô hình trống đồng vào bàn học hoặc phòng khách bằng camera điện thoại. Tuy nhiên đây là tính năng giai đoạn sau vì cần:

- Nén mạnh model 3D và texture.
- Kiểm thử WebXR trên nhiều thiết bị.
- Fallback cho iOS hoặc trình duyệt không hỗ trợ.
- Giải thích quyền camera và không lưu hình ảnh người dùng.

Không nên ưu tiên WebAR trước cấu hình deploy, kiểm thử, dữ liệu dùng chung và hiệu năng 3D.

## 9. Lộ trình triển khai đề xuất

### Giai đoạn 1 — Ổn định bản hiện tại

- Chuẩn hóa API origin.
- Chống gửi game session trùng và kiểm tra điểm ở backend.
- Commit và chạy CI.
- Bổ sung timeout frontend, retry có kiểm soát và thông báo trạng thái lưu.
- Hoàn thành semantic/answer evaluation cho RAG V3.

### Giai đoạn 2 — Hợp nhất dữ liệu

- Thiết kế schema cho hiện vật, địa điểm, tài liệu, bài học và nguồn tham khảo.
- Tạo API đọc nội dung.
- Chuyển frontend và knowledge pipeline sang cùng nguồn dữ liệu.
- Xây Admin Dashboard tối thiểu và quy trình duyệt nội dung.

### Giai đoạn 3 — Nâng trải nghiệm học tập

- Đồng bộ lộ trình học theo tài khoản.
- Thêm hộ chiếu nhà khảo cổ.
- Thêm giải mã mặt trống tương tác.
- Tạo gợi ý ôn tập dựa trên câu quiz sai.
- Bổ sung tìm kiếm và bộ lọc.

### Giai đoạn 4 — Mở rộng sản phẩm

- Chế độ lớp học.
- Audio guide và song ngữ.
- Bản đồ dòng thời gian.
- Xưởng phục chế.
- WebAR hoặc multiplayer sau khi đo được nhu cầu thực tế.

## 10. Tiêu chí cho bản phát hành tiếp theo

### Chức năng lõi

- Luồng đăng ký → đăng nhập → chơi cả ba game → lưu điểm → cập nhật hồ sơ → bảng xếp hạng chạy end-to-end.
- Không lưu trùng khi người dùng gửi lại cùng một game session.
- Tiến độ lộ trình được đồng bộ theo tài khoản.
- Không còn URL backend hard-code trong từng module.

### Chất lượng RAG

- Recall@5 của active V3 đạt tối thiểu 90% trên golden dataset.
- Ít nhất 85% câu trong phạm vi có câu trả lời đúng ý và được nguồn hỗ trợ.
- Ít nhất 95% câu ngoài phạm vi được từ chối hoặc hướng dẫn lại.
- 100% câu trả lời dữ kiện có ít nhất một nguồn hiển thị được.
- Không lộ provider, khóa, đường dẫn nội bộ hoặc stack trace.

### Hiệu năng và vận hành

- Có mục tiêu P95 rõ ràng cho API chat và các API thường.
- Frontend có timeout và cho phép thử lại.
- Có log lỗi, request ID, dashboard cơ bản và cảnh báo khi tỷ lệ lỗi tăng.
- Lighthouse và kiểm thử thiết bị thật đạt ngưỡng được nhóm thống nhất.

### Kiểm thử

- Unit test backend tiếp tục đạt.
- Có smoke test trình duyệt cho các hành trình chính.
- Có kiểm thử accessibility cơ bản.
- CI tự chạy khi đổi backend, knowledge, chunking, embedding, prompt hoặc model.
- Báo cáo đánh giá được lưu theo version knowledge, collection, model và prompt.

## 11. Kịch bản demo phù hợp với sản phẩm hiện tại

1. Mở trang chủ và giới thiệu mục tiêu bảo tàng số.
2. Chọn một hiện vật, xem hồ sơ và mở bản đồ liên quan.
3. Mở triển lãm, xoay và phóng to mô hình 3D.
4. Chơi nhanh một game và cho thấy kết quả được lưu khi đăng nhập.
5. Mở hồ sơ để xem tổng điểm, biểu đồ, huy hiệu và nhiệm vụ.
6. Mở bảng xếp hạng và thử bộ lọc theo game/thời gian.
7. Hỏi chatbox một câu có trong kho tri thức, mở thẻ nguồn.
8. Hỏi một câu ngoài phạm vi để trình diễn fallback an toàn.

Không nên demo WebAR, quên mật khẩu, CMS hoặc đánh giá RAG đạt chuẩn nếu các phần đó chưa được triển khai hoặc chưa có số liệu nghiệm thu.

## 12. Kết luận

Đông Sơn Digital Museum hiện là một nền tảng học tập di sản có chiều sâu hơn một bài tập frontend thông thường. Dự án đã có nội dung, 3D, bản đồ, ba game, tài khoản, bảng xếp hạng, thành tựu, tiến trình và RAG có nguồn.

Hướng đi tốt nhất lúc này không phải thêm thật nhiều hiệu ứng rời rạc, mà là ổn định luồng cốt lõi, hợp nhất dữ liệu và biến các khu vực hiện có thành một hành trình khám phá liền mạch. Trong các ý tưởng mới, ba tính năng phù hợp nhất để làm tiếp là:

1. **Hộ chiếu nhà khảo cổ** — tận dụng hạ tầng thành tựu hiện có và tạo động lực quay lại.
2. **Giải mã mặt trống tương tác** — làm nổi bật lợi thế 3D và giá trị giáo dục của dự án.
3. **Tour AI theo chủ đề** — tận dụng RAG nhưng kiểm soát chất lượng tốt hơn chat tự do.

Sau khi ba phần này ổn định, chế độ lớp học, audio guide, bản đồ dòng thời gian và WebAR sẽ là các bước mở rộng hợp lý để đưa sản phẩm từ demo học kỳ thành một nền tảng bảo tàng số có thể sử dụng thực tế.
