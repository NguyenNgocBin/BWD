import config.db as db


FILTERED_LEADERBOARD_SQL = """
with filtered_sessions as (
    select
        gs.*,
        g.code as game_code,
        row_number() over (
            partition by gs.user_id, g.code
            order by gs.score desc, gs.duration_seconds asc nulls last,
                     gs.best_streak desc, gs.played_at asc
        ) as best_row
    from game_sessions gs
    join games g on g.id = gs.game_id
    join users filter_user on filter_user.id = gs.user_id
    where g.code in ('motifhunt', 'puzzle', 'codechayquiz')
      and (
          %s = 'all'
          or (%s = 'today' and gs.played_at >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date at time zone 'Asia/Ho_Chi_Minh'))
          or (%s = 'week' and gs.played_at >= (date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'))
      )
      and (%s is null or filter_user.class_group = %s)
),
per_user as (
    select
        u.id as user_id,
        u.username,
        u.avatar,
        u.class_group,
        coalesce(max(case when fs.game_code = 'codechayquiz' and fs.best_row = 1 then fs.score end), 0) as quiz_score,
        coalesce(max(case when fs.game_code = 'puzzle' and fs.best_row = 1 then fs.score end), 0) as puzzle_score,
        coalesce(max(case when fs.game_code = 'motifhunt' and fs.best_row = 1 then fs.score end), 0) as motif_score,
        coalesce(max(case when fs.game_code = 'codechayquiz' and fs.best_row = 1 then fs.best_streak end), 0) as quiz_best_streak,
        coalesce(max(case when fs.game_code = 'puzzle' and fs.best_row = 1 then fs.best_streak end), 0) as puzzle_best_streak,
        coalesce(max(case when fs.game_code = 'motifhunt' and fs.best_row = 1 then fs.best_streak end), 0) as motif_best_streak,
        coalesce(max(case when fs.game_code = 'codechayquiz' and fs.best_row = 1 then fs.duration_seconds end), 0) as quiz_duration_seconds,
        coalesce(max(case when fs.game_code = 'puzzle' and fs.best_row = 1 then fs.duration_seconds end), 0) as puzzle_duration_seconds,
        coalesce(max(case when fs.game_code = 'motifhunt' and fs.best_row = 1 then fs.duration_seconds end), 0) as motif_duration_seconds,
        count(*) filter (where fs.game_code = 'codechayquiz') as quiz_play_count,
        count(*) filter (where fs.game_code = 'puzzle') as puzzle_play_count,
        count(*) filter (where fs.game_code = 'motifhunt') as motif_play_count
    from filtered_sessions fs
    join users u on u.id = fs.user_id
    group by u.id, u.username, u.avatar, u.class_group
),
scored as (
    select
        per_user.*,
        quiz_score + puzzle_score + motif_score as total_score,
        case %s
            when 'codechayquiz' then quiz_score
            when 'puzzle' then puzzle_score
            when 'motifhunt' then motif_score
            else quiz_score + puzzle_score + motif_score
        end as selected_game_score,
        case %s
            when 'codechayquiz' then quiz_best_streak
            when 'puzzle' then puzzle_best_streak
            when 'motifhunt' then motif_best_streak
            else 0
        end as selected_best_streak,
        case %s
            when 'codechayquiz' then quiz_duration_seconds
            when 'puzzle' then puzzle_duration_seconds
            when 'motifhunt' then motif_duration_seconds
            else 0
        end as selected_duration_seconds,
        case %s
            when 'codechayquiz' then quiz_play_count
            when 'puzzle' then puzzle_play_count
            when 'motifhunt' then motif_play_count
            else quiz_play_count + puzzle_play_count + motif_play_count
        end as selected_play_count
    from per_user
),
ranked as (
    select
        scored.*,
        dense_rank() over (
            order by
                selected_game_score desc,
                selected_duration_seconds asc,
                selected_best_streak desc
        ) as rank
    from scored
    where selected_game_score > 0
)
select *
from ranked
where (%s is null or user_id = %s)
order by rank, user_id
limit %s
"""


