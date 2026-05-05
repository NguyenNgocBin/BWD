from flask import Blueprint

from controllers.game_session_controller import create_session, get_my_sessions
from middlewares.auth_middleware import require_auth


game_session_bp = Blueprint("game_sessions", __name__)

game_session_bp.route("/", methods=["POST"])(require_auth(create_session))
game_session_bp.route("/me", methods=["GET"])(require_auth(get_my_sessions))
