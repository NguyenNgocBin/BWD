---
schema_version: 1
document_id: website.guide.tai_khoan
title: Tài khoản, đăng nhập, đăng ký và hồ sơ cá nhân
corpus: website
topic: Tài khoản và hồ sơ người dùng
entities: ["Tài khoản Đông Sơn", "Đăng nhập", "Đăng ký", "Trang Cá nhân"]
references:
  - "repo:BWD/FE/js/login.js"
  - "repo:BWD/FE/js/profile.js"
  - "repo:BWD/BE/services/auth_service.py"
updated_at: '2026-07-14'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
---

# Tài khoản, đăng nhập, đăng ký và hồ sơ cá nhân

Website Đông Sơn có hệ thống tài khoản để lưu thông tin người dùng, điểm tổng và hồ sơ cá nhân. Các trang liên quan gồm Đăng ký, Đăng nhập và Cá nhân.

## Đăng ký tài khoản

Đường dẫn: `/pages/register.html`.

Thông tin cần nhập:

- Tên người dùng.
- Email.
- Mật khẩu.
- Xác nhận mật khẩu.

Luật kiểm tra ở frontend:

- Tên người dùng không được để trống.
- Email không được để trống và phải đúng định dạng email.
- Mật khẩu không được để trống và phải có ít nhất 6 ký tự.
- Xác nhận mật khẩu phải khớp với mật khẩu.
- Có hiển thị thanh kiểm tra độ mạnh mật khẩu:
  - Yếu.
  - Trung bình.
  - Mạnh.

Sau khi đăng ký thành công, website chuyển người dùng sang trang Đăng nhập.

## Đăng nhập

Đường dẫn: `/pages/login.html`.

Thông tin cần nhập:

- Email.
- Mật khẩu.

Chức năng:

- Có nút hiện/ẩn mật khẩu.
- Có checkbox "Ghi nhớ tôi".
- Nếu chọn "Ghi nhớ tôi", token và thông tin user được lưu ở `localStorage`.
- Nếu không chọn, thông tin được lưu ở `sessionStorage`.
- Sau khi đăng nhập thành công, website chuyển sang trang Cá nhân.

Lưu ý:

- Nút Google/Facebook có trong giao diện nhưng backend hiện thông báo chưa cấu hình đăng nhập mạng xã hội.
- Nếu backend chưa chạy ở cổng 5000, frontend sẽ báo không kết nối được backend.

## Hồ sơ cá nhân

Đường dẫn: `/pages/profile.html`.

Trang Cá nhân yêu cầu đăng nhập. Nếu không có token, người dùng sẽ bị chuyển về trang Đăng nhập.

Thông tin hiển thị:

- Ảnh đại diện.
- Tên người dùng.
- Email và lớp/nhóm nếu đã khai báo.
- Tổng điểm.
- Xếp hạng hiện tại.
- Game mạnh nhất.
- Tổng số lượt chơi.
- Độ chính xác tính từ các lượt quiz đã đồng bộ.
- Chuỗi trả lời/hoàn thành tốt nhất.
- Thành tựu theo từng trò chơi.
- Bộ sưu tập huy hiệu.
- Thử thách hằng ngày.
- Lịch sử các lượt chơi đã đồng bộ.

Dữ liệu thật từ backend hiện được dùng cho:

- Username.
- Email.
- Avatar nếu có.
- Total score.
- Điểm tốt nhất theo từng game, lịch sử chơi và biểu đồ tiến bộ.
- Huy hiệu đã mở khóa và ba nhiệm vụ hằng ngày.
- Người dùng có thể khai báo lớp/nhóm để dùng bộ lọc bảng xếp hạng trường học.

Các khối này được lấy từ API tài khoản, bảng xếp hạng, lịch sử game và progression. Nội dung tĩnh ban đầu trong HTML chỉ là trạng thái chờ trước khi JavaScript tải dữ liệu; nếu API lỗi, trang hiển thị trạng thái lỗi hoặc dữ liệu cache gần nhất chứ không coi số mẫu ban đầu là thành tích thật.

## Đổi mật khẩu và lớp/nhóm

- Nút đổi mật khẩu gọi `PUT /api/v1/auth/change-password`; mật khẩu mới phải có ít nhất 6 ký tự và hai lần nhập phải khớp.
- Người dùng có thể cập nhật lớp/nhóm qua `PUT /api/v1/auth/profile`. Giá trị này được dùng khi lọc bảng xếp hạng theo lớp/nhóm.

## Đổi tên

Trong trang Cá nhân có nút "Đổi tên".

Cách hoạt động:

- Người dùng bấm "Đổi tên".
- Trình duyệt mở prompt để nhập tên hiển thị mới.
- Frontend gọi API `PUT /api/v1/auth/profile` với username mới.
- Nếu backend trả về user mới, frontend cập nhật lại local/session storage và render lại hồ sơ.

## Đăng xuất

Trong trang Cá nhân có nút "Đăng xuất".

Cách hoạt động:

- Người dùng xác nhận đăng xuất.
- Frontend gọi API logout nếu có token.
- Sau đó xóa `authToken` và `authUser` khỏi `localStorage` và `sessionStorage`.
- Người dùng được chuyển về trang Đăng nhập.

