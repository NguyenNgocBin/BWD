# Kế hoạch hoàn thiện website Đông Sơn Digital Museum

## 1. Tổng quan nhận định

Đông Sơn Digital Museum là website bảo tàng số kết hợp học tập, tương tác và trò chơi hóa về văn hóa Đông Sơn. Website hiện đã có nhiều mảng tốt: trang chủ, học vui, tài liệu, triển lãm 3D, bản đồ di sản, game ghép hình, game đúng/sai, lật thẻ họa tiết, tài khoản người dùng, bảng xếp hạng và chatbox AI dùng RAG.

Điểm mạnh lớn nhất của dự án là ý tưởng rõ ràng: biến kiến thức lịch sử vốn dễ khô khan thành trải nghiệm có hình ảnh, bản đồ, mô hình 3D, game và AI hỏi đáp. Đây là hướng phù hợp cho học sinh, sinh viên, giáo viên, người yêu lịch sử và cả demo trong môi trường bảo tàng hoặc sự kiện văn hóa.

Điểm cần tập trung tiếp theo là làm cho dữ liệu thật sự nhất quán giữa frontend, backend và database. Một số trang đã có giao diện tốt nhưng vẫn còn dấu hiệu dữ liệu demo, lỗi mã hóa tiếng Việt, API chưa đồng bộ hoàn toàn, hoặc logic hiển thị chưa khớp với ý nghĩa nghiệp vụ.

## 2. Các file đã tham khảo

- `BWD/README.md`: mô tả tổng quan dự án, cách chạy frontend/backend, API, database và trạng thái hiện tại.
- `BWD/BE/knowledge/website/website_qa.md`: mô tả nhanh các chức năng chính của website.
- `BWD/BE/knowledge/website/tro_choi.md`: mô tả trang trò chơi, luật chơi, điểm số và các game.
- `BWD/BE/knowledge/website/xep_hang.md`: mô tả trang bảng xếp hạng.
- `bao-cao-cuoi-ky.md`, `BWD/BAO_CAO_DONG_SON_DIGITAL_MUSEUM.md`: dùng thêm để đối chiếu mục tiêu sản phẩm, kiến trúc và hướng phát triển.

## 3. Mức độ ưu tiên

### P0 - Cần làm ngay

Đây là các việc ảnh hưởng trực tiếp đến việc demo, chấm điểm, đăng nhập, lưu điểm hoặc khiến người dùng hiểu sai dữ liệu.

1. Sửa toàn bộ lỗi mã hóa tiếng Việt trong các file `.md`, HTML và dữ liệu hiển thị.
   - Hiện nhiều file mô tả từng bị mojibake ở các cụm `Đông Sơn`, `Bảng`, `Trò chơi`.
   - Nên chuẩn hóa toàn bộ file sang UTF-8.
   - Ưu tiên các file dùng cho chatbox/RAG vì dữ liệu lỗi mã hóa sẽ làm AI trả lời kém.

2. Hoàn thiện bảng xếp hạng theo đúng nghiệp vụ.
   - Tab Tổng phải tính từ tổng điểm tốt nhất của 3 game: Lật thẻ + Ghép hình + Đúng/Sai.
   - Tab từng game chỉ hiển thị số liệu liên quan đến game đó.
   - Cần kiểm tra lại dữ liệu `duration_seconds`, `best_streak`, `score`, `rank` sau mỗi lần lưu game.
   - Cần reload/restart backend sau khi sửa API leaderboard để tránh frontend vẫn dùng dữ liệu cũ.

3. Đồng bộ toàn bộ game với backend.
   - Lật thẻ, ghép hình, đúng/sai đều phải gửi kết quả về `POST /api/v1/game-sessions/`.
   - Khi chưa đăng nhập, game có thể chơi nhưng phải báo rõ điểm chưa được đồng bộ.
   - Khi đã đăng nhập, điểm phải cập nhật profile, bảng xếp hạng và lịch sử chơi.

4. Thống nhất URL backend theo môi trường.
   - Một số frontend đang gọi `http://localhost:5000`.
   - Nếu deploy thật, cần có cơ chế cấu hình `BACKEND_ORIGIN` riêng cho local và production.
   - Tránh tình trạng demo online nhưng frontend vẫn gọi localhost.

5. Kiểm tra lại luồng đăng nhập và token.
   - Đăng nhập xong phải cập nhật header/menu/trạng thái người dùng ở mọi trang.
   - Token hết hạn cần tự logout hoặc báo rõ.
   - Các API cần đăng nhập phải trả lỗi dễ hiểu bằng tiếng Việt.

## 4. P1 - Nên làm sau khi P0 ổn định

1. Hoàn thiện trang cá nhân.
   - Hiển thị tổng điểm theo từng game.
   - Hiển thị lịch sử chơi gần đây.
   - Thêm biểu đồ tiến bộ theo ngày hoặc theo game.
   - Thêm form đổi mật khẩu vì backend đã có API nhưng frontend chưa có form rõ ràng.

