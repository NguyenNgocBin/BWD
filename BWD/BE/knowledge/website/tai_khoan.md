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
- Email hoặc mô tả người khám phá Đông Sơn.
- Tổng điểm.
- Xếp hạng mẫu.
- Game mạnh nhất.
- Số lượt chơi mẫu.
- Độ chính xác mẫu.
- Chuỗi ngày mẫu.
- Thành tựu theo từng trò chơi.
- Bộ sưu tập huy hiệu.
- Thử thách hằng ngày.
- Lịch sử hoạt động.

Dữ liệu thật từ backend hiện được dùng cho:

- Username.
- Email.
- Avatar nếu có.
- Total score.

Các thống kê khác như số lượt chơi, độ chính xác, chuỗi ngày, huy hiệu và lịch sử hoạt động hiện chủ yếu là dữ liệu giao diện mẫu.

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

