"""Small single-instance service; Render supplies PORT."""
import os

port = os.environ.get("PORT", "10000")
if not port.isascii() or not port.isdecimal() or not 1 <= int(port) <= 65535:
    raise ValueError("PORT must be an integer from 1 to 65535")
bind = "0.0.0.0:" + port
workers = 1
threads = 2
timeout = 60
accesslog = "-"
errorlog = "-"
# Trust forwarding only from the managed Render proxy; platform strips client headers.
forwarded_allow_ips = "*" if os.environ.get("RENDER", "").lower() == "true" else "127.0.0.1,::1"
