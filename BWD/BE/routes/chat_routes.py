import flask

import controllers.chat_controller as chat_controller


chat_bp = flask.Blueprint("chat", __name__)

chat_bp.route("/ask", methods=["POST"])(chat_controller.ask)
chat_bp.route("/feedback", methods=["POST"])(chat_controller.feedback)
chat_bp.route("/status", methods=["GET"])(chat_controller.status)
