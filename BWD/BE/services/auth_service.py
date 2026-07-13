import datetime
import os

import jwt
import psycopg2.errors

import repositories.user_repo as user_repo
import utils.hash as hash_utils


class AuthError(Exception):
    # Dong goi loi nghiep vu kem ma trang thai de controller tra ve dung response.
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


# Chuan hoa du lieu user gui ve frontend, khong de lo password hash.
def build_user_response(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "total_score": user.total_score,
        "class_group": user.class_group,
    }


# Xu ly nghiep vu dang ky: validate du lieu, kiem tra trung lap va tao user.
def register_user(username, email, password):
    if not username or not email or not password:
        raise AuthError("Vui lòng nhập đầy đủ thông tin.")

    username = username.strip()
    email = email.strip().lower()

    if len(password) < 6:
        raise AuthError("Mật khẩu phải có ít nhất 6 ký tự.")

    if user_repo.find_user_by_email(email):
        raise AuthError("Email đã tồn tại.")

    if user_repo.find_user_by_username(username):
        raise AuthError("Tên người dùng đã tồn tại.")

    try:
        user = user_repo.create_user(
            username=username,
            email=email,
            password_hash=hash_utils.hash_password(password),
        )
    except psycopg2.errors.UniqueViolation as error:
        raise AuthError("Email hoặc tên người dùng đã tồn tại.") from error

    return {
        "message": "Đăng ký thành công.",
        "user": build_user_response(user),
    }


# Xu ly nghiep vu dang nhap va tao JWT cho nguoi dung hop le.
def login_user(email, password):
    if not email or not password:
        raise AuthError("Vui lòng nhập đầy đủ email và mật khẩu.")

    email = email.strip().lower()
    user = user_repo.find_user_by_email(email)

    if not user:
        raise AuthError("Email không tồn tại.")

    if not hash_utils.check_password(password, user.password_hash):
        raise AuthError("Mật khẩu không đúng.")

    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise AuthError("Máy chủ chưa được cấu hình khóa xác thực.", 500)

    token = jwt.encode(
        {
            "user_id": user.id,
            "exp": datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(days=7),
        },
        jwt_secret,
        algorithm="HS256",
    )

    return {
        "message": "Đăng nhập thành công.",
        "token": token,
        "user": build_user_response(user),
    }


# Tra ve du lieu ho so cua user hien tai cho endpoint /me.
def get_current_user(user):
    return {
        "message": "Lấy thông tin người dùng thành công.",
        "user": build_user_response(user),
    }


# Tra ve thong diep dang xuat cho mo hinh JWT stateless.
def logout_user():
    return {"message": "Đăng xuất thành công."}


# Xu ly viec kiem tra mat khau cu va luu mat khau moi.
def change_user_password(user, current_password, new_password):
    if not current_password or not new_password:
        raise AuthError("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.")

    if len(new_password) < 6:
        raise AuthError("Mật khẩu mới phải có ít nhất 6 ký tự.")

    if not hash_utils.check_password(current_password, user.password_hash):
        raise AuthError("Mật khẩu hiện tại không đúng.")

    user_repo.update_user_password(user.id, hash_utils.hash_password(new_password))

    return {"message": "Đổi mật khẩu thành công."}


# Xu ly cap nhat thong tin ho so va kiem tra trung lap email, username.
def update_current_user_profile(user, username=None, email=None, avatar=None, class_group=None):
    if username is not None:
        username = username.strip()
        if not username:
            raise AuthError("Tên người dùng không được để trống.")

        existing_user = user_repo.find_user_by_username(username)
        if existing_user and existing_user.id != user.id:
            raise AuthError("Tên người dùng đã tồn tại.")

        user.username = username

    if email is not None:
        email = email.strip().lower()
        if not email:
            raise AuthError("Email không được để trống.")

        existing_user = user_repo.find_user_by_email(email)
        if existing_user and existing_user.id != user.id:
            raise AuthError("Email đã tồn tại.")

        user.email = email

    if avatar is not None:
        avatar = avatar.strip()
        user.avatar = avatar or "default-avatar.png"

    if class_group is not None:
        class_group = class_group.strip() or None
        if class_group and len(class_group) > 120:
            raise AuthError("Tên lớp/nhóm không được dài quá 120 ký tự.")
        user.class_group = class_group

    try:
        updated_user = user_repo.update_user_profile(
            user.id,
            user.username,
            user.email,
            user.avatar,
            user.class_group,
        )
    except psycopg2.errors.UniqueViolation as error:
        raise AuthError("Email hoặc tên người dùng đã tồn tại.") from error

    return {
        "message": "Cập nhật thông tin thành công.",
        "user": build_user_response(updated_user),
    }
