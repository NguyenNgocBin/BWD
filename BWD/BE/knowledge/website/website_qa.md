# Hỏi đáp nhanh về website Đông Sơn

File này giúp chatbox trả lời các câu hỏi ngắn, trực tiếp về cách dùng website Đông Sơn.

## Website Đông Sơn có những chức năng gì?

Website Đông Sơn có các chức năng chính:

- Học kiến thức nhập môn ở trang Học vui.
- Đọc tài liệu chuyên sâu ở trang Tài liệu.
- Xem triển lãm 3D ở trang Triển lãm.
- Chơi game học tập ở trang Trò chơi.
- Xem bản đồ các địa điểm trống đồng, bảo tàng và biển đảo ở trang Bản đồ.
- Xem điểm và thứ hạng ở trang Xếp hạng.
- Đăng ký, đăng nhập và xem hồ sơ ở trang Cá nhân.
- Hỏi AI Đông Sơn qua chatbox.

## Tôi nên bắt đầu từ đâu nếu mới vào website?

Nếu chưa biết nhiều về trống đồng, nên bắt đầu ở trang Học vui. Trang này giải thích trống đồng là gì, mặt trống có biểu tượng gì và vì sao trống đồng quan trọng. Sau đó có thể vào Trò chơi để ôn lại, hoặc vào Tài liệu nếu muốn đọc sâu hơn.

## Trò Ghép hình trống đồng chơi như thế nào?

Trò Ghép hình trống đồng nằm ở `/pages/game/puzzle.html`. Người chơi bấm bắt đầu level, kéo các mảnh ghép từ khay vào đúng ô trên bảng để hoàn thành hình mặt trống đồng.

Luật chơi:

- Level 1 có 4 mảnh theo bố cục 2x2.
- Level 2 có 6 mảnh theo bố cục 2x3.
- Level 3 có 9 mảnh theo bố cục 3x3.
- Mỗi level có 60 giây.
- Đặt đúng mảnh thì mảnh khóa vào vị trí.
- Đặt sai thì mảnh quay về khay và bị trừ điểm.
- Hoàn thành level sẽ mở level tiếp theo.

Tính điểm:

- Đúng mỗi mảnh: +10 điểm.
- Sai vị trí: -5 điểm và mất combo.
- Combo 2 mảnh đúng liên tiếp: thưởng +5.
- Combo 3 mảnh đúng liên tiếp: thưởng +10.
- Combo từ 4 mảnh đúng liên tiếp trở lên: thưởng +15.
- Hoàn thành nhanh được thưởng thời gian: còn ít nhất 40 giây thưởng +50, còn ít nhất 20 giây thưởng +30, còn dưới 20 giây thưởng +10.
- Hoàn thành level thưởng thêm +50 điểm.

## Trò Đúng hay Sai chơi như thế nào?

Trò Đúng hay Sai là quiz camera ở `/pages/game/codechayquiz.html`. Game có 25 câu, chia thành 5 chương, mỗi chương 5 câu. Mỗi câu có hai đáp án A và B.

Cách chọn đáp án:

- Nghiêng đầu sang trái để chọn A nếu bật camera.
- Nghiêng đầu sang phải để chọn B nếu bật camera.
- Có thể bấm nút A/B trên màn hình.
- Có thể dùng phím A/D hoặc mũi tên trái/phải.

Luật chơi:

- Mỗi câu có 10 giây.
- Trả lời đúng được +10 điểm.
- Trả lời đúng liên tiếp có thưởng chuỗi.
- Trả lời sai hoặc hết giờ thì không cộng điểm và chuỗi đúng bị reset.
- Sau mỗi chương, game hiện màn hình hoàn thành chương và nút chuyển chương tiếp theo.

## Trò Lật thẻ họa tiết chơi như thế nào?

Trò Lật thẻ họa tiết nằm ở `/pages/game/motif-hunt.html`. Người chơi lật hai thẻ để tìm cặp hình giống nhau, ghép đúng để cộng điểm và tăng combo, ghép sai thì hai thẻ tự úp lại. Game có thời gian 2 phút. Khách vẫn chơi được nhưng cần đăng nhập để đồng bộ điểm và lịch sử.

## Trang Bản đồ dùng để làm gì?

Trang Bản đồ dùng để xem các địa điểm phát hiện trống đồng, các bảo tàng liên quan đến Đông Sơn và hai quần đảo Hoàng Sa, Trường Sa. Người dùng có thể bấm từng marker trên bản đồ để xem ảnh, tên địa điểm, tỉnh/thành, loại địa điểm, năm phát hiện và mô tả ngắn.

## Trang Xếp hạng dùng để làm gì?

Trang Xếp hạng dùng để xem top người chơi, so sánh điểm theo từng nhóm trò chơi và xem vị trí cá nhân. Trang có các tab Tổng, Lật thẻ, Ghép hình và Đúng/Sai. Dữ liệu được lấy trực tiếp từ backend, không dùng danh sách top mẫu cố định.

## Trang Tài liệu khác gì trang Học vui?

Trang Học vui là phần nhập môn, viết ngắn và dễ hiểu cho người mới. Trang Tài liệu là phần đọc sâu hơn, có các chủ đề như phân loại Heger, cấu tạo trống, hoa văn, dòng thời gian, hiện vật tiêu biểu và nguồn tham khảo.

## Trang Triển lãm có gì?

Trang Triển lãm nhúng một tour 3D về Đông Sơn. Người dùng có thể xem không gian trưng bày trực tuyến, dùng nút mở toàn màn hình hoặc mở tour ở tab mới.

## Có cần đăng nhập không?

Không bắt buộc đăng nhập để đọc nội dung hoặc xem các trang thông tin. Tuy nhiên, đăng nhập giúp website nhận diện người dùng, hiển thị hồ sơ cá nhân, tổng điểm và thông tin liên quan đến tài khoản.

## Chatbox có thể trả lời những gì?

Chatbox có thể trả lời cả kiến thức Đông Sơn và hướng dẫn dùng website. Ví dụ người dùng có thể hỏi:

- Trống đồng Đông Sơn là gì?
- Chim Lạc có ý nghĩa gì?
- Game ghép hình chơi như thế nào?
- Quiz camera chọn đáp án ra sao?
- Bản đồ hiển thị những địa điểm nào?
- Xếp hạng tính theo tab nào?
- Đăng ký, đăng nhập và đổi tên làm thế nào?
