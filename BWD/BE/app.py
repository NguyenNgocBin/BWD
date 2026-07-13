import os

import dotenv
import flask
import flask_cors

import config.db as db
import routes.auth_routes as auth_routes
import routes.chat_routes as chat_routes
import routes.game_session_routes as game_session_routes
import routes.leaderboard_routes as leaderboard_routes
import routes.progression_routes as progression_routes


dotenv.load_dotenv()

app = flask.Flask(__name__)
flask_cors.CORS(app)

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL chua duoc cau hinh trong file .env")


# Doc file schema.sql va tao cac bang can thiet khi app khoi dong.
def create_database_tables():
    schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")

    with open(schema_path, "r", encoding="utf-8") as file:
        sql_script = file.read()

    statements = [
        statement.strip()
        for statement in sql_script.split(";")
        if statement.strip()
    ]

    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
        connection.commit()


create_database_tables()

app.register_blueprint(auth_routes.auth_bp, url_prefix="/api/v1/auth")
app.register_blueprint(chat_routes.chat_bp, url_prefix="/api/v1/chat")
app.register_blueprint(
    game_session_routes.game_session_bp,
    url_prefix="/api/v1/game-sessions",
)
app.register_blueprint(
    progression_routes.progression_bp,
    url_prefix="/api/v1/progression",
)
app.register_blueprint(
    leaderboard_routes.leaderboard_bp,
    url_prefix="/api/v1/leaderboard",
)


@app.route("/")
# Endpoint kiem tra nhanh server Flask dang hoat dong.
def home():
    return "Server dang chay"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
