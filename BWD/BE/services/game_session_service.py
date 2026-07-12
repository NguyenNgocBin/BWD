import json

import repositories.game_repo as game_repo
import repositories.game_session_repo as game_session_repo
import repositories.leaderboard_repo as leaderboard_repo
import services.auth_service as auth_service


# Chuan hoa du lieu game session gui ve frontend.
def build_game_session_response(session_row, game):
    return {
        "id": session_row["id"],
        "user_id": session_row["user_id"],
        "game_id": session_row["game_id"],
        "game_code": game.code,
        "game_name": game.name,
        "score": session_row["score"],
        "correct_count": session_row["correct_count"],
        "wrong_count": session_row["wrong_count"],
        "total_questions": session_row["total_questions"],
        "accuracy": float(session_row["accuracy"]),
        "duration_seconds": session_row["duration_seconds"],
        "best_streak": session_row["best_streak"],
        "level_reached": session_row["level_reached"],
        "metadata": session_row["metadata"],
        "played_at": session_row["played_at"].isoformat() if session_row["played_at"] else None,
    }


# Chuan hoa du lieu thong ke game cua user gui ve frontend.
def build_user_game_stats_response(stats_row, game):
    return {
        "user_id": stats_row["user_id"],
        "game_id": stats_row["game_id"],
        "game_code": game.code,
        "game_name": game.name,
        "best_score": stats_row["best_score"],
        "total_score": stats_row["total_score"],
        "play_count": stats_row["play_count"],
        "best_streak": stats_row["best_streak"],
        "last_played_at": (
            stats_row["last_played_at"].isoformat()
            if stats_row["last_played_at"]
            else None
        ),
    }


# Chuan hoa tung dong lich su game session gui ve frontend.
def build_recent_session_item(session_row):
    return {
        "id": session_row["id"],
        "game_code": session_row["game_code"],
        "game_name": session_row["game_name"],
        "score": session_row["score"],
        "correct_count": session_row["correct_count"],
        "wrong_count": session_row["wrong_count"],
        "total_questions": session_row["total_questions"],
        "accuracy": float(session_row["accuracy"]),
        "duration_seconds": session_row["duration_seconds"],
        "best_streak": session_row["best_streak"],
        "level_reached": session_row["level_reached"],
        "metadata": session_row["metadata"],
        "played_at": session_row["played_at"].isoformat() if session_row["played_at"] else None,
    }


# Chuyen du lieu so ve int khong am, ho tro gia tri mac dinh neu payload bo trong.
def parse_non_negative_int(value, field_name, default_value=0):
    if value is None or value == "":
        return default_value

    try:
        parsed_value = int(value)
    except (TypeError, ValueError) as error:
        raise auth_service.AuthError(f"{field_name} phai la so nguyen") from error

    if parsed_value < 0:
        raise auth_service.AuthError(f"{field_name} khong duoc am")

    return parsed_value


# Chuyen du lieu so ve float khong am, ho tro gia tri mac dinh neu payload bo trong.
def parse_non_negative_float(value, field_name, default_value=0):
    if value is None or value == "":
        return default_value

    try:
        parsed_value = float(value)
    except (TypeError, ValueError) as error:
        raise auth_service.AuthError(f"{field_name} phai la so") from error

    if parsed_value < 0:
        raise auth_service.AuthError(f"{field_name} khong duoc am")

    return parsed_value


# Xu ly nghiep vu luu mot lan choi moi va dong bo thong ke lien quan.
def create_user_game_session(user, payload):
    game_code = (payload.get("game_code") or "").strip()
    if not game_code:
        raise auth_service.AuthError("game_code khong duoc de trong")

    game = game_repo.find_game_by_code(game_code)
    if not game:
        raise auth_service.AuthError("Game khong ton tai")

    if not game.is_active:
        raise auth_service.AuthError("Game hien dang tam dung")

    score = parse_non_negative_int(payload.get("score"), "score")
    correct_count = parse_non_negative_int(payload.get("correct_count"), "correct_count")
    wrong_count = parse_non_negative_int(payload.get("wrong_count"), "wrong_count")
    total_questions = parse_non_negative_int(payload.get("total_questions"), "total_questions")
    duration_seconds = parse_non_negative_int(
        payload.get("duration_seconds"),
        "duration_seconds",
        None,
    )
    best_streak = parse_non_negative_int(payload.get("best_streak"), "best_streak")
    level_reached = parse_non_negative_int(payload.get("level_reached"), "level_reached", None)
    accuracy = payload.get("accuracy")
    metadata = payload.get("metadata") or {}

    if duration_seconds is not None and duration_seconds < 0:
        raise auth_service.AuthError("duration_seconds khong duoc am")

    if level_reached is not None and level_reached <= 0:
        raise auth_service.AuthError("level_reached phai lon hon 0")

    if not isinstance(metadata, dict):
        raise auth_service.AuthError("metadata phai la object")

    if total_questions == 0:
        total_questions = correct_count + wrong_count

    if total_questions < correct_count + wrong_count:
        raise auth_service.AuthError(
            "total_questions khong duoc nho hon correct_count + wrong_count"
        )

    if accuracy is None or accuracy == "":
        accuracy_value = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0
    else:
        accuracy_value = parse_non_negative_float(accuracy, "accuracy")
        if accuracy_value > 100:
            raise auth_service.AuthError("accuracy khong duoc lon hon 100")

    session_row, stats_row, user_row = game_session_repo.create_game_session(
        user_id=user.id,
        game_id=game.id,
        score=score,
        correct_count=correct_count,
        wrong_count=wrong_count,
        total_questions=total_questions,
        accuracy=accuracy_value,
        duration_seconds=duration_seconds,
        best_streak=best_streak,
        level_reached=level_reached,
        metadata=json.dumps(metadata),
    )

    leaderboard_row = leaderboard_repo.get_game_leaderboard_entry_by_user(
        game.code,
        user.id,
    )
    leaderboard = None
    if leaderboard_row:
        leaderboard = {
            "rank": leaderboard_row["rank"],
            "score": leaderboard_row["selected_game_score"],
            "best_streak": leaderboard_row["selected_best_streak"],
            "duration_seconds": leaderboard_row["selected_duration_seconds"],
        }

    return {
        "message": "Luu ket qua choi game thanh cong",
        "session": build_game_session_response(session_row, game),
        "game_stats": build_user_game_stats_response(stats_row, game),
        "user_total_score": user_row["total_score"],
        "leaderboard": leaderboard,
    }


# Lay lich su choi game gan day cua user dang dang nhap.
def get_my_recent_game_sessions(user, limit_value):
    limit = parse_non_negative_int(limit_value, "limit", 10)
    if limit == 0:
        limit = 10

    if limit > 50:
        limit = 50

    rows = game_session_repo.get_recent_game_sessions_by_user(user.id, limit)
    return {
        "message": "Lay lich su choi game thanh cong",
        "sessions": [build_recent_session_item(row) for row in rows],
    }
