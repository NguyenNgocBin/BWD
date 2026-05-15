import flask

import controllers.game_session_controller as game_session_controller
import middlewares.auth_middleware as auth_middleware


game_session_bp = flask.Blueprint("game_sessions", __name__)

game_session_bp.route("/", methods=["POST"])(
    auth_middleware.require_auth(game_session_controller.create_session)
)
game_session_bp.route("/me", methods=["GET"])(
    auth_middleware.require_auth(game_session_controller.get_my_sessions)
)
