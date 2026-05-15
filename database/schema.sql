-- Bang luu tai khoan nguoi dung.
create table if not exists users (
    id serial primary key,
    username varchar(100) not null unique,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    avatar varchar(255) not null default 'default-avatar.png',
    total_score integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_users_username on users (username);
create index if not exists idx_users_email on users (email);

-- Bang luu danh sach game trong he thong.
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

insert into games (code, name, description, display_order)
values
    (
        'pattern-match',
        'Tim hoa tiet',
        'Nguoi choi nhan dien hoa tiet tren trong dong theo tung cau hoi.',
        1
    ),
    (
        'puzzle',
        'Ghep hinh',
        'Nguoi choi keo tha cac manh ghep de hoan thanh buc tranh trong dong.',
        2
    ),
    (
        'codechayquiz',
        'Quiz dung sai',
        'Nguoi choi tra loi cau hoi kien thuc ve trong dong va van hoa Dong Son.',
        3
    )
on conflict (code) do nothing;

-- Bang luu chuong hoac level cua tung game.
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

-- Bang luu cau hoi cho cac game co noi dung hoi dap.
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

-- Bang luu moi lan nguoi dung choi xong mot game.
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

-- Bang tong hop diem cua moi user theo tung game.
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

-- View lay bang xep hang theo tung game tu bang thong ke.
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

-- Seed level/chapter mac dinh cho cac game hien co.
insert into game_levels (game_id, level_number, title, description, config)
select id, 1, 'Tim hoa tiet', 'Nhan dien cac hoa tiet co ban tren trong dong.', '{"total_questions": 10, "time_per_question": 10}'::jsonb
from games
where code = 'pattern-match'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 1, 'Ghep hinh 2x2', 'Level dau tien cua game ghep hinh.', '{"rows": 2, "cols": 2, "pieces": 4, "max_time": 60}'::jsonb
from games
where code = 'puzzle'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 2, 'Ghep hinh 2x3', 'Level trung binh cua game ghep hinh.', '{"rows": 2, "cols": 3, "pieces": 6, "max_time": 60}'::jsonb
from games
where code = 'puzzle'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 3, 'Ghep hinh 3x3', 'Level kho nhat cua game ghep hinh.', '{"rows": 3, "cols": 3, "pieces": 9, "max_time": 60}'::jsonb
from games
where code = 'puzzle'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 1, 'Nguon goc trong dong', 'Cac cau hoi ve nguon goc va chat lieu cua trong dong.', '{"questions_per_chapter": 5}'::jsonb
from games
where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 2, 'Hoa van va bieu tuong', 'Cac cau hoi ve hoa van quen thuoc tren trong dong.', '{"questions_per_chapter": 5}'::jsonb
from games
where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 3, 'Ky thuat va cau tao', 'Cac cau hoi ve ky thuat duc va cau tao trong dong.', '{"questions_per_chapter": 5}'::jsonb
from games
where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 4, 'Gia tri lich su', 'Cac cau hoi ve gia tri lich su cua trong dong.', '{"questions_per_chapter": 5}'::jsonb
from games
where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

insert into game_levels (game_id, level_number, title, description, config)
select id, 5, 'Bao ton va phat huy', 'Cac cau hoi ve bao ton va phat huy di san.', '{"questions_per_chapter": 5}'::jsonb
from games
where code = 'codechayquiz'
on conflict (game_id, level_number) do nothing;

-- Seed cau hoi mac dinh cho game codechayquiz.
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
        (1, 1, 'Trong dong Dong Son duoc lam chu yeu tu gi?', '[{"key":"A","text":"Sat"},{"key":"B","text":"Dong"}]', 'B'),
        (1, 2, 'Nen van hoa nao gan lien voi trong dong noi tieng o Viet Nam?', '[{"key":"A","text":"Dong Son"},{"key":"B","text":"Oc Eo"}]', 'A'),
        (1, 3, 'Trong dong Dong Son xuat hien manh vao giai doan nao?', '[{"key":"A","text":"So ky do dong"},{"key":"B","text":"Cuoi thoi dai do dong"}]', 'B'),
        (1, 4, 'Khu vuc phat hien nhieu trong dong co la dau?', '[{"key":"A","text":"Bac Bo va Bac Trung Bo"},{"key":"B","text":"Tay Nam Bo"}]', 'A'),
        (1, 5, 'Mot trong cac chuc nang ban dau cua trong dong la gi?', '[{"key":"A","text":"Nghi le cong dong"},{"key":"B","text":"Nau an"}]', 'A'),
        (2, 6, 'Hinh thuong nam o trung tam mat trong la gi?', '[{"key":"A","text":"Ngoi sao nhieu canh"},{"key":"B","text":"Hinh vuong"}]', 'A'),
        (2, 7, 'Chim Lac tren trong dong thuong bieu trung cho dieu gi?', '[{"key":"A","text":"Khat vong va su van dong"},{"key":"B","text":"Su tinh lang"}]', 'A'),
        (2, 8, 'Hoa van vong tron dong tam cho thay dac diem nao?', '[{"key":"A","text":"Tu duy nhip dieu va trat tu"},{"key":"B","text":"Khong co y nghia"}]', 'A'),
        (2, 9, 'Hinh nguoi gia gao tren trong dong phan anh dieu gi?', '[{"key":"A","text":"Sinh hoat lao dong"},{"key":"B","text":"Tro choi dien tu"}]', 'A'),
        (2, 10, 'Bieu tuong thuyen tren mot so trong dong lien quan den gi?', '[{"key":"A","text":"Giao thuong va di chuyen"},{"key":"B","text":"Bay tren troi"}]', 'A'),
        (3, 11, 'Trong dong thuong duoc duc bang ky thuat nao?', '[{"key":"A","text":"Duc khuon"},{"key":"B","text":"In 3D"}]', 'A'),
        (3, 12, 'Mat trong dong thuong co dac diem gi?', '[{"key":"A","text":"Phang, co hoa van"},{"key":"B","text":"Nhieu lo thung"}]', 'A'),
        (3, 13, 'Am thanh trong dong phu thuoc nhieu vao yeu to nao?', '[{"key":"A","text":"Do day va hinh dang than"},{"key":"B","text":"Mau son"}]', 'A'),
        (3, 14, 'Than trong dong thuong gom cac phan co ban nao?', '[{"key":"A","text":"Mat, tang, than, chan"},{"key":"B","text":"Nap, quai, voi"}]', 'A'),
        (3, 15, 'Qua trinh duc trong dong doi hoi dieu gi cao?', '[{"key":"A","text":"Tay nghe thu cong"},{"key":"B","text":"Lap rap vit"}]', 'A'),
        (4, 16, 'Trong dong la tu lieu quy de nghien cuu gi?', '[{"key":"A","text":"Doi song xa hoi co"},{"key":"B","text":"Thiet ke o to"}]', 'A'),
        (4, 17, 'Hinh anh le hoi tren trong dong cho thay dieu gi?', '[{"key":"A","text":"Doi song tinh than phong phu"},{"key":"B","text":"Khong co nghi le"}]', 'A'),
        (4, 18, 'Trong dong the hien trinh do noi bat nao cua cu dan xua?', '[{"key":"A","text":"Luyen kim"},{"key":"B","text":"Lap trinh may tinh"}]', 'A'),
        (4, 19, 'Gia tri cua trong dong trong lich su Viet Nam la gi?', '[{"key":"A","text":"Bieu tuong van hoa lau ben"},{"key":"B","text":"Vat dung hien dai"}]', 'A'),
        (4, 20, 'Trong dong con phan anh moi quan he nao?', '[{"key":"A","text":"Giao luu khu vuc"},{"key":"B","text":"Co lap tuyet doi"}]', 'A'),
        (5, 21, 'Bao ton trong dong can uu tien dieu gi?', '[{"key":"A","text":"Luu giu hien vat dung dieu kien"},{"key":"B","text":"De ngoai troi nang"}]', 'A'),
        (5, 22, 'So hoa trong dong giup ich gi?', '[{"key":"A","text":"Lan toa tri thuc rong rai"},{"key":"B","text":"Lam mat du lieu"}]', 'A'),
        (5, 23, 'Hoat dong phu hop de phat huy gia tri trong dong la gi?', '[{"key":"A","text":"Trien lam giao duc"},{"key":"B","text":"Giau trong kho kin"}]', 'A'),
        (5, 24, 'Nguoi tre co the gop phan bao ton bang cach nao?', '[{"key":"A","text":"Tim hieu va chia se kien thuc dung"},{"key":"B","text":"Lan truyen thong tin sai"}]', 'A'),
        (5, 25, 'Muc tieu cuoi cung cua bao ton di san la gi?', '[{"key":"A","text":"Giu gin va truyen lai cho the he sau"},{"key":"B","text":"Xoa bo dau tich"}]', 'A')
) as q(level_number, display_order, question_text, options, correct_answer) on true
join game_levels l on l.game_id = g.id and l.level_number = q.level_number
where g.code = 'codechayquiz'
on conflict (game_id, display_order) do nothing;
