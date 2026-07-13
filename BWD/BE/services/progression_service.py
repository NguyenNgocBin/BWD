import time
from datetime import timedelta, timezone

import repositories.progression_repo as progression_repo


_CACHE_TTL_SECONDS = 30
_progression_cache = {}
HANOI_TIME_ZONE = timezone(timedelta(hours=7), name="Asia/Ho_Chi_Minh")


DAILY_MISSIONS = (
    {
        "code": "play_motif",
        "title": "Chơi 1 ván Lật thẻ",
        "description": "Hoàn thành một ván Lật thẻ trong hôm nay.",
        "target": 1,
        "reward": "Tiến độ huy hiệu Sứ giả mỗi ngày",
    },
    {
        "code": "complete_puzzle_level",
        "title": "Hoàn thành 1 level Ghép hình",
        "description": "Hoàn thành ít nhất một level Ghép hình hôm nay.",
        "target": 1,
        "reward": "Tiến độ huy hiệu Sứ giả mỗi ngày",
    },
    {
        "code": "quiz_correct_5",
        "title": "Trả lời đúng 5 câu quiz",
        "description": "Tích lũy 5 câu đúng trong game Đúng/Sai hôm nay.",
        "target": 5,
        "reward": "Tiến độ huy hiệu Sứ giả mỗi ngày",
    },
)


def _serialize_achievement(row):
    return {
        "code": row["code"],
        "title": row["title"],
        "description": row["description"],
        "icon": row["icon"],
        "unlocked": row["unlocked"],
        "unlocked_at": (
            row["unlocked_at"].astimezone(HANOI_TIME_ZONE).isoformat()
            if row["unlocked_at"]
            else None
        ),
    }


def build_daily_missions(progress):
    values = {
        "play_motif": 1 if progress["motif_played"] else 0,
        "complete_puzzle_level": 1 if progress["puzzle_level_completed"] else 0,
        "quiz_correct_5": min(5, int(progress["quiz_correct_count"] or 0)),
    }
    return [
        {
            **mission,
            "progress": values[mission["code"]],
            "completed": values[mission["code"]] >= mission["target"],
        }
        for mission in DAILY_MISSIONS
    ]


def evaluate_user_progress(user_id):
    earned_codes = progression_repo.get_earned_rule_codes(user_id)
    daily_progress = progression_repo.get_daily_progress(user_id)
    missions = build_daily_missions(daily_progress)
    if all(mission["completed"] for mission in missions):
        earned_codes.append("daily_hero")
    progression_repo.unlock_achievements(user_id, earned_codes)
    achievements = progression_repo.get_all_achievements_for_user(user_id)
    result = _build_progression_payload(missions, achievements)
    _progression_cache[user_id] = (time.monotonic(), result)
    return result


def get_user_progression(user_id):
    cached = _progression_cache.get(user_id)
    if cached and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    progress = progression_repo.get_daily_progress(user_id)
    missions = build_daily_missions(progress)
    achievements = progression_repo.get_all_achievements_for_user(user_id)
    result = _build_progression_payload(missions, achievements)
    _progression_cache[user_id] = (time.monotonic(), result)
    return result


def _build_progression_payload(missions, achievements):
    return {
        "achievements": [_serialize_achievement(row) for row in achievements],
        "daily_missions": missions,
        "daily_completed": sum(1 for mission in missions if mission["completed"]),
        "daily_total": len(missions),
    }


def attach_featured_achievements(entries):
    rows = progression_repo.get_featured_achievements(
        [entry["user_id"] for entry in entries]
    )
    by_user = {}
    for row in rows:
        by_user.setdefault(row["user_id"], []).append(
            {"code": row["code"], "title": row["title"], "icon": row["icon"]}
        )
    for entry in entries:
        entry["badges"] = by_user.get(entry["user_id"], [])
    return entries