TOTAL_LEADERBOARD_SQL = """
with best_sessions as (
    select user_id, game_code, duration_seconds
    from (
        select
            gs.user_id,
            g.code as game_code,
            gs.duration_seconds,
            row_number() over (
                partition by gs.user_id, g.code
                order by gs.score desc, gs.duration_seconds asc nulls last, gs.played_at asc
            ) as row_number
        from game_sessions gs
        join games g on g.id = gs.game_id
    ) ranked_sessions
    where row_number = 1
),
per_user as (
    select
        u.id as user_id,
        u.username,
        u.avatar,
        (
            coalesce(max(case when g.code = 'codechayquiz' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'puzzle' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'motifhunt' then ugs.best_score end), 0)
        ) as total_score,
        u.updated_at,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_score end),
            0
        ) as quiz_score,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_score end),
            0
        ) as puzzle_score,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_score end),
            0
        ) as motif_score,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_streak end),
            0
        ) as quiz_best_streak,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_streak end),
            0
        ) as puzzle_best_streak,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_streak end),
            0
        ) as motif_best_streak,
        coalesce(
            max(case when bs.game_code = 'codechayquiz' then bs.duration_seconds end),
            0
        ) as quiz_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'puzzle' then bs.duration_seconds end),
            0
        ) as puzzle_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'motifhunt' then bs.duration_seconds end),
            0
        ) as motif_duration_seconds,
        coalesce(
            sum(case when g.code = 'codechayquiz' then ugs.play_count end),
            0
        ) as quiz_play_count,
        coalesce(
            sum(case when g.code = 'puzzle' then ugs.play_count end),
            0
        ) as puzzle_play_count,
        coalesce(
            sum(case when g.code = 'motifhunt' then ugs.play_count end),
            0
        ) as motif_play_count
    from users u
    left join user_game_stats ugs on ugs.user_id = u.id
    left join games g on g.id = ugs.game_id
    left join best_sessions bs on bs.user_id = u.id and bs.game_code = g.code
    group by u.id, u.username, u.avatar, u.updated_at
),
ranked as (
    select
        per_user.*,
        dense_rank() over (
            order by per_user.total_score desc
        ) as rank
    from per_user
    where per_user.total_score > 0
)
select
    ranked.user_id,
    ranked.username,
    ranked.avatar,
    ranked.total_score,
    ranked.quiz_score,
    ranked.puzzle_score,
    ranked.motif_score,
    ranked.quiz_best_streak,
    ranked.puzzle_best_streak,
    ranked.motif_best_streak,
    ranked.quiz_duration_seconds,
    ranked.puzzle_duration_seconds,
    ranked.motif_duration_seconds,
    ranked.quiz_play_count,
    ranked.puzzle_play_count,
    ranked.motif_play_count,
    ranked.rank
from ranked
order by ranked.rank asc, ranked.user_id asc
limit %s
"""


TOTAL_LEADERBOARD_BY_USER_SQL = """
with best_sessions as (
    select user_id, game_code, duration_seconds
    from (
        select
            gs.user_id,
            g.code as game_code,
            gs.duration_seconds,
            row_number() over (
                partition by gs.user_id, g.code
                order by gs.score desc, gs.duration_seconds asc nulls last, gs.played_at asc
            ) as row_number
        from game_sessions gs
        join games g on g.id = gs.game_id
    ) ranked_sessions
    where row_number = 1
),
per_user as (
    select
        u.id as user_id,
        u.username,
        u.avatar,
        (
            coalesce(max(case when g.code = 'codechayquiz' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'puzzle' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'motifhunt' then ugs.best_score end), 0)
        ) as total_score,
        u.updated_at,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_score end),
            0
        ) as quiz_score,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_score end),
            0
        ) as puzzle_score,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_score end),
            0
        ) as motif_score,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_streak end),
            0
        ) as quiz_best_streak,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_streak end),
            0
        ) as puzzle_best_streak,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_streak end),
            0
        ) as motif_best_streak,
        coalesce(
            max(case when bs.game_code = 'codechayquiz' then bs.duration_seconds end),
            0
        ) as quiz_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'puzzle' then bs.duration_seconds end),
            0
        ) as puzzle_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'motifhunt' then bs.duration_seconds end),
            0
        ) as motif_duration_seconds,
        coalesce(
            sum(case when g.code = 'codechayquiz' then ugs.play_count end),
            0
        ) as quiz_play_count,
        coalesce(
            sum(case when g.code = 'puzzle' then ugs.play_count end),
            0
        ) as puzzle_play_count,
        coalesce(
            sum(case when g.code = 'motifhunt' then ugs.play_count end),
            0
        ) as motif_play_count
    from users u
    left join user_game_stats ugs on ugs.user_id = u.id
    left join games g on g.id = ugs.game_id
    left join best_sessions bs on bs.user_id = u.id and bs.game_code = g.code
    group by u.id, u.username, u.avatar, u.updated_at
),
ranked as (
    select
        per_user.*,
        dense_rank() over (
            order by per_user.total_score desc
        ) as rank
    from per_user
    where per_user.total_score > 0
)
select
    ranked.user_id,
    ranked.username,
    ranked.avatar,
    ranked.total_score,
    ranked.quiz_score,
    ranked.puzzle_score,
    ranked.motif_score,
    ranked.quiz_best_streak,
    ranked.puzzle_best_streak,
    ranked.motif_best_streak,
    ranked.quiz_duration_seconds,
    ranked.puzzle_duration_seconds,
    ranked.motif_duration_seconds,
    ranked.quiz_play_count,
    ranked.puzzle_play_count,
    ranked.motif_play_count,
    ranked.rank
from ranked
where ranked.user_id = %s
"""


