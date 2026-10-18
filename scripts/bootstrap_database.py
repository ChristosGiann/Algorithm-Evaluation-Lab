"""Use a dedicated direct URL in this process only; runtime can keep pooling."""
import os
from pathlib import Path
import sys
from urllib.parse import urlsplit


def migration_environment(env):
    url = env.get("MIGRATION_DATABASE_URL", "")
    try:
        parts = urlsplit(url)
        if parts.scheme not in {"postgres", "postgresql"} or not parts.hostname or not parts.path.strip("/") or "-pooler" in parts.hostname:
            raise ValueError()
    except ValueError:
        raise ValueError("MIGRATION_DATABASE_URL requires a direct PostgreSQL URL, not a Neon pooled endpoint.") from None
    return {**env, "DATABASE_URL": url}


def main():
    try:
        selected = migration_environment(os.environ)
        os.environ["DATABASE_URL"] = selected["DATABASE_URL"]
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
        import django
        django.setup()
        from django.conf import settings
        from django.core.management import call_command
        if not settings.PRODUCTION:
            raise ValueError("Deployment bootstrap requires production mode.")
        call_command("bootstrap_database")
    except Exception:
        # Do not echo driver/URL exceptions or secrets in provider build logs.
        print("Database bootstrap failed. Check required production settings, direct migration URL and database availability. Startup stopped.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
