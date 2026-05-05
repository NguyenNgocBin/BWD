from flask import Blueprint

from controllers.auth_controller import (
    change_password,
    get_me,
    login,
    logout,
    register,
    update_profile,
)
from middlewares.auth_middleware import require_auth


auth_bp = Blueprint("auth", __name__)

auth_bp.route("/register", methods=["POST"])(register)
auth_bp.route("/login", methods=["POST"])(login)
auth_bp.route("/me", methods=["GET"])(require_auth(get_me))
auth_bp.route("/logout", methods=["POST"])(require_auth(logout))
auth_bp.route("/change-password", methods=["PUT"])(require_auth(change_password))
auth_bp.route("/profile", methods=["PUT"])(require_auth(update_profile))
