import repositories.leaderboard_repo as leaderboard_repo
import repositories.user_repo as user_repo
import services.progression_service as progression_service


GAME_LABELS = {
    "codechayquiz": "Đúng / Sai",
    "puzzle": "Ghép hình",
    "motifhunt": "Lật thẻ họa tiết",
}


class LeaderboardError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_limit(limit_value):
    if limit_value in (None, ""):
        return 10

    try:
        limit = int(limit_value)
    except (TypeError, ValueError) as error:
        raise LeaderboardError("Limit phải là số nguyên") from error

    if limit <= 0:
        raise LeaderboardError("Limit phải lớn hơn 0")

    return min(limit, 50)


def normalize_scope(scope_value):
    scope = (scope_value or "tong").strip().lower()
    if scope not in {"tong", "puzzle", "codechayquiz", "motifhunt"}:
        raise LeaderboardError("Scope không hợp lệ")
    return scope


def normalize_period(period_value):
    period = (period_value or "all").strip().lower()
    if period not in {"all", "week", "today"}:
        raise LeaderboardError("Khoảng thời gian không hợp lệ.")
    return period


def normalize_group(group_value):
    group = (group_value or "").strip()
    if len(group) > 120:
        raise LeaderboardError("Tên lớp/nhóm quá dài.")
    return group or None


def build_entry(row, scope):
    selected_score = row["total_score"] if scope == "tong" else row["selected_game_score"]
    entry = {
        "rank": row["rank"],
        "user_id": row["user_id"],
        "username": row["username"],
        "avatar": row["avatar"],
        "total_score": row["total_score"],
        "quiz_score": row["quiz_score"],
        "puzzle_score": row["puzzle_score"],
        "motif_score": row["motif_score"],
        "quiz_best_streak": row["quiz_best_streak"],
        "puzzle_best_streak": row["puzzle_best_streak"],
        "motif_best_streak": row["motif_best_streak"],
        "quiz_duration_seconds": row["quiz_duration_seconds"],
        "puzzle_duration_seconds": row["puzzle_duration_seconds"],
        "motif_duration_seconds": row["motif_duration_seconds"],
        "quiz_play_count": row["quiz_play_count"],
        "puzzle_play_count": row["puzzle_play_count"],
        "motif_play_count": row["motif_play_count"],
        "selected_score": selected_score,
    }
    if scope != "tong":
        entry.update(
            {
                "best_streak": row["selected_best_streak"],
                "duration_seconds": row["selected_duration_seconds"],
                "play_count": row["selected_play_count"],
            }
        )
    return entry


def build_public_entry(entry, scope):
    common = {
        "rank": entry["rank"],
        "user_id": entry["user_id"],
        "username": entry["username"],
        "avatar": entry["avatar"],
        "selected_score": entry["selected_score"],
    }
    if scope == "tong":
        return {
            **common,
            "total_score": entry["total_score"],
            "quiz_score": entry["quiz_score"],
            "puzzle_score": entry["puzzle_score"],
            "motif_score": entry["motif_score"],
        }

    score_field = {
        "codechayquiz": "quiz_score",
        "puzzle": "puzzle_score",
        "motifhunt": "motif_score",
    }[scope]
    return {
        **common,
        score_field: entry[score_field],
        "score": entry["selected_score"],
        "best_streak": entry["best_streak"],
        "duration_seconds": entry["duration_seconds"],
        "play_count": entry["play_count"],
    }


def get_best_game_label(entry):
    scores = {
        "codechayquiz": entry["quiz_score"],
        "puzzle": entry["puzzle_score"],
        "motifhunt": entry["motif_score"],
    }

    best_code = max(scores, key=scores.get)
    if scores[best_code] <= 0:
        return "Chưa có"

    return GAME_LABELS[best_code]


