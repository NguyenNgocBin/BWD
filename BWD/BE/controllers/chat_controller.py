import flask

import services.chat_service as chat_service


def handle_chat_error(error):
    return flask.jsonify({"message": error.message}), error.status_code


def ask():
    try:
        data = flask.request.get_json(silent=True) or {}
        result = chat_service.ask_chatbot(data)
        return flask.jsonify(result), 200
    except chat_service.ChatError as error:
        return handle_chat_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Loi server", "error": str(error)}), 500