2. Chuẩn hóa nội dung trang trò chơi.
   - Trang giới thiệu game nên khớp với game thật đang có.
   - Nếu có game Lật thẻ thì không nên gọi nhầm là Tìm họa tiết nếu logic đã đổi.
   - Mỗi thẻ game nên có trạng thái: đã sẵn sàng, cần đăng nhập để lưu điểm, đang phát triển.

3. Tăng chất lượng dữ liệu cho chatbox AI.
   - Dọn encoding của toàn bộ `BE/knowledge`.
   - Bổ sung nguồn cho từng chủ đề: trống Ngọc Lũ, Hoàng Hạ, Cổ Loa, hoa văn, kỹ thuật đúc đồng.
   - Thêm câu hỏi thường gặp về cách dùng website, lỗi đăng nhập, lỗi lưu điểm.
   - Chạy lại script ingest sau khi sửa dữ liệu.

4. Kiểm thử responsive.
   - Kiểm tra các trang chính trên mobile: trang chủ, học vui, tài liệu, bản đồ, game, bảng xếp hạng.
   - Ưu tiên game và bảng xếp hạng vì bảng/canvas/drag-drop dễ vỡ layout.

5. Kiểm tra hiệu năng 3D.
   - Tối ưu dung lượng model `.glb`.
   - Thêm trạng thái loading rõ ràng.
   - Có fallback nếu thiết bị yếu hoặc WebGL lỗi.

## 5. P2 - Cải tiến trải nghiệm và mở rộng tính năng

1. Thêm Admin Dashboard.
   - Quản lý tài khoản người dùng.
   - Quản lý câu hỏi quiz.
   - Quản lý tài liệu RAG.
   - Quản lý địa điểm bản đồ.
   - Quản lý hiện vật và model 3D.

2. Thêm thành tựu và huy hiệu.
   - Ví dụ: "Người giải mã trống đồng", "Bậc thầy ghép hình", "Chuỗi đúng 10 câu", "Hoàn thành 3 game".
   - Huy hiệu nên xuất hiện trong profile và bảng xếp hạng.

3. Thêm nhiệm vụ hằng ngày.
   - Chơi 1 ván lật thẻ.
   - Hoàn thành 1 level ghép hình.
   - Trả lời đúng 5 câu quiz.
   - Nhận điểm thưởng hoặc huy hiệu khi hoàn thành.

4. Thêm bộ lọc thời gian cho bảng xếp hạng.
   - Tổng mọi thời gian.
   - Tuần này.
   - Hôm nay.
   - Theo lớp/nhóm nếu dùng trong trường học.

5. Thêm trang chi tiết hiện vật.
   - Mỗi trống đồng/hiện vật có trang riêng.
   - Có ảnh, bản đồ, mô tả, niên đại, nơi phát hiện, hoa văn nổi bật, câu hỏi liên quan.

6. Thêm chế độ học theo lộ trình.
   - Bài 1: Trống đồng là gì.
   - Bài 2: Hoa văn và biểu tượng.
   - Bài 3: Kỹ thuật đúc đồng.
   - Bài 4: Hiện vật tiêu biểu.
   - Bài 5: Kiểm tra bằng game.

## 6. P3 - Tính năng nâng cao

1. Multiplayer hoặc thi đấu nhanh.
   - Hai người cùng trả lời quiz trong thời gian thực.
   - Bảng xếp hạng phòng chơi.
   - Phù hợp cho lớp học hoặc sự kiện.

2. AR/WebAR.
   - Cho phép đặt mô hình trống đồng vào không gian thật qua camera.
   - Có chế độ chụp ảnh check-in.
   - Cần kiểm tra kỹ hiệu năng và quyền camera.

3. Đa ngôn ngữ.
   - Tiếng Việt trước.
   - Sau đó thêm tiếng Anh để giới thiệu văn hóa Việt cho du khách quốc tế.
   - Cần chuẩn hóa i18n thay vì viết text rải rác trong HTML/JS.

4. Gợi ý học tập cá nhân hóa.
   - Dựa trên game người dùng yếu nhất.
   - Nếu điểm quiz thấp, gợi ý đọc tài liệu liên quan.
   - Nếu ghép hình chậm, gợi ý luyện quan sát hoa văn.

5. Xuất báo cáo học tập.
   - Cho giáo viên hoặc người dùng tải báo cáo PDF.
   - Gồm điểm, thời gian chơi, độ chính xác, tiến bộ theo tuần.

## 7. Danh sách lỗi và điểm cần kiểm tra theo trang

### Trang chủ

- Kiểm tra link điều hướng có đúng đường dẫn không.
- Kiểm tra video/hình ảnh có tải nhanh không.
- Kiểm tra canvas/animation có làm chậm mobile không.

### Học vui

- Dọn nội dung tiếng Việt có dấu.
- Bổ sung ảnh minh họa sát nội dung.
- Thêm liên kết sang tài liệu chi tiết hoặc game liên quan.

