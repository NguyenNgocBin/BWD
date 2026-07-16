"""Initialize or update the PostgreSQL schema explicitly."""

import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from database.bootstrap import initialize_database


def main():
    initialize_database()
    print("Khởi tạo database thành công.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Khởi tạo database thất bại: {error}", file=sys.stderr)
        raise SystemExit(1)