GAME_LEADERBOARD_SQL = """
with best_sessions as (
    select user_id, game_code, duration_seconds
    from (
        select
            gs.user_id,
            g.code as game_code,
            gs.duration_seconds,
            row_number() over (
                partition by gs.user_id, g.code
                order by gs.score desc, gs.duration_seconds asc nulls last, gs.played_at asc
            ) as row_number
        from game_sessions gs
        join games g on g.id = gs.game_id
    ) ranked_sessions
    where row_number = 1
),
per_user as (
    select
        u.id as user_id,
        u.username,
        u.avatar,
        (
            coalesce(max(case when g.code = 'codechayquiz' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'puzzle' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'motifhunt' then ugs.best_score end), 0)
        ) as total_score,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_score end),
            0
        ) as quiz_score,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_score end),
            0
        ) as puzzle_score,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_score end),
            0
        ) as motif_score,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_streak end),
            0
        ) as quiz_best_streak,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_streak end),
            0
        ) as puzzle_best_streak,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_streak end),
            0
        ) as motif_best_streak,
        coalesce(
            max(case when bs.game_code = 'codechayquiz' then bs.duration_seconds end),
            0
        ) as quiz_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'puzzle' then bs.duration_seconds end),
            0
        ) as puzzle_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'motifhunt' then bs.duration_seconds end),
            0
        ) as motif_duration_seconds,
        coalesce(
            sum(case when g.code = 'codechayquiz' then ugs.play_count end),
            0
        ) as quiz_play_count,
        coalesce(
            sum(case when g.code = 'puzzle' then ugs.play_count end),
            0
        ) as puzzle_play_count,
        coalesce(
            sum(case when g.code = 'motifhunt' then ugs.play_count end),
            0
        ) as motif_play_count,
        coalesce(
            max(case when g.code = %s then ugs.best_score end),
            0
        ) as selected_game_score,
        coalesce(
            max(case when g.code = %s then ugs.best_streak end),
            0
        ) as selected_best_streak,
        coalesce(
            max(case when bs.game_code = %s then bs.duration_seconds end),
            0
        ) as selected_duration_seconds,
        coalesce(
            sum(case when g.code = %s then ugs.play_count end),
            0
        ) as selected_play_count
    from users u
    left join user_game_stats ugs on ugs.user_id = u.id
    left join games g on g.id = ugs.game_id
    left join best_sessions bs on bs.user_id = u.id and bs.game_code = g.code
    group by u.id, u.username, u.avatar
),
ranked as (
    select
        per_user.*,
        dense_rank() over (
            order by
                per_user.selected_game_score desc,
                per_user.selected_duration_seconds asc,
                per_user.selected_best_streak desc
        ) as rank
    from per_user
    where per_user.selected_game_score > 0
)
select
    ranked.user_id,
    ranked.username,
    ranked.avatar,
    ranked.total_score,
    ranked.quiz_score,
    ranked.puzzle_score,
    ranked.motif_score,
    ranked.quiz_best_streak,
    ranked.puzzle_best_streak,
    ranked.motif_best_streak,
    ranked.quiz_duration_seconds,
    ranked.puzzle_duration_seconds,
    ranked.motif_duration_seconds,
    ranked.quiz_play_count,
    ranked.puzzle_play_count,
    ranked.motif_play_count,
    ranked.selected_game_score,
    ranked.selected_best_streak,
    ranked.selected_duration_seconds,
    ranked.selected_play_count,
    ranked.rank
from ranked
order by ranked.rank asc, ranked.user_id asc
limit %s
"""


