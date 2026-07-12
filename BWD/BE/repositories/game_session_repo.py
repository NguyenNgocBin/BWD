import config.db as db


# Tao mot game session moi, dong bo bang thong ke va tinh lai tong diem user.
# Tong diem nghiep vu la tong diem TOT NHAT cua moi game, khong phai tong
# tat ca cac luot choi.
def create_game_session(
    user_id,
    game_id,
    score,
    correct_count,
    wrong_count,
    total_questions,
    accuracy,
    duration_seconds,
    best_streak,
    level_reached,
    metadata,
):
    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into game_sessions (
                    user_id,
                    game_id,
                    score,
                    correct_count,
                    wrong_count,
                    total_questions,
                    accuracy,
                    duration_seconds,
                    best_streak,
                    level_reached,
                    metadata
                )
                values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                returning
                    id,
                    user_id,
                    game_id,
                    score,
                    correct_count,
                    wrong_count,
                    total_questions,
                    accuracy,
                    duration_seconds,
                    best_streak,
                    level_reached,
                    metadata,
                    played_at
                """,
                (
                    user_id,
                    game_id,
                    score,
                    correct_count,
                    wrong_count,
                    total_questions,
                    accuracy,
                    duration_seconds,
                    best_streak,
                    level_reached,
                    metadata,
                ),
            )
            session_row = cursor.fetchone()

            cursor.execute(
                """
                insert into user_game_stats (
                    user_id,
                    game_id,
                    best_score,
                    total_score,
                    play_count,
                    best_streak,
                    last_played_at
                )
                values (%s, %s, %s, %s, 1, %s, now())
                on conflict (user_id, game_id)
                do update set
                    best_score = greatest(user_game_stats.best_score, excluded.best_score),
                    total_score = user_game_stats.total_score + excluded.total_score,
                    play_count = user_game_stats.play_count + 1,
                    best_streak = greatest(user_game_stats.best_streak, excluded.best_streak),
                    last_played_at = excluded.last_played_at,
                    updated_at = now()
                returning
                    user_id,
                    game_id,
                    best_score,
                    total_score,
                    play_count,
                    best_streak,
                    last_played_at,
                    updated_at
                """,
                (user_id, game_id, score, score, best_streak),
            )
            stats_row = cursor.fetchone()

            cursor.execute(
                """
                update users
                set total_score = coalesce(
                        (
                            select sum(best_score)
                            from user_game_stats
                            where user_id = %s
                        ),
                        0
                    ),
                    updated_at = now()
                where id = %s
                returning total_score
                """,
                (user_id, user_id),
            )
            user_row = cursor.fetchone()

        connection.commit()

    return session_row, stats_row, user_row


# Lay lich su choi game gan day cua user hien tai.
def get_recent_game_sessions_by_user(user_id, limit=10):
    return db.fetch_all(
        """
        select
            gs.id,
            gs.score,
            gs.correct_count,
            gs.wrong_count,
            gs.total_questions,
            gs.accuracy,
            gs.duration_seconds,
            gs.best_streak,
            gs.level_reached,
            gs.metadata,
            gs.played_at,
            g.code as game_code,
            g.name as game_name
        from game_sessions gs
        join games g on g.id = gs.game_id
        where gs.user_id = %s
        order by gs.played_at desc
        limit %s
        """,
        (user_id, limit),
    )
