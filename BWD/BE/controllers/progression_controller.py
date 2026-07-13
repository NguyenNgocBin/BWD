import flask

import services.progression_service as progression_service


def get_my_progression():
    try:
        # Thành tựu đã được đánh giá ngay sau khi lưu phiên chơi. Trang hồ sơ chỉ
        # cần đọc dữ liệu hiện tại để tránh lặp lại nhiều truy vấn cơ sở dữ liệu.
        result = progression_service.get_user_progression(flask.g.current_user.id)
        return flask.jsonify({"message": "Lấy tiến độ thành công.", **result}), 200
    except Exception:
        return flask.jsonify({"message": "Không thể tải thành tựu và nhiệm vụ lúc này."}), 500
