import dataclasses

import config.db as db


@dataclasses.dataclass
class User:
    id: int
    username: str
    email: str
    password_hash: str
    avatar: str
    total_score: int
    class_group: str | None


# Chuyen du lieu dang dict tu database thanh doi tuong User de de su dung.
def row_to_user(row):
    if not row:
        return None

    return User(
        id=row["id"],
        username=row["username"],
        email=row["email"],
        password_hash=row["password_hash"],
        avatar=row["avatar"],
        total_score=row["total_score"],
        class_group=row.get("class_group"),
    )


# Tim user theo id de phuc vu xac thuc va lay ho so.
def find_user_by_id(user_id):
    row = db.fetch_one(
        """
        select id, username, email, password_hash, avatar, total_score, class_group
        from users
        where id = %s
        """,
        (user_id,),
    )
    return row_to_user(row)


# Tim user theo email de kiem tra dang nhap va trung lap.
def find_user_by_email(email):
    row = db.fetch_one(
        """
        select id, username, email, password_hash, avatar, total_score, class_group
        from users
        where email = %s
        """,
        (email,),
    )
    return row_to_user(row)


# Tim user theo username de kiem tra trung lap khi dang ky va cap nhat.
def find_user_by_username(username):
    row = db.fetch_one(
        """
        select id, username, email, password_hash, avatar, total_score, class_group
        from users
        where username = %s
        """,
        (username,),
    )
    return row_to_user(row)


# Tao user moi trong bang users va tra ve du lieu vua duoc tao.
def create_user(username, email, password_hash):
    row = db.execute(
        """
        insert into users (username, email, password_hash)
        values (%s, %s, %s)
        returning id, username, email, password_hash, avatar, total_score, class_group
        """,
        (username, email, password_hash),
        fetch_one_result=True,
    )
    return row_to_user(row)


# Cap nhat mat khau moi cho user theo id.
def update_user_password(user_id, password_hash):
    db.execute(
        """
        update users
        set password_hash = %s,
            updated_at = now()
        where id = %s
        """,
        (password_hash, user_id),
    )


# Cap nhat thong tin ho so va tra ve user sau khi luu.
def update_user_profile(user_id, username, email, avatar, class_group=None):
    row = db.execute(
        """
        update users
        set username = %s,
            email = %s,
            avatar = %s,
            class_group = %s,
            updated_at = now()
        where id = %s
        returning id, username, email, password_hash, avatar, total_score, class_group
        """,
        (username, email, avatar, class_group, user_id),
        fetch_one_result=True,
    )
    return row_to_user(row)
