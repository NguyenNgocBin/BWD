import json

from repositories.game_repo import find_game_by_code
from repositories.game_session_repo import (
    create_game_session,
    get_recent_game_sessions_by_user,
)
from services.auth_service import AuthError


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
        "last_played_at": stats_row["last_played_at"].isoformat() if stats_row["last_played_at"] else None,
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
        raise AuthError(f"{field_name} phai la so nguyen") from error

    if parsed_value < 0:
        raise AuthError(f"{field_name} khong duoc am")

    return parsed_value


# Chuyen du lieu so ve float khong am, ho tro gia tri mac dinh neu payload bo trong.
def parse_non_negative_float(value, field_name, default_value=0):
    if value is None or value == "":
        return default_value

    try:
        parsed_value = float(value)
    except (TypeError, ValueError) as error:
        raise AuthError(f"{field_name} phai la so") from error

    if parsed_value < 0:
        raise AuthError(f"{field_name} khong duoc am")

    return parsed_value


# Xu ly nghiep vu luu mot lan choi moi va dong bo thong ke lien quan.
def create_user_game_session(user, payload):
    game_code = (payload.get("game_code") or "").strip()
    if not game_code:
        raise AuthError("game_code khong duoc de trong")

    game = find_game_by_code(game_code)
    if not game:
        raise AuthError("Game khong ton tai")

    if not game.is_active:
        raise AuthError("Game hien dang tam dung")

    score = parse_non_negative_int(payload.get("score"), "score")
    correct_count = parse_non_negative_int(payload.get("correct_count"), "correct_count")
    wrong_count = parse_non_negative_int(payload.get("wrong_count"), "wrong_count")
    total_questions = parse_non_negative_int(payload.get("total_questions"), "total_questions")
    duration_seconds = parse_non_negative_int(payload.get("duration_seconds"), "duration_seconds", None)
    best_streak = parse_non_negative_int(payload.get("best_streak"), "best_streak")
    level_reached = parse_non_negative_int(payload.get("level_reached"), "level_reached", None)
    accuracy = payload.get("accuracy")
    metadata = payload.get("metadata") or {}

    if duration_seconds is not None and duration_seconds < 0:
        raise AuthError("duration_seconds khong duoc am")

    if level_reached is not None and level_reached <= 0:
        raise AuthError("level_reached phai lon hon 0")

    if not isinstance(metadata, dict):
        raise AuthError("metadata phai la object")

    if total_questions == 0:
        total_questions = correct_count + wrong_count

    if total_questions < correct_count + wrong_count:
        raise AuthError("total_questions khong duoc nho hon correct_count + wrong_count")

    if accuracy is None or accuracy == "":
        accuracy_value = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0
    else:
        accuracy_value = parse_non_negative_float(accuracy, "accuracy")
        if accuracy_value > 100:
            raise AuthError("accuracy khong duoc lon hon 100")

    session_row, stats_row, user_row = create_game_session(
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

    return {
        "message": "Luu ket qua choi game thanh cong",
        "session": build_game_session_response(session_row, game),
        "game_stats": build_user_game_stats_response(stats_row, game),
        "user_total_score": user_row["total_score"],
    }


# Lay lich su choi game gan day cua user dang dang nhap.
def get_my_recent_game_sessions(user, limit_value):
    limit = parse_non_negative_int(limit_value, "limit", 10)
    if limit == 0:
        limit = 10

    if limit > 50:
        limit = 50

    rows = get_recent_game_sessions_by_user(user.id, limit)
    return {
        "message": "Lay lich su choi game thanh cong",
        "sessions": [build_recent_session_item(row) for row in rows],
    }
