#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
python -c 'from config import settings; assert settings.PRODUCTION, "Production mode is required by the deployment start script"'
python manage.py check --deploy --fail-level WARNING
python manage.py migrate --check
exec python -m gunicorn config.wsgi:application --config gunicorn.conf.py
