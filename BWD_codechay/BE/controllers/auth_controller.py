import datetime
import os

import bcrypt
import jwt
from flask import jsonify, request
from sqlalchemy.exc import IntegrityError

from config.db import db
from models.user_model import User


def build_user_response(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "total_score": user.total_score,
    }


def register():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not email or not password:
            return jsonify({"message": "Vui long nhap day du thong tin"}), 400

        username = username.strip()
        email = email.strip().lower()

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email da ton tai"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username da ton tai"}), 400

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

        new_user = User(
            username=username,
            email=email,
            password=hashed_password,
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify(
            {
                "message": "Dang ky thanh cong",
                "user": build_user_response(new_user),
            }
        ), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email hoac username da ton tai"}), 400
    except Exception as error:
        db.session.rollback()
        return jsonify({"message": "Loi server", "error": str(error)}), 500


def login():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Vui long nhap day du thong tin"}), 400

        email = email.strip().lower()
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"message": "Email khong ton tai"}), 400

        is_match = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password.encode("utf-8"),
        )

        if not is_match:
            return jsonify({"message": "Sai mat khau"}), 400

        jwt_secret = os.getenv("JWT_SECRET")
        if not jwt_secret:
            return jsonify({"message": "JWT_SECRET chua duoc cau hinh"}), 500

        token = jwt.encode(
            {
                "user_id": user.id,
                "exp": datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(days=7),
            },
            jwt_secret,
            algorithm="HS256",
        )

        return jsonify(
            {
                "message": "Dang nhap thanh cong",
                "token": token,
                "user": build_user_response(user),
            }
        ), 200
    except Exception as error:
        return jsonify({"message": "Loi server", "error": str(error)}), 500
