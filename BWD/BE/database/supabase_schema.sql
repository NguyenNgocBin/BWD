-- ==============================================================================
-- BWD PROJECT - SUPABASE DATABASE SCHEMA
-- Hệ thống cơ sở dữ liệu Văn hoá Đông Sơn / Trống đồng
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 0. Đảm bảo chạy trên schema public
set search_path to public;

-- Tùy chọn: Hàm tự động cập nhật updated_at khi có UPDATE
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ==============================================================================
-- 1. BẢNG USERS (Tài khoản người dùng)
-- ==============================================================================
create table if not exists users (
    id serial primary key,
    username varchar(100) not null unique,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    avatar varchar(255) not null default 'default-avatar.png',
    total_score integer not null default 0,
    class_group varchar(120),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Bảo đảm tương thích nếu bảng users đã tồn tại từ trước mà chưa có class_group
alter table users add column if not exists class_group varchar(120);

create index if not exists idx_users_username on users (username);
create index if not exists idx_users_email on users (email);
create index if not exists idx_users_class_group on users (class_group);

-- ==============================================================================
-- 2. BẢNG GAMES (Danh sách các trò chơi)
-- ==============================================================================
create table if not exists games (
    id serial primary key,
    code varchar(50) not null unique,
    name varchar(150) not null,
    description text,
    is_active boolean not null default true,
    display_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_games_code on games (code);
create index if not exists idx_games_active_order on games (is_active, display_order);

-- Seed danh sách game mặc định
insert into games (code, name, description, display_order)
values
    (
        'motifhunt',
        'Lật thẻ hoạ tiết',
        'Người chơi lật thẻ và ghép cặp hoạ tiết Đông Sơn giống nhau.',
        1
    ),
    (
        'puzzle',
        'Ghép hình',
        'Người chơi kéo thả các mảnh ghép để hoàn thành bức tranh trống đồng.',
        2
    ),
    (
        'codechayquiz',
        'Quiz đúng sai',
        'Người chơi trả lời câu hỏi kiến thức về trống đồng và văn hóa Đông Sơn.',
        3
    )
on conflict (code) do update set
    name = excluded.name,
    description = excluded.description,
    display_order = excluded.display_order;

-- ==============================================================================
-- 3. BẢNG GAME_LEVELS (Màn chơi / Chương của từng game)
-- ==============================================================================
create table if not exists game_levels (
    id serial primary key,
    game_id integer not null references games(id) on delete cascade,
    level_number integer not null,
    title varchar(150) not null,
    description text,
    config jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (game_id, level_number)
);

create index if not exists idx_game_levels_game_id on game_levels (game_id);
create index if not exists idx_game_levels_active on game_levels (game_id, is_active, level_number);

-- Seed levels cho Puzzle (Ghép hình)
insert into game_levels (game_id, level_number, title, description, config)
select id, 1, 'Ghép hình 2x2', 'Level đầu tiên của game ghép hình.', '{"rows": 2, "cols": 2, "pieces": 4, "max_time": 60}'::jsonb
from games where code = 'puzzle'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 2, 'Ghép hình 2x3', 'Level trung bình của game ghép hình.', '{"rows": 2, "cols": 3, "pieces": 6, "max_time": 60}'::jsonb
from games where code = 'puzzle'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 3, 'Ghép hình 3x3', 'Level khó nhất của game ghép hình.', '{"rows": 3, "cols": 3, "pieces": 9, "max_time": 60}'::jsonb
from games where code = 'puzzle'
on conflict (game_id, level_number) do nothing;

-- Seed chapters cho Quiz đúng sai
insert into game_levels (game_id, level_number, title, description, config)
select id, 1, 'Nguồn gốc trống đồng', 'Các câu hỏi về nguồn gốc và chất liệu của trống đồng.', '{"questions_per_chapter": 5}'::jsonb
from games where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 2, 'Hoa văn và biểu tượng', 'Các câu hỏi về hoa văn quen thuộc trên trống đồng.', '{"questions_per_chapter": 5}'::jsonb
from games where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 3, 'Kỹ thuật và cấu tạo', 'Các câu hỏi về kỹ thuật đúc và cấu tạo trống đồng.', '{"questions_per_chapter": 5}'::jsonb
from games where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 4, 'Giá trị lịch sử', 'Các câu hỏi về giá trị lịch sử của trống đồng.', '{"questions_per_chapter": 5}'::jsonb
from games where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 5, 'Bảo tồn và phát huy', 'Các câu hỏi về bảo tồn và phát huy di sản.', '{"questions_per_chapter": 5}'::jsonb
from games where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

-- ==============================================================================
-- 4. BẢNG GAME_QUESTIONS (Ngân hàng câu hỏi game Quiz)
-- ==============================================================================
create table if not exists game_questions (
    id serial primary key,
    game_id integer not null references games(id) on delete cascade,
    level_id integer references game_levels(id) on delete set null,
    question_type varchar(50) not null default 'single_choice',
    question_text text not null,
    options jsonb not null default '[]'::jsonb,
    correct_answer varchar(50) not null,
    explanation text,
    points integer not null default 10,
    time_limit_seconds integer,
    display_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (game_id, display_order)
);

create index if not exists idx_game_questions_game_id on game_questions (game_id);
create index if not exists idx_game_questions_level_id on game_questions (level_id);
create index if not exists idx_game_questions_active_order on game_questions (game_id, is_active, display_order);

-- Seed 25 câu hỏi cho game codechayquiz
insert into game_questions (
    game_id,
    level_id,
    question_type,
    question_text,
    options,
    correct_answer,
    points,
    time_limit_seconds,
    display_order
)
select
    g.id,
    l.id,
    'single_choice',
    q.question_text,
    q.options::jsonb,
    q.correct_answer,
    10,
    10,
    q.display_order
from games g
join (
    values
        (1, 1, 'Trống đồng Đông Sơn được làm chủ yếu từ gì?', '[{"key":"A","text":"Sắt"},{"key":"B","text":"Đồng"}]', 'B'),
        (1, 2, 'Nền văn hóa nào gắn liền với trống đồng nổi tiếng ở Việt Nam?', '[{"key":"A","text":"Đông Sơn"},{"key":"B","text":"Óc Eo"}]', 'A'),
        (1, 3, 'Trống đồng Đông Sơn xuất hiện mạnh vào giai đoạn nào?', '[{"key":"A","text":"Sơ kỳ đồ đồng"},{"key":"B","text":"Cuối thời đại đồ đồng"}]', 'B'),
        (1, 4, 'Khu vực phát hiện nhiều trống đồng cổ là đâu?', '[{"key":"A","text":"Bắc Bộ và Bắc Trung Bộ"},{"key":"B","text":"Tây Nam Bộ"}]', 'A'),
        (1, 5, 'Một trong các chức năng ban đầu của trống đồng là gì?', '[{"key":"A","text":"Nghi lễ cộng đồng"},{"key":"B","text":"Nấu ăn"}]', 'A'),
        (2, 6, 'Hình thường nằm ở trung tâm mặt trống là gì?', '[{"key":"A","text":"Ngôi sao nhiều cánh"},{"key":"B","text":"Hình vuông"}]', 'A'),
        (2, 7, 'Chim Lạc trên trống đồng thường biểu trưng cho điều gì?', '[{"key":"A","text":"Khát vọng và sự vận động"},{"key":"B","text":"Sự tĩnh lặng"}]', 'A'),
        (2, 8, 'Hoa văn vòng tròn đồng tâm cho thấy đặc điểm nào?', '[{"key":"A","text":"Tư duy nhịp điệu và trật tự"},{"key":"B","text":"Không có ý nghĩa"}]', 'A'),
        (2, 9, 'Hình người giã gạo trên trống đồng phản ánh điều gì?', '[{"key":"A","text":"Sinh hoạt lao động"},{"key":"B","text":"Trò chơi điện tử"}]', 'A'),
        (2, 10, 'Biểu tượng thuyền trên một số trống đồng liên quan đến gì?', '[{"key":"A","text":"Giao thương và di chuyển"},{"key":"B","text":"Bay trên trời"}]', 'A'),
        (3, 11, 'Trống đồng thường được đúc bằng kỹ thuật nào?', '[{"key":"A","text":"Đúc khuôn"},{"key":"B","text":"In 3D"}]', 'A'),
        (3, 12, 'Mặt trống đồng thường có đặc điểm gì?', '[{"key":"A","text":"Phẳng, có hoa văn"},{"key":"B","text":"Nhiều lỗ thủng"}]', 'A'),
        (3, 13, 'Âm thanh trống đồng phụ thuộc nhiều vào yếu tố nào?', '[{"key":"A","text":"Độ dày và hình dáng thân"},{"key":"B","text":"Màu sơn"}]', 'A'),
        (3, 14, 'Thân trống đồng thường gồm các phần cơ bản nào?', '[{"key":"A","text":"Mặt, tang, thân, chân"},{"key":"B","text":"Nắp, quai, vòi"}]', 'A'),
        (3, 15, 'Quá trình đúc trống đồng đòi hỏi điều gì cao?', '[{"key":"A","text":"Tay nghề thủ công"},{"key":"B","text":"Lắp ráp vít"}]', 'A'),
        (4, 16, 'Trống đồng là tư liệu quý để nghiên cứu gì?', '[{"key":"A","text":"Đời sống xã hội cổ"},{"key":"B","text":"Thiết kế ô tô"}]', 'A'),
        (4, 17, 'Hình ảnh lễ hội trên trống đồng cho thấy điều gì?', '[{"key":"A","text":"Đời sống tinh thần phong phú"},{"key":"B","text":"Không có nghi lễ"}]', 'A'),
        (4, 18, 'Trống đồng thể hiện trình độ nổi bật nào của cư dân xưa?', '[{"key":"A","text":"Luyện kim"},{"key":"B","text":"Lập trình máy tính"}]', 'A'),
        (4, 19, 'Giá trị của trống đồng trong lịch sử Việt Nam là gì?', '[{"key":"A","text":"Biểu tượng văn hóa lâu bền"},{"key":"B","text":"Vật dụng hiện đại"}]', 'A'),
        (4, 20, 'Trống đồng còn phản ánh mối quan hệ nào?', '[{"key":"A","text":"Giao lưu khu vực"},{"key":"B","text":"Cô lập tuyệt đối"}]', 'A'),
        (5, 21, 'Bảo tồn trống đồng cần ưu tiên điều gì?', '[{"key":"A","text":"Lưu giữ hiện vật đúng điều kiện"},{"key":"B","text":"Để ngoài trời nắng"}]', 'A'),
        (5, 22, 'Số hóa trống đồng giúp ích gì?', '[{"key":"A","text":"Lan tỏa tri thức rộng rãi"},{"key":"B","text":"Làm mất dữ liệu"}]', 'A'),
        (5, 23, 'Hoạt động phù hợp để phát huy giá trị trống đồng là gì?', '[{"key":"A","text":"Triển lãm giáo dục"},{"key":"B","text":"Giấu trong kho kín"}]', 'A'),
        (5, 24, 'Người trẻ có thể góp phần bảo tồn bằng cách nào?', '[{"key":"A","text":"Tìm hiểu và chia sẻ kiến thức đúng"},{"key":"B","text":"Lan truyền thông tin sai"}]', 'A'),
        (5, 25, 'Mục tiêu cuối cùng của bảo tồn di sản là gì?', '[{"key":"A","text":"Giữ gìn và truyền lại cho thế hệ sau"},{"key":"B","text":"Xóa bỏ dấu tích"}]', 'A')
) as q(level_number, display_order, question_text, options, correct_answer) on true
join game_levels l on l.game_id = g.id and l.level_number = q.level_number
where g.code = 'codechayquiz'
on conflict (game_id, display_order) do nothing;

-- ==============================================================================
-- 5. BẢNG GAME_SESSIONS (Lịch sử từng lượt chơi của người dùng)
-- ==============================================================================
create table if not exists game_sessions (
    id serial primary key,
    user_id integer not null references users(id) on delete cascade,
    game_id integer not null references games(id) on delete cascade,
    score integer not null default 0,
    correct_count integer not null default 0,
    wrong_count integer not null default 0,
    total_questions integer not null default 0,
    accuracy numeric(5, 2) not null default 0,
    duration_seconds integer,
    best_streak integer not null default 0,
    level_reached integer,
    metadata jsonb not null default '{}'::jsonb,
    played_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_user_id on game_sessions (user_id);
create index if not exists idx_game_sessions_game_id on game_sessions (game_id);
create index if not exists idx_game_sessions_score on game_sessions (game_id, score desc);
create index if not exists idx_game_sessions_played_at on game_sessions (played_at desc);

-- ==============================================================================
-- 6. BẢNG USER_GAME_STATS (Thống kê điểm & thành tích theo game)
-- ==============================================================================
create table if not exists user_game_stats (
    user_id integer not null references users(id) on delete cascade,
    game_id integer not null references games(id) on delete cascade,
    best_score integer not null default 0,
    total_score integer not null default 0,
    play_count integer not null default 0,
    best_streak integer not null default 0,
    last_played_at timestamptz,
    updated_at timestamptz not null default now(),
    primary key (user_id, game_id)
);

create index if not exists idx_user_game_stats_game_best on user_game_stats (game_id, best_score desc);
create index if not exists idx_user_game_stats_user on user_game_stats (user_id);

-- ==============================================================================
-- 7. BẢNG ACHIEVEMENTS & USER_ACHIEVEMENTS (Huy hiệu & Thành tựu)
-- ==============================================================================
create table if not exists achievements (
    id serial primary key,
    code varchar(60) not null unique,
    title varchar(160) not null,
    description text not null,
    icon varchar(20) not null default '🏅',
    display_order integer not null default 0,
    is_active boolean not null default true
);

create table if not exists user_achievements (
    user_id integer not null references users(id) on delete cascade,
    achievement_id integer not null references achievements(id) on delete cascade,
    unlocked_at timestamptz not null default now(),
    primary key (user_id, achievement_id)
);

create index if not exists idx_user_achievements_user on user_achievements (user_id, unlocked_at desc);

-- Seed danh sách huy hiệu
insert into achievements (code, title, description, icon, display_order)
values
    ('drum_decoder', 'Người giải mã trống đồng', 'Hoàn thành ít nhất một lượt Đúng/Sai.', '◉', 1),
    ('puzzle_master', 'Bậc thầy ghép hình', 'Hoàn thành đủ ba level Ghép hình.', '✦', 2),
    ('quiz_streak_10', 'Chuỗi đúng 10 câu', 'Đạt chuỗi đúng ít nhất 10 câu trong game Đúng/Sai.', '⚡', 3),
    ('all_games', 'Hoàn thành 3 game', 'Có kết quả được đồng bộ ở cả ba game.', '★', 4),
    ('daily_hero', 'Sứ giả mỗi ngày', 'Hoàn thành cả ba nhiệm vụ hằng ngày.', '☀', 5)
on conflict (code) do update set
    title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    display_order = excluded.display_order,
    is_active = true;

-- Backfill thành tựu cho dữ liệu cũ nếu có
insert into user_achievements (user_id, achievement_id)
select earned.user_id, a.id
from (
    select distinct gs.user_id, 'drum_decoder' as code
    from game_sessions gs join games g on g.id = gs.game_id
    where g.code = 'codechayquiz'
    union
    select distinct gs.user_id, 'puzzle_master'
    from game_sessions gs join games g on g.id = gs.game_id
    where g.code = 'puzzle' and coalesce(gs.level_reached, 0) >= 3
      and coalesce((gs.metadata ->> 'completed')::boolean, false)
    union
    select distinct gs.user_id, 'quiz_streak_10'
    from game_sessions gs join games g on g.id = gs.game_id
    where g.code = 'codechayquiz' and gs.best_streak >= 10
    union
    select ugs.user_id, 'all_games'
    from user_game_stats ugs join games g on g.id = ugs.game_id
    where ugs.play_count > 0 and g.code in ('motifhunt', 'puzzle', 'codechayquiz')
    group by ugs.user_id
    having count(distinct g.code) = 3
) earned
join achievements a on a.code = earned.code
on conflict (user_id, achievement_id) do nothing;

-- ==============================================================================
-- 8. BẢNG RAG_INTERACTION_LOGS (Nhật ký hỏi đáp trợ lý ảo RAG)
-- ==============================================================================
create table if not exists rag_interaction_logs (
    interaction_id varchar(36) primary key,
    question_redacted text not null,
    question_hash char(64) not null,
    retrieval_chunks jsonb not null default '[]'::jsonb,
    best_score numeric(12, 6),
    latency_ms integer not null default 0,
    fallback boolean not null default false,
    fallback_reason varchar(100),
    helpful boolean,
    feedback_reason varchar(500),
    created_at timestamptz not null default now(),
    feedback_at timestamptz
);

create index if not exists idx_rag_logs_created_at on rag_interaction_logs (created_at desc);
create index if not exists idx_rag_logs_fallback on rag_interaction_logs (fallback, created_at desc);
create index if not exists idx_rag_logs_helpful on rag_interaction_logs (helpful, created_at desc);

-- ==============================================================================
-- 9. VIEW LEADERBOARD (Bảng xếp hạng tổng hợp)
-- ==============================================================================
create or replace view leaderboard_view as
select
    ugs.game_id,
    g.code as game_code,
    g.name as game_name,
    ugs.user_id,
    u.username,
    u.avatar,
    ugs.best_score,
    ugs.total_score,
    ugs.play_count,
    ugs.best_streak,
    ugs.last_played_at,
    dense_rank() over (
        partition by ugs.game_id
        order by ugs.best_score desc, ugs.total_score desc, ugs.last_played_at asc
    ) as rank
from user_game_stats ugs
join users u on u.id = ugs.user_id
join games g on g.id = ugs.game_id;

-- Đồng bộ lại total_score cho users
update users u
set total_score = coalesce(
    (
        select sum(ugs.best_score)
        from user_game_stats ugs
        where ugs.user_id = u.id
    ),
    0
);

-- ==============================================================================
-- 10. SUPABASE ROW LEVEL SECURITY (RLS)
-- Lưu ý: Backend Flask kết nối trực tiếp qua DATABASE_URL (role postgres)
-- nên luôn có quyền toàn phần ghi/đọc, tự động bỏ qua RLS.
-- Bật RLS giúp ngăn chặn người ngoài dùng Supabase Anon API Key đọc mật khẩu hay làm bẩn dữ liệu.
-- ==============================================================================
alter table users enable row level security;
alter table games enable row level security;
alter table game_levels enable row level security;
alter table game_questions enable row level security;
alter table game_sessions enable row level security;
alter table user_game_stats enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table rag_interaction_logs enable row level security;

-- Cho phép đọc công khai (SELECT) các bảng thông tin mở
drop policy if exists "Allow public read active games" on games;
create policy "Allow public read active games" on games
    for select using (is_active = true);

drop policy if exists "Allow public read active achievements" on achievements;
create policy "Allow public read active achievements" on achievements
    for select using (is_active = true);

drop policy if exists "Allow public read active questions" on game_questions;
create policy "Allow public read active questions" on game_questions
    for select using (is_active = true);
