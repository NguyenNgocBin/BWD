import flask

import controllers.progression_controller as progression_controller
import middlewares.auth_middleware as auth_middleware


progression_bp = flask.Blueprint("progression", __name__)

progression_bp.route("/me", methods=["GET"])(
    auth_middleware.require_auth(progression_controller.get_my_progression)
)
