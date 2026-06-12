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

## Cách hoạt động kỹ thuật

Frontend gửi câu hỏi tới API:

`POST http://localhost:5000/api/v1/chat/ask`

Payload có dạng:

`{ "question": "câu hỏi của người dùng" }`

Backend thực hiện RAG:

- Nhận câu hỏi.
- Tìm các chunk liên quan trong ChromaDB.
- Ghép context từ knowledge base.
- Gửi context và câu hỏi sang LLM nếu có đủ ngữ cảnh.
- Trả về câu trả lời, sources và trạng thái fallback nếu có.

## Khi nào chatbox báo lỗi

Chatbox sẽ báo không kết nối được máy chủ nếu backend Flask chưa chạy ở cổng 5000 hoặc API không phản hồi.

Nếu vector database chưa có hoặc chưa ingest knowledge, backend có thể báo cần chạy:

`python BWD/BE/scripts/ingest_knowledge.py`

## Gợi ý khi trả lời về website

Khi người dùng hỏi về chức năng website, hãy trả lời dựa trên các trang thật:

- Học vui: học nhanh, dễ hiểu.
- Tài liệu: đọc sâu, có phân loại/cấu tạo/hoa văn/timeline/hiện vật.
- Triển lãm: xem tour 3D Đông Sơn.
- Trò chơi: chọn trò, ghép hình, quiz đúng/sai, thử thách hằng ngày.
- Bản đồ: xem điểm trống đồng, bảo tàng và biển đảo.
- Xếp hạng: xem top và điểm.
- Cá nhân: xem profile, đổi tên, đăng xuất.

