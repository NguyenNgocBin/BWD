import config.db as db


ACHIEVEMENT_RULES_SQL = """
with user_facts as (
    select
        exists (
            select 1 from game_sessions gs join games g on g.id = gs.game_id
            where gs.user_id = %s and g.code = 'codechayquiz'
        ) as played_quiz,
        exists (
            select 1 from game_sessions gs join games g on g.id = gs.game_id
            where gs.user_id = %s and g.code = 'puzzle'
              and coalesce(gs.level_reached, 0) >= 3
              and coalesce((gs.metadata ->> 'completed')::boolean, false)
        ) as completed_puzzle,
        exists (
            select 1 from game_sessions gs join games g on g.id = gs.game_id
            where gs.user_id = %s and g.code = 'codechayquiz' and gs.best_streak >= 10
        ) as streak_10,
        (
            select count(distinct g.code)
            from user_game_stats ugs join games g on g.id = ugs.game_id
            where ugs.user_id = %s and ugs.play_count > 0
              and g.code in ('motifhunt', 'puzzle', 'codechayquiz')
        ) >= 3 as completed_all_games
)
select code
from user_facts,
lateral (
    values
        ('drum_decoder', played_quiz),
        ('puzzle_master', completed_puzzle),
        ('quiz_streak_10', streak_10),
        ('all_games', completed_all_games)
) rules(code, achieved)
where achieved
"""


DAILY_PROGRESS_SQL = """
select
    exists (
        select 1 from game_sessions gs join games g on g.id = gs.game_id
        where gs.user_id = %s and g.code = 'motifhunt'
          and gs.played_at >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date at time zone 'Asia/Ho_Chi_Minh')
          and gs.played_at < (((now() at time zone 'Asia/Ho_Chi_Minh')::date + 1) at time zone 'Asia/Ho_Chi_Minh')
    ) as motif_played,
    exists (
        select 1 from game_sessions gs join games g on g.id = gs.game_id
        where gs.user_id = %s and g.code = 'puzzle'
          and gs.played_at >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date at time zone 'Asia/Ho_Chi_Minh')
          and gs.played_at < (((now() at time zone 'Asia/Ho_Chi_Minh')::date + 1) at time zone 'Asia/Ho_Chi_Minh')
          and (
              coalesce(jsonb_array_length(gs.metadata -> 'completed_levels'), 0) > 0
              or coalesce((gs.metadata ->> 'completed')::boolean, false)
          )
    ) as puzzle_level_completed,
    coalesce((
        select sum(gs.correct_count) from game_sessions gs join games g on g.id = gs.game_id
        where gs.user_id = %s and g.code = 'codechayquiz'
          and gs.played_at >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date at time zone 'Asia/Ho_Chi_Minh')
          and gs.played_at < (((now() at time zone 'Asia/Ho_Chi_Minh')::date + 1) at time zone 'Asia/Ho_Chi_Minh')
    ), 0) as quiz_correct_count
"""


def unlock_achievements(user_id, achievement_codes):
    if not achievement_codes:
        return []

    return db.fetch_all(
        """
        insert into user_achievements (user_id, achievement_id)
        select %s, a.id
        from achievements a
        where a.code = any(%s) and a.is_active = true
        on conflict (user_id, achievement_id) do nothing
        returning achievement_id, unlocked_at
        """,
        (user_id, achievement_codes),
    )


def get_earned_rule_codes(user_id):
    rows = db.fetch_all(
        ACHIEVEMENT_RULES_SQL,
        (user_id, user_id, user_id, user_id),
    )
    return [row["code"] for row in rows]


def get_daily_progress(user_id):
    return db.fetch_one(DAILY_PROGRESS_SQL, (user_id, user_id, user_id))


def get_all_achievements_for_user(user_id):
    return db.fetch_all(
        """
        select
            a.code,
            a.title,
            a.description,
            a.icon,
            a.display_order,
            ua.unlocked_at,
            (ua.user_id is not null) as unlocked
        from achievements a
        left join user_achievements ua
          on ua.achievement_id = a.id and ua.user_id = %s
        where a.is_active = true
        order by a.display_order, a.id
        """,
        (user_id,),
    )


def get_featured_achievements(user_ids, limit_per_user=3):
    if not user_ids:
        return []
    return db.fetch_all(
        """
        select user_id, code, title, icon
        from (
            select
                ua.user_id,
                a.code,
                a.title,
                a.icon,
                row_number() over (
                    partition by ua.user_id
                    order by a.display_order desc, ua.unlocked_at desc
                ) as row_number
            from user_achievements ua
            join achievements a on a.id = ua.achievement_id
            where ua.user_id = any(%s) and a.is_active = true
        ) ranked
        where row_number <= %s
        order by user_id, row_number
        """,
        (user_ids, limit_per_user),
    )
