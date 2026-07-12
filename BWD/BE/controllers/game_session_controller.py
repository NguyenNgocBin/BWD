import flask

import services.auth_service as auth_service
import services.game_session_service as game_session_service


# Chuyen loi nghiep vu thanh response JSON thong nhat cho client.
def handle_game_session_error(error):
    return flask.jsonify({"message": error.message}), error.status_code


# Nhan request luu ket qua sau moi lan user choi xong mot game.
def create_session():
    try:
        data = flask.request.get_json(silent=True) or {}
        result = game_session_service.create_user_game_session(flask.g.current_user, data)
        return flask.jsonify(result), 201
    except auth_service.AuthError as error:
        return handle_game_session_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Không thể lưu kết quả chơi lúc này. Vui lòng thử lại."}), 500


# Lay lich su game session gan day cua user dang dang nhap.
def get_my_sessions():
    try:
        result = game_session_service.get_my_recent_game_sessions(
            flask.g.current_user,
            flask.request.args.get("limit"),
        )
        return flask.jsonify(result), 200
    except auth_service.AuthError as error:
        return handle_game_session_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Không thể tải lịch sử chơi lúc này. Vui lòng thử lại."}), 500
