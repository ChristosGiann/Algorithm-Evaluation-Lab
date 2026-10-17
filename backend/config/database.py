"""Database selection without logging credentials or silently ignoring invalid URLs."""
from urllib.parse import urlsplit
import dj_database_url
from django.core.exceptions import ImproperlyConfigured


def database_config(base_dir, url):
    if not url:
        return {"ENGINE": "django.db.backends.sqlite3", "NAME": base_dir / "db.sqlite3"}
    try:
        parts = urlsplit(url)
        if parts.scheme not in {"postgres", "postgresql"} or not parts.hostname or not parts.path.strip("/"):
            raise ValueError()
        config = dj_database_url.parse(url, conn_max_age=0, conn_health_checks=True)
        config["DISABLE_SERVER_SIDE_CURSORS"] = True  # Compatible with transaction poolers.
        return config
    except Exception:
        raise ImproperlyConfigured("DATABASE_URL must be a valid PostgreSQL connection URL.") from None
