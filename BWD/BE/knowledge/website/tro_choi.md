# Trang Trò chơi và luật chơi

Trang Trò chơi là khu vực học tập tương tác của website Đông Sơn. Người dùng vừa chơi vừa ôn kiến thức về trống đồng, hoa văn, cấu tạo, lịch sử và bảo tồn di sản. Trang giới thiệu ba hướng chơi chính: Tìm đúng họa tiết, Ghép hình trống đồng và Đúng hay Sai.

## Trang chọn trò chơi

Trang `/pages/trochoi.html` có các phần:

- Hero "Trò chơi Đông Sơn": giới thiệu hành trình chơi và học qua thử thách trí tuệ.
- Thẻ hồ sơ trò chơi: hiển thị tên người chơi và điểm hiện tại nếu người dùng đã đăng nhập.
- Mục "Chơi như thế nào?": nhấn mạnh ba bước: trả lời chính xác, hoàn thành thử thách, nhận thưởng và tích lũy điểm.
- Danh sách trò chơi dạng slider gồm 3 thẻ.
- Thử thách hôm nay: nhiệm vụ ngắn như chơi 1 game, đúng 5 câu liên tiếp, hoàn thành 3 game.

## Trò chơi Tìm đúng họa tiết

Trò này xuất hiện dưới dạng thẻ trong trang Trò chơi.

Cách chơi:

- Người chơi quan sát hình ảnh hoặc gợi ý về các mô-típ Đông Sơn.
- Chọn đúng họa tiết như chim Lạc, ngôi sao, thuyền hoặc hình người.
- Mục tiêu là luyện mắt quan sát và phân biệt các chi tiết dễ nhầm trên trống đồng.

Thông tin hiển thị trên thẻ:

- Chủ đề: Quan sát.
- Thời lượng gợi ý: 2 phút.
- Độ khó: Dễ.
- Điểm gợi ý: mỗi lượt trả lời đúng cộng 15 điểm.

Lưu ý: trong code hiện tại, thẻ Tìm đúng họa tiết có nút "Chơi ngay" dạng button, chưa trỏ sang một trang game riêng như Ghép hình hoặc Đúng/Sai.

## Trò chơi Ghép hình trống đồng

Đường dẫn: `/pages/game/puzzle.html`.

Mục tiêu:

- Kéo các mảnh ghép vào đúng vị trí để hoàn thành hình mặt trống đồng.
- Càng nhanh và càng đặt đúng nhiều mảnh liên tiếp thì điểm càng cao.

Cấp độ:

- Level 1: 4 mảnh, bố cục 2x2.
- Level 2: 6 mảnh, bố cục 2x3.
- Level 3: 9 mảnh, bố cục 3x3.
- Ban đầu chỉ mở Level 1. Hoàn thành level sẽ mở level tiếp theo.

Cách chơi:

- Bấm "Bắt đầu level" để bắt đầu.
- Mảnh ghép nằm ở khay bên phải.
- Kéo từng mảnh vào ô đúng trên bảng ghép hình.
- Nếu đặt đúng, mảnh khóa vào vị trí.
- Nếu đặt sai, mảnh quay về khay cũ và bị trừ điểm.
- Có thể bấm "Chơi lại từ đầu" để reset toàn bộ.
- Sau khi hoàn thành một level, có thể dùng nút "Chuyển sang level khác" nếu đã mở thêm level.

Luật tính điểm:

- Đúng mỗi mảnh: +10 điểm.
- Sai vị trí: -5 điểm và reset combo.
- Combo đúng liên tiếp:
  - 2 mảnh đúng liên tiếp: thưởng +5.
  - 3 mảnh đúng liên tiếp: thưởng +10.
  - Từ 4 mảnh đúng liên tiếp trở lên: thưởng +15.
- Thưởng thời gian khi hoàn thành:
  - Còn từ 40 giây trở lên: +50.
  - Còn từ 20 đến dưới 40 giây: +30.
  - Còn dưới 20 giây: +10.
- Thưởng hoàn thành level: +50 điểm.

Thời gian:

- Mỗi level có 60 giây.
- Nếu hết giờ trước khi ghép xong, level thất bại và người chơi có thể thử lại.

Vừa chơi vừa học:

- Khi hoàn thành level, popup học nhanh xuất hiện với thông tin như: ngôi sao giữa mặt trống tượng trưng cho mặt trời, chim Lạc là biểu tượng của người Việt cổ.
- Sau khi phá đảo Level 3, người chơi có thể nhập tên để lưu bảng xếp hạng local của trò Ghép hình.

## Trò chơi Đúng hay Sai / Quiz camera

Đường dẫn: `/pages/game/codechayquiz.html`.

Mục tiêu:

- Trả lời các câu hỏi trắc nghiệm nhanh về trống đồng và văn hóa Đông Sơn.
- Mỗi câu có hai đáp án A và B.
- Người chơi có thể chọn bằng nút trên màn hình, bàn phím hoặc nghiêng đầu khi bật camera.

Cấu trúc câu hỏi:

- Tổng cộng 25 câu.
- Chia thành 5 chương, mỗi chương 5 câu:
  1. Nguồn gốc trống đồng.
  2. Hoa văn và biểu tượng.
  3. Kỹ thuật và cấu tạo.
  4. Giá trị lịch sử.
  5. Bảo tồn và phát huy.

Cách chơi bằng camera:

- Bấm "Bắt đầu chơi".
- Hệ thống xin quyền mở camera.
- Người chơi đặt khuôn mặt trong khung hình.
- Nghiêng đầu sang trái để chọn đáp án A.
- Nghiêng đầu sang phải để chọn đáp án B.
- Sau khi chọn bằng đầu, người chơi cần đưa đầu về chính giữa để chuyển sang câu tiếp theo.
- Có nút "Bật/Tắt camera" để điều khiển camera.

Cách chơi không dùng camera:

- Có thể bấm trực tiếp nút A hoặc B trên màn hình.
- Có thể dùng phím A/D để chọn đáp án.
- Có thể dùng mũi tên trái/phải như một cách mô phỏng hướng nghiêng.

Luật thời gian và điểm:

- Mỗi câu có 10 giây.
- Trả lời đúng: +10 điểm.
- Nếu có chuỗi đúng từ 2 câu trở lên, có thưởng chuỗi. Mức thưởng tăng dần, tối đa theo logic trong game là `Math.min(currentStreak - 1, 4) * 5`.
- Trả lời sai hoặc hết giờ: không cộng điểm và reset chuỗi đúng.
- Sau mỗi chương 5 câu, game dừng ở màn hình hoàn thành chương và hiện nút "Chương tiếp theo".
- Hoàn thành hết 25 câu thì game hiển thị tổng điểm.

Theo dõi thành tựu trong quiz:

- SCORE: điểm hiện tại.
- QUESTION: số câu đang chơi trên tổng 25 câu.
- TIME: thời gian còn lại của câu hiện tại.
- CHUỖI ĐÚNG: số câu đúng liên tiếp.
- ĐỘ CHÍNH XÁC: phần trăm câu đúng trên tổng câu đã trả lời.
- ĐIỂM CAO NHẤT HÔM NAY: điểm cao nhất trong phiên.
- Huy hiệu hiện tại: "Người giải mã trống đồng".

## Khi người dùng hỏi nên chơi trò nào trước

Nếu người dùng mới bắt đầu, nên gợi ý chơi Ghép hình Level 1 hoặc đọc Học vui trước. Nếu muốn ôn kiến thức nhanh, gợi ý Đúng/Sai. Nếu muốn luyện quan sát hoa văn, gợi ý Tìm đúng họa tiết.

