---
schema_version: 1
document_id: website.guide.trien_lam
title: Trang Triển lãm
corpus: website
topic: Hướng dẫn mô hình 3D và triển lãm ảo
entities: ["Trang Triển lãm", "Mô hình tham khảo 3D", "Triển lãm ảo Đông Sơn", "Tour AI"]
references:
  - "repo:BWD/FE/pages/trienlam.html"
updated_at: '2026-07-17'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
---

# Trang Triển lãm

Trang Triển lãm là không gian tham quan trực tuyến của website Đông Sơn. Trang kết hợp phòng thực hành với ba model GLB nội bộ và một triển lãm ảo Đông Sơn được nhúng từ website bên ngoài.

## Đường dẫn và mục tiêu

Đường dẫn: `/pages/trienlam.html`.

Mục tiêu:

- Cho người dùng luyện thao tác xoay, zoom và nhận biết cấu tạo chung của trống đồng.
- Cho người dùng tham quan triển lãm ảo trực tiếp trong website hoặc mở ở tab mới.
- Làm điểm dừng cho Tour AI có hướng dẫn.

## Nội dung chính

Trang có các phần:

- Hero "Bước vào không gian Đông Sơn".
- Phòng thực hành gồm ba model mang tên Mô hình tham khảo 01, 02 và 03.
- Viewer triển lãm ảo: iframe nhúng tour tại `https://vnmh.egal.vn/tours/dongson/`.
- Toolbar triển lãm ảo: có nút Toàn màn hình và Mở tab mới.

## Giới hạn của ba model 3D

Danh tính hiện vật của ba file GLB nội bộ chưa được xác minh. Website chỉ dùng các model này để quan sát hình khối và nhận biết các phần cấu tạo chung như mặt, tang, thân và chân trống.

Không được giới thiệu ba model là bản số hóa của trống Ngọc Lũ, Hoàng Hạ, Cổ Loa hoặc Tân Long. Khi cần tìm hiểu một hiện vật cụ thể, người dùng phải xem hồ sơ và hình ảnh đúng của hiện vật đó.

## Cách dùng

- Chọn Mô hình tham khảo 01, 02 hoặc 03 để mở viewer GLB, xoay và zoom.
- Bấm "Bắt đầu tham quan" để đi xuống khu triển lãm ảo.
- Bấm "Toàn màn hình" để phóng to vùng iframe triển lãm.
- Bấm "Mở tab mới" để mở tour 3D trong tab trình duyệt riêng.
- Nếu iframe đang tải, trang hiển thị trạng thái "Đang tải triển lãm".

## Tour AI trên trang Triển lãm

Chatbox có hai tour sử dụng trực tiếp trang này:

- "Làm quen với cấu tạo trống đồng 3D": hướng dẫn quan sát ba model chưa định danh mà không suy đoán tên hiện vật.
- "Dạo quanh không gian Đông Sơn": hướng dẫn người dùng tự tham quan triển lãm nhúng và ghi lại điểm gây chú ý.

Tour "Khám phá trống Ngọc Lũ" cũng có bước 3D tùy chọn, nhưng luôn nói rõ model chỉ minh họa cấu tạo chung chứ không phải mô hình của Ngọc Lũ.

## Lưu ý trải nghiệm

Trang khuyến nghị xem ở màn hình ngang hoặc toàn màn hình để quan sát rõ hơn. Vì triển lãm được nhúng từ tên miền khác, chatbox không thể biết người dùng đang đứng ở đâu hoặc vừa chọn hiện vật nào trong iframe; người dùng cần tự xác nhận đã quan sát xong.
