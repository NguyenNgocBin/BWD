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


MOCK_PLAYERS = [
    {
        "rank": 1,
        "user_id": "mock_u1",
        "username": "Huyền My",
        "avatar": "../images/TrongDongHV.jpg",
        "total_score": 18940,
        "quiz_score": 6200,
        "puzzle_score": 7940,
        "motif_score": 4800,
        "quiz_best_streak": 18,
        "puzzle_best_streak": 15,
        "motif_best_streak": 12,
        "quiz_duration_seconds": 35,
        "puzzle_duration_seconds": 65,
        "motif_duration_seconds": 42,
        "quiz_play_count": 12,
        "puzzle_play_count": 10,
        "motif_play_count": 8,
        "badges": [{"icon": "🏆", "title": "Thủ lĩnh tuần"}],
    },
    {
        "rank": 2,
        "user_id": "mock_u2",
        "username": "Quang Minh",
        "avatar": "../images/chim-lac-pattern.png",
        "total_score": 17520,
        "quiz_score": 5800,
        "puzzle_score": 7220,
        "motif_score": 4500,
        "quiz_best_streak": 15,
        "puzzle_best_streak": 12,
        "motif_best_streak": 10,
        "quiz_duration_seconds": 39,
        "puzzle_duration_seconds": 72,
        "motif_duration_seconds": 48,
        "quiz_play_count": 10,
        "puzzle_play_count": 9,
        "motif_play_count": 7,
        "badges": [{"icon": "⚡", "title": "Bứt tốc"}],
    },
    {
        "rank": 3,
        "user_id": "mock_u3",
        "username": "Gia Bảo",
        "avatar": "../images/TrongDong.png",
        "total_score": 16880,
        "quiz_score": 5500,
        "puzzle_score": 7180,
        "motif_score": 4200,
        "quiz_best_streak": 13,
        "puzzle_best_streak": 10,
        "motif_best_streak": 9,
        "quiz_duration_seconds": 44,
        "puzzle_duration_seconds": 78,
        "motif_duration_seconds": 52,
        "quiz_play_count": 9,
        "puzzle_play_count": 8,
        "motif_play_count": 6,
        "badges": [{"icon": "🛡️", "title": "Ổn định"}],
    },
    {
        "rank": 4,
        "user_id": "mock_u4",
        "username": "Hoàng Nam",
        "avatar": "../images/dongsonz1.jpg",
        "total_score": 15900,
        "quiz_score": 5100,
        "puzzle_score": 6800,
        "motif_score": 4000,
        "quiz_best_streak": 11,
        "puzzle_best_streak": 9,
        "motif_best_streak": 8,
        "quiz_duration_seconds": 48,
        "puzzle_duration_seconds": 84,
        "motif_duration_seconds": 56,
        "quiz_play_count": 8,
        "puzzle_play_count": 7,
        "motif_play_count": 5,
        "badges": [{"icon": "🎯", "title": "Chiến binh"}],
    },
    {
        "rank": 5,
        "user_id": "mock_u5",
        "username": "Thanh Hà",
        "avatar": "../images/TD_Cam_Giang.jpg",
        "total_score": 15200,
        "quiz_score": 4900,
        "puzzle_score": 6500,
        "motif_score": 3800,
        "quiz_best_streak": 10,
        "puzzle_best_streak": 8,
        "motif_best_streak": 7,
        "quiz_duration_seconds": 52,
        "puzzle_duration_seconds": 90,
        "motif_duration_seconds": 60,
        "quiz_play_count": 7,
        "puzzle_play_count": 6,
        "motif_play_count": 5,
        "badges": [{"icon": "🌟", "title": "Tiềm năng"}],
    },
    {
        "rank": 6,
        "user_id": "mock_u6",
        "username": "Minh Khôi",
        "avatar": "../images/TD_Huu_Chung.png",
        "total_score": 14400,
        "quiz_score": 4600,
        "puzzle_score": 6200,
        "motif_score": 3600,
        "quiz_best_streak": 9,
        "puzzle_best_streak": 7,
        "motif_best_streak": 6,
        "quiz_duration_seconds": 56,
        "puzzle_duration_seconds": 96,
        "motif_duration_seconds": 64,
        "quiz_play_count": 6,
        "puzzle_play_count": 5,
        "motif_play_count": 4,
        "badges": [],
    },
    {
        "rank": 7,
        "user_id": "mock_u7",
        "username": "Lan Anh",
        "avatar": "../images/chim-lac-pattern.png",
        "total_score": 13600,
        "quiz_score": 4300,
        "puzzle_score": 5900,
        "motif_score": 3400,
        "quiz_best_streak": 8,
        "puzzle_best_streak": 7,
        "motif_best_streak": 6,
        "quiz_duration_seconds": 60,
        "puzzle_duration_seconds": 102,
        "motif_duration_seconds": 68,
        "quiz_play_count": 5,
        "puzzle_play_count": 5,
        "motif_play_count": 4,
        "badges": [],
    },
    {
        "rank": 8,
        "user_id": "mock_u8",
        "username": "Quốc Tuấn",
        "avatar": "../images/TD_SaoVang.jpg",
        "total_score": 13000,
        "quiz_score": 4100,
        "puzzle_score": 5700,
        "motif_score": 3200,
        "quiz_best_streak": 7,
        "puzzle_best_streak": 6,
        "motif_best_streak": 5,
        "quiz_duration_seconds": 65,
        "puzzle_duration_seconds": 110,
        "motif_duration_seconds": 72,
        "quiz_play_count": 5,
        "puzzle_play_count": 4,
        "motif_play_count": 3,
        "badges": [],
    },
    {
        "rank": 9,
        "user_id": "mock_u9",
        "username": "Thục Quyên",
        "avatar": "../images/coloa.png",
        "total_score": 12300,
        "quiz_score": 3900,
        "puzzle_score": 5400,
        "motif_score": 3000,
        "quiz_best_streak": 6,
        "puzzle_best_streak": 5,
        "motif_best_streak": 5,
        "quiz_duration_seconds": 70,
        "puzzle_duration_seconds": 115,
        "motif_duration_seconds": 75,
        "quiz_play_count": 4,
        "puzzle_play_count": 4,
        "motif_play_count": 3,
        "badges": [],
    },
    {
        "rank": 10,
        "user_id": "mock_u10",
        "username": "Đức Trọng",
        "avatar": "../images/hoangha.png",
        "total_score": 11600,
        "quiz_score": 3700,
        "puzzle_score": 5100,
        "motif_score": 2800,
        "quiz_best_streak": 5,
        "puzzle_best_streak": 5,
        "motif_best_streak": 4,
        "quiz_duration_seconds": 75,
        "puzzle_duration_seconds": 120,
        "motif_duration_seconds": 80,
        "quiz_play_count": 3,
        "puzzle_play_count": 3,
        "motif_play_count": 2,
        "badges": [],
    },
]


