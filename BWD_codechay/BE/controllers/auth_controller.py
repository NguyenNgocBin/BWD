from flask import g, jsonify, request

from services.auth_service import (
    AuthError,
    change_user_password,
    get_current_user,
    login_user,
    logout_user,
    register_user,
    update_current_user_profile,
)


# Chuyen loi nghiep vu thanh response JSON thong nhat cho client.
def handle_auth_error(error):
    return jsonify({"message": error.message}), error.status_code


# Nhan request dang ky va goi service tao tai khoan moi.
def register():
    try:
        data = request.get_json(silent=True) or {}
        result = register_user(
            data.get("username"),
            data.get("email"),
            data.get("password"),
        )
        return jsonify(result), 201
    except AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500


# Nhan request dang nhap va tra ve token neu thong tin hop le.
def login():
    try:
        data = request.get_json(silent=True) or {}
        result = login_user(data.get("email"), data.get("password"))
        return jsonify(result), 200
    except AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500


# Tra ve thong tin cua nguoi dung dang dang nhap.
def get_me():
    try:
        return jsonify(get_current_user(g.current_user)), 200
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500


# Xac nhan dang xuat de frontend xoa token da luu.
def logout():
    try:
        return jsonify(logout_user()), 200
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500


# Nhan request doi mat khau cho tai khoan hien tai.
def change_password():
    try:
        data = request.get_json(silent=True) or {}
        result = change_user_password(
            g.current_user,
            data.get("current_password"),
            data.get("new_password"),
        )
        return jsonify(result), 200
    except AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500


# Nhan request cap nhat username, email va avatar cua user.
def update_profile():
    try:
        data = request.get_json(silent=True) or {}
        result = update_current_user_profile(
            g.current_user,
            data.get("username"),
            data.get("email"),
            data.get("avatar"),
        )
        return jsonify(result), 200
    except AuthError as error:
        return handle_auth_error(error)
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500