GAME_LEADERBOARD_BY_USER_SQL = """
with best_sessions as (
    select user_id, game_code, duration_seconds
    from (
        select
            gs.user_id,
            g.code as game_code,
            gs.duration_seconds,
            row_number() over (
                partition by gs.user_id, g.code
                order by gs.score desc, gs.duration_seconds asc nulls last, gs.played_at asc
            ) as row_number
        from game_sessions gs
        join games g on g.id = gs.game_id
    ) ranked_sessions
    where row_number = 1
),
per_user as (
    select
        u.id as user_id,
        u.username,
        u.avatar,
        (
            coalesce(max(case when g.code = 'codechayquiz' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'puzzle' then ugs.best_score end), 0)
            + coalesce(max(case when g.code = 'motifhunt' then ugs.best_score end), 0)
        ) as total_score,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_score end),
            0
        ) as quiz_score,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_score end),
            0
        ) as puzzle_score,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_score end),
            0
        ) as motif_score,
        coalesce(
            max(case when g.code = 'codechayquiz' then ugs.best_streak end),
            0
        ) as quiz_best_streak,
        coalesce(
            max(case when g.code = 'puzzle' then ugs.best_streak end),
            0
        ) as puzzle_best_streak,
        coalesce(
            max(case when g.code = 'motifhunt' then ugs.best_streak end),
            0
        ) as motif_best_streak,
        coalesce(
            max(case when bs.game_code = 'codechayquiz' then bs.duration_seconds end),
            0
        ) as quiz_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'puzzle' then bs.duration_seconds end),
            0
        ) as puzzle_duration_seconds,
        coalesce(
            max(case when bs.game_code = 'motifhunt' then bs.duration_seconds end),
            0
        ) as motif_duration_seconds,
        coalesce(
            sum(case when g.code = 'codechayquiz' then ugs.play_count end),
            0
        ) as quiz_play_count,
        coalesce(
            sum(case when g.code = 'puzzle' then ugs.play_count end),
            0
        ) as puzzle_play_count,
        coalesce(
            sum(case when g.code = 'motifhunt' then ugs.play_count end),
            0
        ) as motif_play_count,
        coalesce(
            max(case when g.code = %s then ugs.best_score end),
            0
        ) as selected_game_score,
        coalesce(
            max(case when g.code = %s then ugs.best_streak end),
            0
        ) as selected_best_streak,
        coalesce(
            max(case when bs.game_code = %s then bs.duration_seconds end),
            0
        ) as selected_duration_seconds,
        coalesce(
            sum(case when g.code = %s then ugs.play_count end),
            0
        ) as selected_play_count
    from users u
    left join user_game_stats ugs on ugs.user_id = u.id
    left join games g on g.id = ugs.game_id
    left join best_sessions bs on bs.user_id = u.id and bs.game_code = g.code
    group by u.id, u.username, u.avatar
),
ranked as (
    select
        per_user.*,
        dense_rank() over (
            order by
                per_user.selected_game_score desc,
                per_user.selected_duration_seconds asc,
                per_user.selected_best_streak desc
        ) as rank
    from per_user
    where per_user.selected_game_score > 0
)
select
    ranked.user_id,
    ranked.username,
    ranked.avatar,
    ranked.total_score,
    ranked.quiz_score,
    ranked.puzzle_score,
    ranked.motif_score,
    ranked.quiz_best_streak,
    ranked.puzzle_best_streak,
    ranked.motif_best_streak,
    ranked.quiz_duration_seconds,
    ranked.puzzle_duration_seconds,
    ranked.motif_duration_seconds,
    ranked.quiz_play_count,
    ranked.puzzle_play_count,
    ranked.motif_play_count,
    ranked.selected_game_score,
    ranked.selected_best_streak,
    ranked.selected_duration_seconds,
    ranked.selected_play_count,
    ranked.rank
from ranked
where ranked.user_id = %s
"""


def get_total_leaderboard(limit):
    return db.fetch_all(TOTAL_LEADERBOARD_SQL, (limit,))


def get_total_leaderboard_entry_by_user(user_id):
    return db.fetch_one(TOTAL_LEADERBOARD_BY_USER_SQL, (user_id,))


def get_game_leaderboard(game_code, limit):
    return db.fetch_all(
        GAME_LEADERBOARD_SQL,
        (game_code, game_code, game_code, game_code, limit),
    )


def get_game_leaderboard_entry_by_user(game_code, user_id):
    return db.fetch_one(
        GAME_LEADERBOARD_BY_USER_SQL,
        (game_code, game_code, game_code, game_code, user_id),
    )


def get_filtered_leaderboard(scope, period, class_group, limit, user_id=None):
    return db.fetch_all(
        FILTERED_LEADERBOARD_SQL,
        (
            period,
            period,
            period,
            class_group,
            class_group,
            scope,
            scope,
            scope,
            scope,
            user_id,
            user_id,
            limit,
        ),
    )
