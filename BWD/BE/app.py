"""Flask application entrypoint and side-effect-free application factory."""

import dotenv
import flask
import flask_cors

import routes.auth_routes as auth_routes
import routes.chat_routes as chat_routes
import routes.game_session_routes as game_session_routes
import routes.leaderboard_routes as leaderboard_routes
import routes.progression_routes as progression_routes
from config.settings import load_settings


dotenv.load_dotenv()


def create_app(settings=None):
    """Create the HTTP application without connecting to or mutating the database."""

    settings = settings or load_settings()
    application = flask.Flask(__name__)
    application.config.update(
        APP_ENV=settings.app_env,
        DEBUG=settings.debug,
    )
    flask_cors.CORS(application, origins=settings.cors_origins)

    application.register_blueprint(auth_routes.auth_bp, url_prefix="/api/v1/auth")
    application.register_blueprint(chat_routes.chat_bp, url_prefix="/api/v1/chat")
    application.register_blueprint(
        game_session_routes.game_session_bp,
        url_prefix="/api/v1/game-sessions",
    )
    application.register_blueprint(
        progression_routes.progression_bp,
        url_prefix="/api/v1/progression",
    )
    application.register_blueprint(
        leaderboard_routes.leaderboard_bp,
        url_prefix="/api/v1/leaderboard",
    )

    @application.get("/")
    def home():
        return "Server dang chay"

    @application.get("/health")
    def health():
        return flask.jsonify({"status": "ok"}), 200

    return application


# WSGI/Vercel entrypoint. Creating it does not require DATABASE_URL.
app = create_app()


if __name__ == "__main__":
    runtime_settings = load_settings()
    app.run(
        host=runtime_settings.host,
        port=runtime_settings.port,
        debug=runtime_settings.debug,
    )
