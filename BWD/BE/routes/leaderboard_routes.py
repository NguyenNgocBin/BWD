import flask

import controllers.leaderboard_controller as leaderboard_controller
import middlewares.auth_middleware as auth_middleware


leaderboard_bp = flask.Blueprint("leaderboard", __name__)

leaderboard_bp.route("/", methods=["GET"])(
    auth_middleware.optional_auth(leaderboard_controller.get_leaderboard)
)
