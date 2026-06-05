import os
import re
from pathlib import Path

BASE_DIR = Path(r"c:\Users\Admin\Desktop\web-backdour\BWD\BE\knowledge")
INPUT_FILE = BASE_DIR / "dong_son_knowledge_base.md"

def extract_section(content, heading_prefix):
    # Regex to extract section content
    pattern = re.compile(rf"^(#+\s+{re.escape(heading_prefix)}.*?)\n(?=^#+|\Z)", re.MULTILINE | re.DOTALL)
    match = pattern.search(content)
    if match:
        return match.group(1).strip()
    return ""

def write_file(subpath, text):
    file_path = BASE_DIR / subpath
    if text:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(text)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# website/
write_file("website/homepage.md", extract_section(content, "1. Tổng quan website Đông Sơn"))
write_file("website/hoc_vui.md", "# Học vui\n\nPhần học nhanh, ngắn gọn, dễ hiểu cho người mới bắt đầu.")
write_file("website/tro_choi.md", extract_section(content, "12. Trò chơi và trải nghiệm học tập trên website"))
write_file("website/xep_hang.md", "# Xếp hạng\n\nKhu vực hiển thị bảng điểm người chơi.")
write_file("website/tai_khoan.md", "# Tài khoản cá nhân\n\nKhu vực hồ sơ người dùng.")

# dong_son/
write_file("dong_son/trong_dong.md", extract_section(content, "2. Trống đồng Đông Sơn là gì?"))
write_file("dong_son/van_hoa_dong_son.md", extract_section(content, "3. Văn hóa Đông Sơn"))
write_file("dong_son/cau_tao.md", extract_section(content, "4. Cấu tạo trống đồng"))
write_file("dong_son/heger.md", extract_section(content, "5. Phân loại Heger"))
write_file("dong_son/hoa_van.md", extract_section(content, "6. Hoa văn trên trống đồng Đông Sơn"))
write_file("dong_son/chim_lac.md", extract_section(content, "7. Hoa văn chim Lạc"))
write_file("dong_son/mat_troi.md", extract_section(content, "8. Ý nghĩa mặt trời/ngôi sao trung tâm"))
write_file("dong_son/ky_thuat_duc_dong.md", extract_section(content, "10. Kỹ thuật đúc đồng"))

# artifacts/
write_file("artifacts/ngoc_lu.md", extract_section(content, "11.1. Trống Ngọc Lũ"))
write_file("artifacts/hoang_ha.md", extract_section(content, "11.2. Trống Hoàng Hạ"))
write_file("artifacts/co_loa.md", extract_section(content, "11.3. Trống Cổ Loa"))
write_file("artifacts/tan_long.md", extract_section(content, "11.4. Trống Tân Long"))

# quiz/
write_file("quiz/basic_quiz.md", "# Quiz cơ bản\n\nCác câu hỏi cơ bản về văn hóa Đông Sơn.")
write_file("quiz/advanced_quiz.md", "# Quiz nâng cao\n\nCác câu hỏi nâng cao về văn hóa Đông Sơn.")

# faq/
write_file("faq/faq.md", extract_section(content, "13. FAQ - Câu hỏi thường gặp"))

print("Splitting done.")
