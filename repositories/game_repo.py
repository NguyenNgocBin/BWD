import dataclasses

import config.db as db


@dataclasses.dataclass
class Game:
    id: int
    code: str
    name: str
    description: str
    is_active: bool


# Chuyen du lieu game tu database thanh doi tuong Game de de xu ly.
def row_to_game(row):
    if not row:
        return None

    return Game(
        id=row["id"],
        code=row["code"],
        name=row["name"],
        description=row["description"],
        is_active=row["is_active"],
    )


# Tim game theo ma code de map payload frontend vao bang games.
def find_game_by_code(code):
    row = db.fetch_one(
        """
        select id, code, name, description, is_active
        from games
        where code = %s
        """,
        (code,),
    )
    return row_to_game(row)
