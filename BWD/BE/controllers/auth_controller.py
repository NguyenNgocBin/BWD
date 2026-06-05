import flask

import services.auth_service as auth_service


# Chuyen loi nghiep vu thanh response JSON thong nhat cho client.
def handle_auth_error(error):
    return flask.jsonify({"message": error.message}), error.status_code


# Nhan request dang ky va goi service tao tai khoan moi.
def register():
    try:
        data = flask.request.get_json(silent=True) or {}
        result = auth_service.register_user(
            data.get("username"),
            data.get("email"),
            data.get("password"),
        )
        return flask.jsonify(result), 201
    except auth_service.AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500


# Nhan request dang nhap va tra ve token neu thong tin hop le.
def login():
    try:
        data = flask.request.get_json(silent=True) or {}
        result = auth_service.login_user(data.get("email"), data.get("password"))
        return flask.jsonify(result), 200
    except auth_service.AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500


# Tra ve thong tin cua nguoi dung dang dang nhap.
def get_me():
    try:
        return flask.jsonify(auth_service.get_current_user(flask.g.current_user)), 200
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500


# Xac nhan dang xuat de frontend xoa token da luu.
def logout():
    try:
        return flask.jsonify(auth_service.logout_user()), 200
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500


# Nhan request doi mat khau cho tai khoan hien tai.
def change_password():
    try:
        data = flask.request.get_json(silent=True) or {}
        result = auth_service.change_user_password(
            flask.g.current_user,
            data.get("current_password"),
            data.get("new_password"),
        )
        return flask.jsonify(result), 200
    except auth_service.AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500


# Nhan request cap nhat username, email va avatar cua user.
def update_profile():
    try:
        data = flask.request.get_json(silent=True) or {}
        result = auth_service.update_current_user_profile(
            flask.g.current_user,
            data.get("username"),
            data.get("email"),
            data.get("avatar"),
        )
        return flask.jsonify(result), 200
    except auth_service.AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500
