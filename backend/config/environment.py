"""Explicit local/production settings; never include secret values in errors."""
import re
from urllib.parse import urlsplit
from django.core.exceptions import ImproperlyConfigured


def environment_config(env):
    mode = env.get("DJANGO_ENV", "development")
    if mode not in {"development", "production"}:
        raise ImproperlyConfigured("DJANGO_ENV must be development or production.")
    production = mode == "production" or env.get("RENDER", "").lower() == "true"
    secret = env.get("DJANGO_SECRET_KEY", "")
    if not secret:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY is required.")
    if production and (len(secret) < 50 or len(set(secret)) < 5 or secret.startswith("django-insecure-") or any(x in secret.lower() for x in ("replace-with", "placeholder", "change-me"))):
        raise ImproperlyConfigured("Production requires a strong generated DJANGO_SECRET_KEY.")
    debug = env.get("DJANGO_DEBUG", "false").lower()
    if debug not in {"true", "false"} or (production and debug == "true"):
        raise ImproperlyConfigured("DJANGO_DEBUG must be false in production and a valid boolean locally.")
    def values(key, default=""):
        return [v.strip() for v in env.get(key, default).split(",") if v.strip()]
    hosts = values("DJANGO_ALLOWED_HOSTS", "" if production else "localhost,127.0.0.1,[::1]")
    if not hosts or any(not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9.-]*|\[::1\]", h) for h in hosts):
        raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS requires explicit hostnames without schemes, ports or wildcards.")
    origins = values("DJANGO_CORS_ALLOWED_ORIGINS", "" if production else "http://localhost:5173,http://127.0.0.1:5173")
    csrf = values("DJANGO_CSRF_TRUSTED_ORIGINS")
    for origin in origins + csrf:
        try:
            parsed = urlsplit(origin)
            valid = parsed.scheme in ({"https"} if production else {"http", "https"}) and parsed.hostname and parsed.netloc and not parsed.username and not parsed.password and not parsed.path and not parsed.query and not parsed.fragment and "*" not in origin
            parsed.port
        except ValueError:
            valid = False
        if not valid:
            raise ImproperlyConfigured("CORS/CSRF origins must be explicit origins; production requires HTTPS.")
    if production and not origins:
        raise ImproperlyConfigured("Production requires DJANGO_CORS_ALLOWED_ORIGINS.")
    if production and not env.get("DATABASE_URL"):
        raise ImproperlyConfigured("Production requires DATABASE_URL; SQLite is local-only.")
    return {
        "PRODUCTION": production, "SECRET_KEY": secret, "DEBUG": debug == "true",
        "ALLOWED_HOSTS": hosts, "CORS_ALLOWED_ORIGINS": origins, "CSRF_TRUSTED_ORIGINS": csrf,
        "SECURE_SSL_REDIRECT": production, "SESSION_COOKIE_SECURE": production, "CSRF_COOKIE_SECURE": production,
        "SECURE_HSTS_SECONDS": 31536000 if production else 0,
        "SECURE_HSTS_INCLUDE_SUBDOMAINS": production, "SECURE_HSTS_PRELOAD": production,
        # Render terminates TLS and supplies the forwarded protocol header.
        "SECURE_PROXY_SSL_HEADER": ("HTTP_X_FORWARDED_PROTO", "https") if production and env.get("RENDER", "").lower() == "true" else None,
    }
