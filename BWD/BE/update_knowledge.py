import os
from pathlib import Path

BASE_DIR = Path(r"c:\Users\Admin\Desktop\web-backdour\BWD\BE\knowledge")

files_content = {
    "dong_son/trong_dong.md": "Trống đồng là loại di sản vật thể tiêu biểu nhất, phản ánh đời sống thẩm mỹ và xã hội của cư dân Lạc Việt cách đây hơn 2.000 năm.\nNó vừa là nhạc khí, vừa là biểu tượng của vương quyền và thần quyền.\nCho đến nay, gần 1.000 chiếc trống đã được phát hiện khắp Việt Nam và Đông Nam Á.",
    "dong_son/van_hoa_dong_son.md": "Phát triển mạnh mẽ từ thế kỷ VII TCN đến thế kỷ II SCN, văn hóa Đông Sơn nổi tiếng với kỹ thuật luyện kim đúc đồng rực rỡ.\nCư dân Đông Sơn (người Lạc Việt) sống bằng nghề nông lúa nước, săn bắn, đánh cá và là những thợ kim loại tài ba.",
    "dong_son/cau_tao.md": "Trống đồng (đặc biệt là loại Heger I) thường được chia thành 3 phần rõ rệt: Tang trống, Thân trống và Chân trống.\nHoa văn trang trí thường phủ kín các phần này, tạo nên một chỉnh thể nghệ thuật hoàn mỹ.",
    "dong_son/heger.md": "Học giả Franz Heger đã chia trống đồng thành 4 loại chính:\nLoại 1 (H1): Cổ nhất và đẹp nhất (như trống Ngọc Lũ).\nLoại 2 (H2): Thường có hình cóc trên mặt, phổ biến ở vùng người Mường.\nLoại 3 (H3): Có quai nhỏ, hình đàn voi đúc nổi.\nLoại 4 (H4): Kích thước nhỏ, thường có tên 12 con vật Địa chi.",
    "dong_son/hoa_van.md": "Hoa văn trống đồng là một \"cuốn ký sự\" bằng hình ảnh.\nNó bao gồm các hình ảnh sinh hoạt như giã gạo, nhảy múa, đua thuyền; các loài động vật và đặc biệt là các hình tượng siêu thực mang tính óc tưởng tượng cao của nghệ nhân xưa.",
    "dong_son/chim_lac.md": "Chim Lạc với mỏ dài là loài chim hóa trang, được xem là vật tổ của cư dân Việt cổ.\nHình ảnh chim bay lượn trên mặt trống tượng trưng cho sự kết nối giữa con người và thiên nhiên, giữa đất và trời.",
    "dong_son/mat_troi.md": "Mặt trời luôn nằm ở vị trí trung tâm mặt trống, tượng trưng cho yếu tố Dương.\nSố cánh sao có thể là 8, 12, 14 hoặc 16 tùy loại trống.\nCác tia sáng xen kẽ với hoa văn lông đuôi chim công (yếu tố Âm), thể hiện triết lý âm dương hòa hợp cho muôn loài nảy nở.",
    "dong_son/ky_thuat_duc_dong.md": "Trống được đúc bằng khuôn khắc trực tiếp để tạo ra những đường nét tinh mảnh, điều mà các lò đúc thủ công hiện đại khó lòng sao chép hoàn hảo.\nKỹ thuật pha trộn nguyên liệu và tạo hình siêu thực cho thấy trí tuệ vượt trội của người Việt cổ.",
    "artifacts/ngoc_lu.md": "Được tìm thấy năm 1893 tại Hà Nam, đây là chiếc trống đẹp và nguyên vẹn nhất.\nTrống có 14 tia sao, trang trí hình người nhảy múa, nhà sàn mái cong và cảnh giã gạo đôi trai gái.",
    "artifacts/hoang_ha.md": "Một trong những Bảo vật quốc gia tiêu biểu, trống Hoàng Hạ có hình sao 16 cánh.\nCùng với trống Ngọc Lũ, nó đang được trưng bày tại Bảo tàng Lịch sử Quốc gia và có phiên bản tương tác ảo 3D.",
    "artifacts/co_loa.md": "Theo nghiên cứu, thành Cổ Loa là nơi An Dương Vương đã huy động nhân lực và tài lực để đúc những chiếc trống lớn nhất, đẹp nhất làm biểu tượng cho vương quyền và thần quyền của Bách Việt.",
    "artifacts/tan_long.md": "",
    "quiz/basic_quiz.md": "Trống đồng Đông Sơn lần đầu được tìm thấy ở đâu? (Đáp án: Làng Đông Sơn, Thanh Hóa năm 1924).\nAi là người phân loại trống đồng thành 4 loại chính? (Đáp án: Heger).\nHình ảnh nào nằm ở trung tâm mặt trống? (Đáp án: Mặt trời).",
    "quiz/advanced_quiz.md": "Tại sao không nên lau sạch lớp bột trên bề mặt trống đồng cổ? (Đáp án: Vì hoa văn nằm trực tiếp trên lớp bột hóa thạch đó, làm sạch sẽ mất giá trị hiện vật).\nMột chiếc trống đồng thời cổ có giá trị tương đương bao nhiêu con trâu? (Đáp án: 2.000 đến 3.000 con).\nÝ nghĩa của việc đánh 3 tiếng trống theo quan niệm xưa? (Đáp án: Tượng trưng cho Thiên - Địa - Nhân).",
    "faq/faq.md": "Trống đồng dùng để làm gì? Dùng làm nhạc khí trong lễ hội, nghi lễ tôn giáo, biểu tượng quyền lực và dùng trong chiến đấu để tập hợp binh sĩ.\nTại sao trống đồng lại lan tỏa khắp Đông Nam Á? Nhờ khả năng di dân và tầm ngoại giao, giao lưu văn hóa sâu rộng của người Việt cổ.\nCó bao nhiêu loại trống Heger? Có 4 loại chính (H1 đến H4) và các loại trung gian"
}

for rel_path, content in files_content.items():
    file_path = BASE_DIR / rel_path
    with open(file_path, "w", encoding="utf-8") as f:
        # Prepend a markdown heading based on filename for better formatting if it's not empty, 
        # but since user gave exact text, let's just write exactly that text.
        f.write(content.strip() + "\n")

print("Files updated successfully.")
