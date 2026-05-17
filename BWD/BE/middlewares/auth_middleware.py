import os
import functools

import jwt
import flask

import repositories.user_repo as user_repo


# Kiem tra Bearer token, giai ma JWT va gan user vao g.current_user.
def require_auth(handler):
    # Bao lai ham goc sau khi da xu ly xac thuc nguoi dung.
    @functools.wraps(handler)
    def wrapper(*args, **kwargs):
        auth_header = flask.request.headers.get("Authorization", "").strip()

        if not auth_header:
            return flask.jsonify({"message": "Thieu token xac thuc"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return flask.jsonify({"message": "Token khong dung dinh dang"}), 401

        token = parts[1]
        jwt_secret = os.getenv("JWT_SECRET")

        if not jwt_secret:
            return flask.jsonify({"message": "JWT_SECRET chua duoc cau hinh"}), 500

        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return flask.jsonify({"message": "Token da het han"}), 401
        except jwt.InvalidTokenError:
            return flask.jsonify({"message": "Token khong hop le"}), 401

        user = user_repo.find_user_by_id(payload.get("user_id"))
        if not user:
            return flask.jsonify({"message": "Nguoi dung khong ton tai"}), 401

        flask.g.current_user = user
        return handler(*args, **kwargs)

    return wrapper
