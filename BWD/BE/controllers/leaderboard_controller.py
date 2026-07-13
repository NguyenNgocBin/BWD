import flask

import services.leaderboard_service as leaderboard_service


def handle_leaderboard_error(error):
    return flask.jsonify({"message": error.message}), error.status_code


def get_leaderboard():
    try:
        result = leaderboard_service.get_leaderboard(
            flask.request.args.get("scope"),
            flask.request.args.get("limit"),
            getattr(flask.g, "current_user", None),
            flask.request.args.get("period"),
            flask.request.args.get("group"),
        )
        return flask.jsonify(result), 200
    except leaderboard_service.LeaderboardError as error:
        return handle_leaderboard_error(error)
    except Exception as error:
        return flask.jsonify({"message": "Không thể tải bảng xếp hạng lúc này. Vui lòng thử lại."}), 500
