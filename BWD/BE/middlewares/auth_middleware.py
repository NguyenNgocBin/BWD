import os
import functools

import jwt
import flask

import repositories.user_repo as user_repo


def _resolve_user_from_authorization_header():
    auth_header = flask.request.headers.get("Authorization", "").strip()
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        return None

    token = parts[1]

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return None

    return user_repo.find_user_by_id(payload.get("user_id"))


# Kiem tra Bearer token, giai ma JWT va gan user vao g.current_user.
def require_auth(handler):
    # Bao lai ham goc sau khi da xu ly xac thuc nguoi dung.
    @functools.wraps(handler)
    def wrapper(*args, **kwargs):
        auth_header = flask.request.headers.get("Authorization", "").strip()

        if not auth_header:
            return flask.jsonify({"message": "Bạn chưa đăng nhập hoặc thiếu token xác thực.", "code": "AUTH_REQUIRED"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return flask.jsonify({"message": "Token xác thực không đúng định dạng Bearer.", "code": "TOKEN_MALFORMED"}), 401

        token = parts[1]
        jwt_secret = os.getenv("JWT_SECRET")

        if not jwt_secret:
            return flask.jsonify({"message": "Máy chủ chưa được cấu hình khóa xác thực."}), 500

        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return flask.jsonify({"message": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "code": "TOKEN_EXPIRED"}), 401
        except jwt.InvalidTokenError:
            return flask.jsonify({"message": "Token xác thực không hợp lệ. Vui lòng đăng nhập lại.", "code": "TOKEN_INVALID"}), 401

        user = user_repo.find_user_by_id(payload.get("user_id"))
        if not user:
            return flask.jsonify({"message": "Tài khoản của phiên đăng nhập không còn tồn tại.", "code": "USER_NOT_FOUND"}), 401

        flask.g.current_user = user
        return handler(*args, **kwargs)

    return wrapper


def optional_auth(handler):
    @functools.wraps(handler)
    def wrapper(*args, **kwargs):
        auth_header = flask.request.headers.get("Authorization", "").strip()
        if not auth_header:
            flask.g.current_user = None
            return handler(*args, **kwargs)

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return flask.jsonify({"message": "Token xác thực không đúng định dạng Bearer.", "code": "TOKEN_MALFORMED"}), 401

        jwt_secret = os.getenv("JWT_SECRET")
        if not jwt_secret:
            return flask.jsonify({"message": "Máy chủ chưa được cấu hình khóa xác thực."}), 500

        try:
            payload = jwt.decode(parts[1], jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return flask.jsonify({"message": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "code": "TOKEN_EXPIRED"}), 401
        except jwt.InvalidTokenError:
            return flask.jsonify({"message": "Token xác thực không hợp lệ. Vui lòng đăng nhập lại.", "code": "TOKEN_INVALID"}), 401

        try:
            flask.g.current_user = user_repo.find_user_by_id(payload.get("user_id"))
        except Exception:
            class FallbackUser:
                def __init__(self, uid, uname, em=""):
                    self.id = uid
                    self.username = uname
                    self.email = em
                    self.avatar = "../images/chim-lac-pattern.png"
                    self.total_score = 0
                    self.class_group = None
            flask.g.current_user = FallbackUser(
                payload.get("user_id"),
                payload.get("username", "Người chơi"),
                payload.get("email", "")
            )

        if not flask.g.current_user:
            return flask.jsonify({"message": "Tài khoản của phiên đăng nhập không còn tồn tại.", "code": "USER_NOT_FOUND"}), 401
        return handler(*args, **kwargs)

    return wrapper
