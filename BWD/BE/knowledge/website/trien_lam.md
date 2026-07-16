---
schema_version: 1
document_id: website.guide.trien_lam
title: Trang Triển lãm
corpus: website
topic: Hướng dẫn triển lãm 3D
entities: ["Trang Triển lãm", "Tour 3D Đông Sơn"]
references:
  - "repo:BWD/FE/pages/trienlam.html"
updated_at: '2026-07-14'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
---

# Trang Triển lãm

Trang Triển lãm là không gian tham quan trực tuyến của website Đông Sơn. Trang này tập trung vào trải nghiệm xem triển lãm 3D về trống đồng, hoa văn và văn hóa Việt cổ.

## Đường dẫn và mục tiêu

Đường dẫn: `/pages/trienlam.html`.

Mục tiêu:

- Cho người dùng bước vào một không gian trưng bày 3D.
- Đặt trống đồng làm tâm điểm quan sát.
- Hỗ trợ xem triển lãm trực tiếp trong website hoặc mở ở tab mới.

## Nội dung chính

Trang có các phần:

- Hero "Bước vào không gian Đông Sơn".
- Mô tả: không gian trưng bày 3D tập trung vào trống đồng, hoa văn và các lớp nghĩa văn hóa Việt cổ.
- Điểm nhấn: hình ảnh trống đồng và ghi chú rằng trống đồng được đặt làm tâm điểm.
- Viewer chính: iframe nhúng tour triển lãm tại `https://vnmh.egal.vn/tours/dongson/`.
- Toolbar: có nút Toàn màn hình và Mở tab mới.

## Cách dùng

- Bấm "Bắt đầu tham quan" để đi xuống khu viewer.
- Bấm "Toàn màn hình" để phóng to vùng iframe triển lãm.
- Bấm "Mở tab mới" để mở tour 3D trong tab trình duyệt riêng.
- Nếu iframe đang tải, trang hiển thị trạng thái "Đang tải triển lãm".

## Lưu ý trải nghiệm

Trang khuyến nghị xem ở màn hình ngang hoặc toàn màn hình để quan sát rõ hơn. Nếu trình duyệt không hỗ trợ fullscreen, website sẽ báo lỗi bằng alert.

