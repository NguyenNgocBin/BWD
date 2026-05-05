from flask import g, jsonify, request

from services.auth_service import AuthError
from services.game_session_service import (
    create_user_game_session,
    get_my_recent_game_sessions,
)


# Chuyen loi nghiep vu thanh response JSON thong nhat cho client.
def handle_game_session_error(error):
    return jsonify({"message": error.message}), error.status_code


# Nhan request luu ket qua sau moi lan user choi xong mot game.
def create_session():
    try:
        data = request.get_json(silent=True) or {}
        result = create_user_game_session(g.current_user, data)
        return jsonify(result), 201
    except AuthError as error:
        return handle_game_session_error(error)
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500


# Lay lich su game session gan day cua user dang dang nhap.
def get_my_sessions():
    try:
        result = get_my_recent_game_sessions(
            g.current_user,
            request.args.get("limit"),
        )
        return jsonify(result), 200
    except AuthError as error:
        return handle_game_session_error(error)
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500