### Tài liệu

- Tổ chức lại nội dung theo nhóm rõ ràng.
- Thêm mục lục hoặc tìm kiếm nội dung.
- Bổ sung nguồn tham khảo cho các thông tin lịch sử.

### Triển lãm

- Kiểm tra model 3D có load ổn trên Chrome/Edge/mobile không.
- Thêm fallback nếu model lỗi.
- Bổ sung mô tả hiện vật cụ thể thay vì chỉ trình diễn mô hình.

### Bản đồ

- Kiểm tra marker, popup, ảnh và thông tin địa điểm.
- Thêm bộ lọc theo vùng miền, loại hiện vật, bảo tàng, địa điểm khảo cổ.
- Cân nhắc thêm timeline phát hiện hiện vật.

### Trò chơi

- Thống nhất tên game: Lật thẻ, Ghép hình, Đúng/Sai.
- Mỗi game cần có luật chơi ngắn ngay trong trang game.
- Mỗi game cần báo trạng thái lưu điểm: đã đồng bộ, chưa đăng nhập, lỗi server.

### Bảng xếp hạng

- Kiểm tra tổng điểm có bằng điểm của 3 game cộng lại không.
- Tab game riêng không được hiển thị dữ liệu lẫn game khác.
- Cột thời gian nên ghi rõ đơn vị: "Số giây".
- Nếu không có dữ liệu, cần hiện empty state đẹp và dễ hiểu.

### Tài khoản/Profile

- Thêm đổi mật khẩu.
- Thêm lịch sử chơi.
- Thêm thống kê từng game.
- Kiểm tra upload/chọn avatar nếu có.

### Chatbox AI

- Dọn dữ liệu knowledge bị lỗi mã hóa.
- Cho AI trả lời bằng tiếng Việt có dấu.
- Hiển thị nguồn câu trả lời nếu có.
- Có fallback rõ ràng khi không đủ dữ liệu.

## 8. Đề xuất thứ tự làm trong 7 ngày

### Ngày 1

- Sửa encoding tiếng Việt trong các file hiển thị và knowledge quan trọng.
- Rà toàn bộ text không dấu trên frontend.

### Ngày 2

- Hoàn thiện leaderboard: tổng điểm, tab game riêng, thời gian, rank cá nhân.
- Test với ít nhất 3 tài khoản và dữ liệu game thật.

### Ngày 3

- Kiểm tra lưu điểm của 3 game.
- Sửa các chỗ game chưa đồng bộ backend.
- Thêm thông báo lưu điểm rõ ràng.

### Ngày 4

- Hoàn thiện profile: thống kê game, lịch sử chơi, đổi mật khẩu.
- Kiểm tra token và logout.

### Ngày 5

- Dọn knowledge base và chạy lại ingest cho chatbox.
- Test các câu hỏi phổ biến về Đông Sơn và cách dùng website.

### Ngày 6

- Kiểm tra responsive mobile cho các trang chính.
- Tối ưu hình ảnh/model nặng.

### Ngày 7

- Viết checklist demo.
- Chạy thử toàn bộ luồng: đăng ký, đăng nhập, chơi 3 game, xem profile, xem BXH, hỏi chatbox.
- Ghi lại lỗi còn tồn tại để xử lý sau.

## 9. Checklist demo trước khi nộp hoặc thuyết trình

- Backend chạy được tại URL cấu hình.
- Frontend gọi đúng backend.
- Đăng ký tài khoản mới thành công.
- Đăng nhập thành công.
- Chơi Lật thẻ và lưu điểm.
- Chơi Ghép hình và lưu điểm.
- Chơi Đúng/Sai và lưu điểm.
- Profile cập nhật điểm.
- BXH tổng đúng bằng tổng 3 game.
- Tab BXH từng game hiển thị đúng dữ liệu game đó.
- Chatbox trả lời được câu hỏi cơ bản.
- Bản đồ mở được và popup marker hiển thị đúng.
- Triển lãm/model 3D load được.
- Không còn chữ lỗi mã hóa hoặc tiếng Việt không dấu trong UI.

## 10. Kết luận

Website đã có nền tảng tốt và ý tưởng đủ mạnh để phát triển thành một sản phẩm giáo dục số có chiều sâu. Việc cần làm tiếp không phải là thêm thật nhiều hiệu ứng, mà là làm chắc dữ liệu, sửa lỗi hiển thị, thống nhất logic điểm số, hoàn thiện profile/leaderboard và chuẩn hóa nội dung tiếng Việt.

Sau khi các phần lõi ổn định, nên phát triển thêm admin dashboard, huy hiệu, nhiệm vụ hằng ngày, bộ lọc bảng xếp hạng và trang chi tiết hiện vật. Những tính năng này sẽ giúp website không chỉ đẹp khi demo mà còn có khả năng sử dụng lâu dài.
