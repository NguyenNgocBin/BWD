import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from config.db import get_connection
from routes.auth_routes import auth_bp
from routes.game_session_routes import game_session_bp


load_dotenv()

app = Flask(__name__)
CORS(app)

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

    with get_connection() as connection:
        with connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
        connection.commit()


create_database_tables()

app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
app.register_blueprint(game_session_bp, url_prefix="/api/v1/game-sessions")


@app.route("/")
# Endpoint kiem tra nhanh server Flask dang hoat dong.
def home():
    return "Server dang chay"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