def build_current_user_payload(current_user, entries, scope, period="all", class_group=None):
    if not current_user:
        return None

    base = {
        "user_id": current_user.id,
        "username": current_user.username,
        "avatar": current_user.avatar,
        "total_score": current_user.total_score if period == "all" and not class_group else 0,
        "quiz_score": 0,
        "puzzle_score": 0,
        "motif_score": 0,
        "quiz_best_streak": 0,
        "puzzle_best_streak": 0,
        "motif_best_streak": 0,
        "quiz_duration_seconds": 0,
        "puzzle_duration_seconds": 0,
        "motif_duration_seconds": 0,
        "quiz_play_count": 0,
        "puzzle_play_count": 0,
        "motif_play_count": 0,
        "selected_score": current_user.total_score if scope == "tong" and period == "all" and not class_group else 0,
        "rank": None,
        "best_game": "Chưa có",
    }

    for entry in entries:
        if entry["user_id"] != current_user.id:
            continue

        base.update(
            {
                "total_score": entry["total_score"],
                "quiz_score": entry["quiz_score"],
                "puzzle_score": entry["puzzle_score"],
                "motif_score": entry["motif_score"],
                "quiz_best_streak": entry["quiz_best_streak"],
                "puzzle_best_streak": entry["puzzle_best_streak"],
                "motif_best_streak": entry["motif_best_streak"],
                "quiz_duration_seconds": entry["quiz_duration_seconds"],
                "puzzle_duration_seconds": entry["puzzle_duration_seconds"],
                "motif_duration_seconds": entry["motif_duration_seconds"],
                "quiz_play_count": entry["quiz_play_count"],
                "puzzle_play_count": entry["puzzle_play_count"],
                "motif_play_count": entry["motif_play_count"],
                "selected_score": entry["selected_score"],
                "rank": entry["rank"],
                "best_game": get_best_game_label(entry),
            }
        )
        break

    if base["rank"] is None:
        if period != "all" or class_group:
            user_rows = leaderboard_repo.get_filtered_leaderboard(
                scope, period, class_group, 1, current_user.id
            )
            user_row = user_rows[0] if user_rows else None
        elif scope == "tong":
            user_row = leaderboard_repo.get_total_leaderboard_entry_by_user(current_user.id)
        else:
            user_row = leaderboard_repo.get_game_leaderboard_entry_by_user(scope, current_user.id)

        if user_row:
            hydrated_entry = build_entry(user_row, scope)
            base.update(
                {
                    "total_score": hydrated_entry["total_score"],
                    "quiz_score": hydrated_entry["quiz_score"],
                    "puzzle_score": hydrated_entry["puzzle_score"],
                    "motif_score": hydrated_entry["motif_score"],
                    "quiz_best_streak": hydrated_entry["quiz_best_streak"],
                    "puzzle_best_streak": hydrated_entry["puzzle_best_streak"],
                    "motif_best_streak": hydrated_entry["motif_best_streak"],
                    "quiz_duration_seconds": hydrated_entry["quiz_duration_seconds"],
                    "puzzle_duration_seconds": hydrated_entry["puzzle_duration_seconds"],
                    "motif_duration_seconds": hydrated_entry["motif_duration_seconds"],
                    "quiz_play_count": hydrated_entry["quiz_play_count"],
                    "puzzle_play_count": hydrated_entry["puzzle_play_count"],
                    "motif_play_count": hydrated_entry["motif_play_count"],
                    "selected_score": hydrated_entry["selected_score"],
                    "rank": hydrated_entry["rank"],
                    "best_game": get_best_game_label(hydrated_entry),
                }
            )

    return base


def get_leaderboard(
    scope_value,
    limit_value,
    current_user=None,
    period_value=None,
    group_value=None,
):
    scope = normalize_scope(scope_value)
    limit = parse_limit(limit_value)
    period = normalize_period(period_value)
    class_group = normalize_group(group_value)

    if period != "all" or class_group:
        rows = leaderboard_repo.get_filtered_leaderboard(
            scope, period, class_group, limit
        )
        title = "Tổng điểm" if scope == "tong" else GAME_LABELS[scope]
    elif scope == "tong":
        rows = leaderboard_repo.get_total_leaderboard(limit)
        title = "Tổng điểm"
    else:
        rows = leaderboard_repo.get_game_leaderboard(scope, limit)
        title = GAME_LABELS[scope]

    entries = [build_entry(row, scope) for row in rows]
    if not entries:
        current_user_payload = build_current_user_payload(
            current_user, [], scope, period, class_group
        )
        return {
            "message": "Chưa có dữ liệu bảng xếp hạng",
            "scope": scope,
            "period": period,
            "group": class_group,
            "title": title,
            "entries": [],
            "current_user": current_user_payload,
            "available_scopes": [
                {"scope": "tong", "label": "Tổng"},
                {"scope": "motifhunt", "label": GAME_LABELS["motifhunt"]},
                {"scope": "puzzle", "label": GAME_LABELS["puzzle"]},
                {"scope": "codechayquiz", "label": GAME_LABELS["codechayquiz"]},
            ],
        }

    public_entries = progression_service.attach_featured_achievements(
        [build_public_entry(entry, scope) for entry in entries]
    )

    current_user_payload = build_current_user_payload(
        current_user, entries, scope, period, class_group
    )
    if (
        current_user_payload
        and current_user_payload["rank"] is None
        and period == "all"
        and not class_group
    ):
        try:
            fresh_user = user_repo.find_user_by_id(current_user.id)
            if fresh_user:
                current_user_payload["total_score"] = fresh_user.total_score
        except Exception:
            pass

    return {
        "message": "Lấy bảng xếp hạng thành công",
        "scope": scope,
        "period": period,
        "group": class_group,
        "title": title,
        "entries": public_entries,
        "current_user": current_user_payload,
        "available_scopes": [
            {"scope": "tong", "label": "Tổng"},
            {"scope": "motifhunt", "label": GAME_LABELS["motifhunt"]},
            {"scope": "puzzle", "label": GAME_LABELS["puzzle"]},
            {"scope": "codechayquiz", "label": GAME_LABELS["codechayquiz"]},
        ],
    }
