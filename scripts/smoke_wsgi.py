"""Linux CI smoke: start the exact production entrypoint against disposable DB."""
import json
import os
from pathlib import Path
import signal
import subprocess
import time
from urllib.error import URLError
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parents[1]
env = {**os.environ, "PORT": "18080"}
process = subprocess.Popen(["bash", "scripts/start-backend.sh"], cwd=root, env=env, start_new_session=True)
try:
    deadline = time.monotonic() + 30
    while True:
        if process.poll() is not None:
            raise RuntimeError("Production server exited before becoming healthy")
        try:
            request = Request("http://127.0.0.1:18080/api/health/", headers={"X-Forwarded-Proto": "https"})
            with urlopen(request, timeout=2) as response:
                assert response.status == 200
                assert json.load(response) == {"status": "ok"}
                break
        except URLError:
            if time.monotonic() >= deadline:
                raise RuntimeError("Production health check timed out") from None
            time.sleep(0.25)
    with urlopen(Request("http://127.0.0.1:18080/static/admin/css/base.css", headers={"X-Forwarded-Proto": "https"}), timeout=5) as response:
        assert response.status == 200 and "text/css" in response.headers["Content-Type"]
    with urlopen(Request("http://127.0.0.1:18080/api/algorithms/", headers={"X-Forwarded-Proto": "https"}), timeout=5) as response:
        catalogue = json.load(response)
        assert len(catalogue) == 5 and len({row["slug"] for row in catalogue}) == 5
    print("Production Gunicorn health and static-file smoke passed")
finally:
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait(timeout=5)
