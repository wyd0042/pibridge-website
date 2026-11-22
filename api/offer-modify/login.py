import json
import hmac
import os
import time
from http.server import BaseHTTPRequestHandler

from offer_modify_service import COOKIE_NAME, SESSION_SECONDS, password, session_value, username


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        secret = password()
        if not secret:
            return self.respond(503, {"error": "工具尚未配置访问密码。"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 4096:
                return self.respond(413, {"error": "请求无效。"})
            payload = json.loads(self.rfile.read(length))
            supplied = payload.get("password", "")
        except (ValueError, json.JSONDecodeError):
            return self.respond(400, {"error": "请求无效。"})
        supplied_user = payload.get("username", "")
        if (not isinstance(supplied_user, str) or not isinstance(supplied, str)
                or not hmac.compare_digest(supplied_user, username())
                or not hmac.compare_digest(supplied, secret)):
            return self.respond(401, {"error": "密码不正确。"})
        expiry = str(int(time.time()) + SESSION_SECONDS)
        secure = "; Secure" if os.environ.get("VERCEL") or self.headers.get("X-Forwarded-Proto") == "https" else ""
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Set-Cookie", f"{COOKIE_NAME}={session_value(expiry)}; Path=/api/offer-modify; Max-Age={SESSION_SECONDS}; HttpOnly; SameSite=Strict{secure}")
        self.send_header("Content-Length", "2")
        self.end_headers()
        self.wfile.write(b"{}")

    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
