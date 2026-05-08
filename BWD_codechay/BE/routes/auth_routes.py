import flask

import controllers.auth_controller as auth_controller
import middlewares.auth_middleware as auth_middleware


auth_bp = flask.Blueprint("auth", __name__)

auth_bp.route("/register", methods=["POST"])(auth_controller.register)
auth_bp.route("/login", methods=["POST"])(auth_controller.login)
auth_bp.route("/me", methods=["GET"])(auth_middleware.require_auth(auth_controller.get_me))
auth_bp.route("/logout", methods=["POST"])(auth_middleware.require_auth(auth_controller.logout))
auth_bp.route("/change-password", methods=["PUT"])(
    auth_middleware.require_auth(auth_controller.change_password)
)
auth_bp.route("/profile", methods=["PUT"])(
    auth_middleware.require_auth(auth_controller.update_profile)
)
