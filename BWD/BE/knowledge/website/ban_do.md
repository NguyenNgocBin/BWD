---
schema_version: 1
document_id: website.guide.ban_do
title: Trang Bản đồ
corpus: website
topic: Hướng dẫn sử dụng bản đồ
entities: ["Trang Bản đồ", "Leaflet", "OpenStreetMap", "Hoàng Sa", "Trường Sa"]
references:
  - "repo:BWD/FE/pages/Map.html"
  - "repo:BWD/FE/js/map.js"
updated_at: '2026-07-14'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
---

# Trang Bản đồ

Trang Bản đồ là bản đồ tương tác của website Đông Sơn. Trang sử dụng Leaflet và OpenStreetMap để hiển thị các điểm phát hiện trống đồng, bảo tàng liên quan đến Đông Sơn và hai quần đảo Hoàng Sa, Trường Sa.

## Đường dẫn và mục tiêu

Đường dẫn: `/pages/Map.html`.

Mục tiêu:

- Giúp người dùng xem phân bố địa lý của trống đồng Đông Sơn trên lãnh thổ Việt Nam.
- Hiển thị bảo tàng đang lưu giữ hoặc trưng bày hiện vật Đông Sơn.
- Nhắc đến không gian biển đảo Việt Nam qua Hoàng Sa và Trường Sa.
- Cho phép bấm từng marker để xem thông tin chi tiết.

## Các loại điểm trên bản đồ

1. Điểm trống đồng:
   - Nhóm Bắc Bộ/Tây Bắc: Ngọc Lũ, Sông Đà, Hoàng Hạ, Cổ Loa, Cẩm Giang, Hữu Chung.
   - Nhóm Bắc Trung Bộ: Sao Vàng, Sông Mã, Quỳ Chử, Cẩm Giang.
   - Nhóm Trung Bộ: Duy Xuyên, Hòa Vang, Gò Quê, Nha Trang.
   - Nhóm Tây Nguyên: An Khê, Kon Tum.
   - Nhóm Nam Bộ: Phú Chánh, Long Giao, Vũng Tàu, Óc Eo.

2. Bảo tàng:
   - Bảo tàng Lịch sử Quốc gia.
   - Bảo tàng tỉnh Thanh Hóa.
   - Bảo tàng Hùng Vương.
   - Bảo tàng Tổng hợp Bình Dương.
   - Bảo tàng Đà Nẵng.
   - Bảo tàng Dân tộc học Việt Nam.
   - Bảo tàng Trưng bày Cổ vật Thành Cổ Loa.

3. Biển đảo:
   - Quần đảo Trường Sa.
   - Quần đảo Hoàng Sa.

## Chú giải biểu tượng

Các marker trống đồng dùng ảnh icon trống đồng thu nhỏ. Viền marker được tô theo màu vùng:

- Bắc Bộ/Tây Bắc: xanh lá.
- Bắc Trung Bộ: vàng.
- Trung Bộ: cam.
- Tây Nguyên: đỏ.
- Nam Bộ: xanh dương.

Marker bảo tàng dùng biểu tượng bảo tàng. Marker biển đảo dùng biểu tượng đảo.

Trống đồng Cẩm Giang được đặt tại khu vực thôn Phú Lai, xã Cẩm Giang, huyện Cẩm Thủy, tỉnh Thanh Hóa.

Trống đồng Hữu Chung được phát hiện tại xã Hữu Chung, huyện Tứ Kỳ, tỉnh Hải Dương. Bảo tàng tỉnh Hải Dương là nơi lưu giữ, không phải địa danh phát hiện.

Trống đồng Quỳ Chử được phát hiện năm 1980 tại Quỳ Chử, xã Thọ Diên, huyện Thọ Xuân, tỉnh Thanh Hóa. Không ghi Quỳ Chử là Nghệ An.

## Cách tương tác

- Kéo bản đồ để di chuyển.
- Phóng to/thu nhỏ bằng nút zoom Leaflet ở góc dưới phải.
- Bấm marker để xem chi tiết địa điểm.
- Khi bấm marker, bản đồ sẽ zoom tới địa điểm đó và mở panel thông tin.
- Bấm nút đóng trong panel để ẩn thông tin.
- Bấm "Toàn cảnh" để chuyển bản đồ sang chế độ fullscreen; bấm lại để thu gọn.
- Dùng danh sách "Chọn nhanh địa điểm" ở bên phải để nhảy tới một địa điểm cụ thể.

## Panel chi tiết hiển thị gì?

Khi chọn một địa điểm, panel chi tiết hiển thị:

- Ảnh đại diện.
- Tên địa điểm.
- Tỉnh/thành hoặc khu vực.
- Loại địa điểm: trống đồng, bảo tàng hoặc biển đảo.
- Năm phát hiện nếu là trống đồng.
- Không gian trưng bày nếu là bảo tàng.
- Khu vực địa lý.
- Đoạn giới thiệu ngắn.

## Khi người dùng hỏi bản đồ dùng để làm gì

Có thể trả lời: Bản đồ dùng để xem nơi phát hiện trống đồng Đông Sơn, các bảo tàng liên quan và không gian biển đảo Việt Nam. Người dùng có thể bấm từng điểm để xem mô tả, ảnh, năm phát hiện và khu vực.
