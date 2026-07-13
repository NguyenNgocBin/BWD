# Trang Xếp hạng

Trang Xếp hạng hiển thị thành tích của người chơi trong hệ thống Đông Sơn. Trang này giúp so sánh điểm, xem top 3 nổi bật và lọc bảng điểm theo từng nhóm trò chơi.

## Nội dung chính

Trang Xếp hạng gồm các phần:

- Hero "Bảng xếp hạng Đông Sơn": giới thiệu mục đích so sánh thành tích giữa người chơi.
- Thông tin cá nhân: hiển thị điểm của bạn, hạng hiện tại và game mạnh nhất.
- Bộ lọc tab: Tổng, Lật thẻ, Ghép hình, Đúng/Sai.
- Bộ lọc thời gian: Tổng mọi thời gian, Tuần này và Hôm nay.
- Có thể lọc theo tên lớp/nhóm nếu người dùng đã khai báo trong hồ sơ.
- Huy hiệu nổi bật của người chơi được hiển thị ở bục xếp hạng và bảng chi tiết.
- Podium top 3: ba thẻ người chơi nổi bật nhất.
- Strip vị trí của bạn: vị trí, tên người dùng, phần trăm top và tổng điểm.
- Bảng xếp hạng chi tiết: các vị trí sau top 3.

## Các tab xếp hạng

Trang có 4 tab:

- Tổng: xếp hạng tổng điểm của người chơi.
- Lật thẻ: xếp hạng theo trò lật thẻ ghép cặp họa tiết.
- Ghép hình: xếp hạng theo trò ghép hình trống đồng.
- Đúng/Sai: xếp hạng theo quiz kiến thức.

Khi bấm tab, top 3, thông tin cá nhân và bảng chi tiết sẽ đổi theo dữ liệu của tab đó.

## Top 3 hiện tại trong tab Tổng

- Hạng 1: Huyền My, 18.940 điểm, nhãn "Giữ phong độ", mô tả dẫn đầu nhờ tốc độ trả lời và độ chính xác cao.
- Hạng 2: Quang Minh, 17.520 điểm, nhãn "Bứt tốc", mô tả chuỗi 9 lượt chính xác liên tiếp.
- Hạng 3: Gia Bảo, 16.880 điểm, nhãn "Ổn định", mô tả điểm số đều ở cả ba nhóm trò chơi.

## Dữ liệu người dùng thật

Nếu người dùng đã đăng nhập, tab Tổng sẽ lấy thông tin user từ local/session storage và gọi API `/api/v1/auth/me` để cập nhật điểm tổng mới nhất. Nếu backend không phản hồi, trang vẫn giữ dữ liệu mẫu đang hiển thị.

## Animation top 3

Ba thẻ top 3 có lazy-load reveal animation. Khi cụm card vào vùng nhìn thấy, từng card sẽ hiện lên lần lượt bằng hiệu ứng opacity và dịch chuyển nhẹ.

## Khi người dùng hỏi trang xếp hạng để làm gì

Có thể trả lời: trang Xếp hạng dùng để xem top người chơi, so sánh điểm theo từng nhóm trò chơi, xem vị trí cá nhân và theo dõi ai đang dẫn đầu trong hành trình học về Đông Sơn.

