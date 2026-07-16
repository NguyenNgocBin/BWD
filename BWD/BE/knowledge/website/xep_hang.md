---
schema_version: 1
document_id: website.guide.xep_hang
title: Trang Xếp hạng
corpus: website
topic: Bảng xếp hạng và bộ lọc điểm
entities: ["Trang Xếp hạng", "Lật thẻ", "Ghép hình", "Đúng/Sai"]
references:
  - "repo:BWD/FE/pages/bxh.html"
  - "repo:BWD/FE/js/bxh.js"
  - "repo:BWD/BE/services/leaderboard_service.py"
updated_at: '2026-07-14'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
---

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

## Dữ liệu bảng xếp hạng

Mỗi tab gọi `GET /api/v1/leaderboard/` với các tham số `scope`, `period`, `group` và `limit`. Top 3, bảng chi tiết và thông tin cá nhân đều được render lại từ phản hồi backend; các tên và điểm có sẵn trong HTML chỉ là nội dung chờ trước khi JavaScript tải dữ liệu, không phải bảng xếp hạng hiện tại.

- Khách vẫn xem được danh sách xếp hạng công khai.
- Nếu đã đăng nhập, frontend gửi Bearer token để backend trả thêm vị trí và thành tích của chính người dùng.
- Tab Tổng cộng **điểm tốt nhất** của ba game; mỗi tab game xếp theo thành tích tốt nhất của game tương ứng.
- Bộ lọc thời gian hỗ trợ toàn bộ, tuần hiện tại và ngày hiện tại; bộ lọc lớp/nhóm gửi chuỗi `group` tới backend.
- Nếu backend không phản hồi, trang chuyển các vùng dữ liệu sang trạng thái lỗi; không dùng các số mẫu ban đầu làm kết quả thật.

## Animation top 3

Ba thẻ top 3 có lazy-load reveal animation. Khi cụm card vào vùng nhìn thấy, từng card sẽ hiện lên lần lượt bằng hiệu ứng opacity và dịch chuyển nhẹ.

## Khi người dùng hỏi trang xếp hạng để làm gì

Có thể trả lời: trang Xếp hạng dùng để xem top người chơi, so sánh điểm theo từng nhóm trò chơi, xem vị trí cá nhân và theo dõi ai đang dẫn đầu trong hành trình học về Đông Sơn.