def get_mock_leaderboard(scope, current_user=None, period="all", group=None):
    title = "Tổng điểm" if scope == "tong" else GAME_LABELS.get(scope, "Bảng xếp hạng")

    if scope == "tong":
        sorted_players = sorted(MOCK_PLAYERS, key=lambda x: x["total_score"], reverse=True)
        entries = []
        for idx, p in enumerate(sorted_players):
            entries.append({
                "rank": idx + 1,
                "user_id": p["user_id"],
                "username": p["username"],
                "avatar": p["avatar"],
                "total_score": p["total_score"],
                "quiz_score": p["quiz_score"],
                "puzzle_score": p["puzzle_score"],
                "motif_score": p["motif_score"],
                "selected_score": p["total_score"],
                "badges": p.get("badges", []),
            })
    elif scope == "codechayquiz":
        sorted_players = sorted(MOCK_PLAYERS, key=lambda x: x["quiz_score"], reverse=True)
        entries = []
        for idx, p in enumerate(sorted_players):
            entries.append({
                "rank": idx + 1,
                "user_id": p["user_id"],
                "username": p["username"],
                "avatar": p["avatar"],
                "quiz_score": p["quiz_score"],
                "score": p["quiz_score"],
                "selected_score": p["quiz_score"],
                "best_streak": p["quiz_best_streak"],
                "duration_seconds": p["quiz_duration_seconds"],
                "play_count": p["quiz_play_count"],
                "badges": p.get("badges", []),
            })
    elif scope == "puzzle":
        sorted_players = sorted(MOCK_PLAYERS, key=lambda x: x["puzzle_score"], reverse=True)
        entries = []
        for idx, p in enumerate(sorted_players):
            entries.append({
                "rank": idx + 1,
                "user_id": p["user_id"],
                "username": p["username"],
                "avatar": p["avatar"],
                "puzzle_score": p["puzzle_score"],
                "score": p["puzzle_score"],
                "selected_score": p["puzzle_score"],
                "best_streak": p["puzzle_best_streak"],
                "duration_seconds": p["puzzle_duration_seconds"],
                "play_count": p["puzzle_play_count"],
                "badges": p.get("badges", []),
            })
    elif scope == "motifhunt":
        sorted_players = sorted(MOCK_PLAYERS, key=lambda x: x["motif_score"], reverse=True)
        entries = []
        for idx, p in enumerate(sorted_players):
            entries.append({
                "rank": idx + 1,
                "user_id": p["user_id"],
                "username": p["username"],
                "avatar": p["avatar"],
                "motif_score": p["motif_score"],
                "score": p["motif_score"],
                "selected_score": p["motif_score"],
                "best_streak": p["motif_best_streak"],
                "duration_seconds": p["motif_duration_seconds"],
                "play_count": p["motif_play_count"],
                "badges": p.get("badges", []),
            })
    else:
        entries = []

    current_user_payload = None
    if current_user:
        total_score = getattr(current_user, "total_score", 0) or 8650
        current_user_payload = {
            "user_id": getattr(current_user, "id", "current_user"),
            "username": getattr(current_user, "username", "Bạn"),
            "avatar": getattr(current_user, "avatar", "../images/chim-lac-pattern.png"),
            "total_score": total_score,
            "quiz_score": 3200,
            "puzzle_score": 3450,
            "motif_score": 2000,
            "quiz_best_streak": 8,
            "puzzle_best_streak": 7,
            "motif_best_streak": 6,
            "quiz_duration_seconds": 45,
            "puzzle_duration_seconds": 60,
            "motif_duration_seconds": 55,
            "quiz_play_count": 5,
            "puzzle_play_count": 4,
            "motif_play_count": 3,
            "selected_score": total_score if scope == "tong" else (3450 if scope == "puzzle" else (2000 if scope == "motifhunt" else 3200)),
            "rank": 12,
            "best_game": "Ghép hình",
        }

    return {
        "message": "Lấy bảng xếp hạng thành công (dữ liệu mẫu)",
        "scope": scope,
        "period": period,
        "group": group,
        "title": title,
        "entries": entries,
        "current_user": current_user_payload,
        "available_scopes": [
            {"scope": "tong", "label": "Tổng"},
            {"scope": "motifhunt", "label": GAME_LABELS["motifhunt"]},
            {"scope": "puzzle", "label": GAME_LABELS["puzzle"]},
            {"scope": "codechayquiz", "label": GAME_LABELS["codechayquiz"]},
        ],
    }


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

    try:
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
            return get_mock_leaderboard(scope, current_user, period, class_group)

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
    except Exception:
        return get_mock_leaderboard(scope, current_user, period, class_group)
