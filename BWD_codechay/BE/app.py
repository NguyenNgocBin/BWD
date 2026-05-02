import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from config.db import db
from routes.auth_routes import auth_bp


load_dotenv()

app = Flask(__name__)
CORS(app)

database_url = os.getenv("DATABASE_URL")
if database_url:
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()

app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")


@app.route("/")
def home():
    return "Server dang chay"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
