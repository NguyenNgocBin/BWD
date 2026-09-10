---
schema_version: 1
document_id: website.guide.chatbox
title: Chatbox AI Đông Sơn
corpus: website
topic: Hướng dẫn sử dụng chatbox RAG
entities: ["Chatbox AI Đông Sơn", "Tour AI", "RAG V3", "ChromaDB", "Gemini embedding"]
references:
  - "repo:BWD/FE/js/chatbox-ui.js"
  - "repo:BWD/BE/services/rag_v3_service.py"
  - "repo:BWD/BE/services/collection_manifest_service.py"
  - "repo:BWD/BE/services/chat_service.py"
updated_at: '2026-07-17'
reviewed_by: 'Nhóm dự án — rà soát kỹ thuật'
review_status: code_verified
confidence: high
retrieval_enabled: true
document_type: website_guide
retrieval_exclude_headings:
  - Cách hoạt động kỹ thuật
  - Khi nào chatbox báo lỗi
---

# Chatbox AI Đông Sơn

Chatbox AI Đông Sơn là trợ lý hỏi đáp của website. Chatbox xuất hiện trên các trang frontend thông qua file `chatbox-ui.js`.

## Chatbox nằm ở đâu

Chatbox được gắn vào nhiều trang như Trang chủ, Học vui, Triển lãm, Trò chơi, Xếp hạng, Cá nhân, Tài liệu, Bản đồ, Đăng nhập, Đăng ký. Nút mở chat nằm dạng floating action button ở góc màn hình.

## Chatbox dùng để làm gì

Người dùng có thể hỏi:

- Trống đồng Đông Sơn là gì.
- Hoa văn chim Lạc có ý nghĩa gì.
- Vì sao trống đồng là bảo vật.
- Website có những trang nào.
- Học vui khác Tài liệu như thế nào.
- Trò Ghép hình chơi ra sao.
- Quiz camera chọn đáp án bằng cách nào.
- Trang Bản đồ hiển thị những điểm nào.
- Trang Xếp hạng dùng để làm gì.
- Đăng ký/đăng nhập ra sao.
- Hồ sơ cá nhân có chức năng gì.

Ngoài chế độ hỏi tự do, người dùng có thể bấm "Khám phá bằng Tour AI" để chọn một hành trình có hướng dẫn.

## Các Tour AI hiện có

- "Khám phá trống Ngọc Lũ": mở đúng hồ sơ Ngọc Lũ, đặt câu hỏi ngắn, cho phép thực hành 3D tùy chọn và dẫn tới triển lãm ảo.
- "Làm quen với cấu tạo trống đồng 3D": dùng ba model chưa định danh để luyện nhận biết mặt, tang, thân và chân trống.
- "Dạo quanh không gian Đông Sơn": hướng dẫn tham quan tự do triển lãm được nhúng từ website bên ngoài.

Tiến độ tour được lưu trên trình duyệt để chatbox tiếp tục đúng bước khi chuyển trang. Người dùng có thể thoát tour bất kỳ lúc nào.

Ba model GLB trong trang Triển lãm chỉ là mô hình tham khảo chưa xác định danh tính. Tour AI không giới thiệu chúng là Ngọc Lũ hoặc một hiện vật cụ thể.

Trong triển lãm iframe, AI không thể theo dõi vị trí hoặc biết người dùng đã chọn nội dung nào. Tour sử dụng nút xác nhận như "Tôi đã tham quan" hoặc "Tôi đã chọn một điểm dừng".

## Cách hoạt động kỹ thuật

Frontend gửi câu hỏi tới API:

`POST http://localhost:5000/api/v1/chat/ask`

Payload có dạng:

`{ "question": "câu hỏi của người dùng" }`

Backend mặc định thực hiện RAG V3:

- Chuẩn hóa câu hỏi tiếng Việt, nhận diện alias/thực thể và phân loại intent.
- Lọc nhóm tài liệu phù hợp rồi tìm kiếm kết hợp semantic vector và BM25.
- Hợp nhất kết quả, rerank các đoạn tốt nhất và chọn context đưa vào LLM.
- Trả về câu trả lời, nguồn, trạng thái fallback và mã tương tác để người dùng đánh giá hữu ích/không hữu ích.

Collection V3 dùng embedding `gemini-embedding-001` với vector 768 chiều, lưu thành các build bất biến tại `vector_store/chroma_v3`; collection V2 vẫn được giữ riêng để rollback.

## Khi nào chatbox báo lỗi

Chatbox sẽ báo không kết nối được máy chủ nếu backend Flask chưa chạy ở cổng 5000 hoặc API không phản hồi.

Nếu vector database V3 chưa có hoặc knowledge đã thay đổi, chạy lệnh sau từ thư mục backend:

`python scripts/ingest_knowledge_v3.py --config balanced`

Chatbox có nút đánh giá “Có/Chưa đúng” sau mỗi câu trả lời thành công. Phản hồi này được gửi tới `POST /api/v1/chat/feedback` để phục vụ đánh giá chất lượng, không tự thay đổi câu trả lời ngay trong phiên hiện tại.

## Gợi ý khi trả lời về website

Khi người dùng hỏi về chức năng website, hãy trả lời dựa trên các trang thật:

- Học vui: học nhanh, dễ hiểu.
- Tài liệu: đọc sâu, có phân loại/cấu tạo/hoa văn/timeline/hiện vật.
- Triển lãm: thực hành với ba model 3D chưa định danh hoặc tham quan không gian Đông Sơn được nhúng.
- Trò chơi: chọn trò, ghép hình, quiz đúng/sai, thử thách hằng ngày.
- Bản đồ: xem điểm trống đồng, bảo tàng và biển đảo.
- Xếp hạng: xem top và điểm.
- Cá nhân: xem profile, đổi tên, đăng xuất.
