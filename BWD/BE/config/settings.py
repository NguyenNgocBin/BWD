"""Central application settings loaded from environment variables."""

import os
from dataclasses import dataclass
from typing import Tuple, Union


CorsOrigins = Union[str, Tuple[str, ...]]


def env_bool(name, default=False):
    """Read a strict, predictable boolean from the environment."""

    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _env_port(name="PORT", default=5000):
    try:
        value = int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default
    return value if 1 <= value <= 65535 else default


def _cors_origins():
    raw_value = os.getenv("CORS_ORIGINS", "*").strip()
    if not raw_value or raw_value == "*":
        return "*"
    origins = tuple(item.strip() for item in raw_value.split(",") if item.strip())
    return origins or "*"


@dataclass(frozen=True)
class Settings:
    app_env: str = "development"
    debug: bool = False
    host: str = "127.0.0.1"
    port: int = 5000
    cors_origins: CorsOrigins = "*"


def load_settings():
    app_env = (os.getenv("APP_ENV") or os.getenv("FLASK_ENV") or "development")
    return Settings(
        app_env=app_env.strip().lower(),
        debug=env_bool("APP_DEBUG", default=False),
        host=os.getenv("HOST", "127.0.0.1").strip() or "127.0.0.1",
        port=_env_port(),
        cors_origins=_cors_origins(),
    )
