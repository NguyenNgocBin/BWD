import datetime
import os

import jwt
from psycopg2.errors import UniqueViolation

from repositories.user_repo import (
    create_user,
    find_user_by_email,
    find_user_by_username,
    update_user_password,
    update_user_profile,
)
from utils.hash import check_password, hash_password


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
    }


# Xu ly nghiep vu dang ky: validate du lieu, kiem tra trung lap va tao user.
def register_user(username, email, password):
    if not username or not email or not password:
        raise AuthError("Vui long nhap day du thong tin")

    username = username.strip()
    email = email.strip().lower()

    if len(password) < 6:
        raise AuthError("Mat khau phai co it nhat 6 ky tu")

    if find_user_by_email(email):
        raise AuthError("Email da ton tai")

    if find_user_by_username(username):
        raise AuthError("Username da ton tai")

    try:
        user = create_user(
            username=username,
            email=email,
            password_hash=hash_password(password),
        )
    except UniqueViolation as error:
        raise AuthError("Email hoac username da ton tai") from error

    return {
        "message": "Dang ky thanh cong",
        "user": build_user_response(user),
    }


# Xu ly nghiep vu dang nhap va tao JWT cho nguoi dung hop le.
def login_user(email, password):
    if not email or not password:
        raise AuthError("Vui long nhap day du thong tin")

    email = email.strip().lower()
    user = find_user_by_email(email)

    if not user:
        raise AuthError("Email khong ton tai")

    if not check_password(password, user.password_hash):
        raise AuthError("Sai mat khau")

    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise AuthError("JWT_SECRET chua duoc cau hinh", 500)

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
        "message": "Dang nhap thanh cong",
        "token": token,
        "user": build_user_response(user),
    }


# Tra ve du lieu ho so cua user hien tai cho endpoint /me.
def get_current_user(user):
    return {
        "message": "Lay thong tin nguoi dung thanh cong",
        "user": build_user_response(user),
    }


# Tra ve thong diep dang xuat cho mo hinh JWT stateless.
def logout_user():
    return {"message": "Dang xuat thanh cong"}


# Xu ly viec kiem tra mat khau cu va luu mat khau moi.
def change_user_password(user, current_password, new_password):
    if not current_password or not new_password:
        raise AuthError("Vui long nhap day du thong tin")

    if len(new_password) < 6:
        raise AuthError("Mat khau moi phai co it nhat 6 ky tu")

    if not check_password(current_password, user.password_hash):
        raise AuthError("Mat khau hien tai khong dung")

    update_user_password(user.id, hash_password(new_password))

    return {"message": "Doi mat khau thanh cong"}


# Xu ly cap nhat thong tin ho so va kiem tra trung lap email, username.
def update_current_user_profile(user, username=None, email=None, avatar=None):
    if username is not None:
        username = username.strip()
        if not username:
            raise AuthError("Username khong duoc de trong")

        existing_user = find_user_by_username(username)
        if existing_user and existing_user.id != user.id:
            raise AuthError("Username da ton tai")

        user.username = username

    if email is not None:
        email = email.strip().lower()
        if not email:
            raise AuthError("Email khong duoc de trong")

        existing_user = find_user_by_email(email)
        if existing_user and existing_user.id != user.id:
            raise AuthError("Email da ton tai")

        user.email = email

    if avatar is not None:
        avatar = avatar.strip()
        user.avatar = avatar or "default-avatar.png"

    try:
        updated_user = update_user_profile(
            user.id,
            user.username,
            user.email,
            user.avatar,
        )
    except UniqueViolation as error:
        raise AuthError("Email hoac username da ton tai") from error

    return {
        "message": "Cap nhat thong tin thanh cong",
        "user": build_user_response(updated_user),
    }
