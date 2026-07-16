---
schema_version: 1
document_id: website.guide.hoc_vui
title: Trang Học vui
corpus: website
topic: Hướng dẫn học nhanh và lộ trình
entities: ["Trang Học vui", "Lộ trình học", "Đúng/Sai"]
references:
  - "repo:BWD/FE/pages/hocvui.html"
  - "repo:BWD/FE/pages/lo-trinh.html"
updated_at: '2026-07-14'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
---

# Trang Học vui

Trang Học vui là phần nhập môn của website Đông Sơn. Mục tiêu là giúp người dùng mới, đặc biệt là học sinh hoặc người chưa biết nhiều về trống đồng, hiểu nhanh các ý chính bằng ngôn ngữ đơn giản, hình ảnh lớn và các khối nội dung ngắn.

## Nội dung chính của Học vui

Trang Học vui gồm các phần:

- Hero: giới thiệu "Học vui cùng Trống Đồng Đông Sơn", nhấn mạnh cách học qua câu chuyện đơn giản, hình ảnh sinh động và dễ tiếp cận.
- Trống đồng là gì?: giải thích trống đồng Đông Sơn là loại trống làm bằng đồng từ rất lâu đời, được người Việt cổ dùng trong nghi lễ, lễ hội và các dịp quan trọng.
- Trên mặt trống có gì đặc biệt?: giới thiệu các biểu tượng thường gặp trên mặt trống như ngôi sao, chim Lạc, thuyền và hình người.
- Câu chuyện từ hàng nghìn năm trước: nói về quá trình đúc đồng phức tạp, trình độ kỹ thuật, đời sống lễ hội và thế giới quan của cư dân Đông Sơn.
- CTA cuối trang: mời người dùng vào Trò chơi để kiểm tra kiến thức hoặc vào Tài liệu để tìm hiểu thêm.

## Các biểu tượng được giải thích trong Học vui

- Ngôi sao: nằm ở giữa mặt trống, tượng trưng cho mặt trời và nguồn sống.
- Chim Lạc: biểu tượng quen thuộc của người Việt cổ, thường xuất hiện trên trống đồng.
- Thuyền: gợi đời sống sông nước, giao thông và môi trường cư trú.
- Con người: hình người nhảy múa, sinh hoạt, lễ hội thể hiện đời sống cộng đồng.

## Hiệu ứng trên trang

Trang Học vui có hiệu ứng scroll reveal. Khi người dùng cuộn trang, các khối nội dung và hình ảnh sẽ lần lượt hiện ra. Hiệu ứng này chỉ phục vụ trải nghiệm thị giác, không làm thay đổi nội dung học.

## Khi người dùng hỏi nên bắt đầu học ở đâu

Nên gợi ý bắt đầu ở trang Học vui nếu người dùng chưa biết trống đồng là gì. Sau khi đọc Học vui, người dùng có thể vào Tài liệu để học sâu hơn hoặc vào Trò chơi để ôn lại kiến thức.

# Lộ trình học 5 bài

Từ trang Học vui, người dùng có thể mở `/pages/lo-trinh.html` để học theo thứ tự: Trống đồng là gì; Hoa văn và biểu tượng; Kỹ thuật đúc đồng; Hiện vật tiêu biểu; Kiểm tra bằng game. Tiến độ bốn bài đầu được lưu trên trình duyệt. Bài 5 tự xác nhận khi tài khoản có kết quả game Đúng/Sai đã đồng bộ.
