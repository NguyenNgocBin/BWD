import flask

import services.progression_service as progression_service


def get_my_progression():
    try:
        result = progression_service.evaluate_user_progress(flask.g.current_user.id)
        return flask.jsonify({"message": "Lấy tiến độ thành công.", **result}), 200
    except Exception:
        return flask.jsonify({"message": "Không thể tải thành tựu và nhiệm vụ lúc này."}), 500
