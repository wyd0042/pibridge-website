import json
from http.server import BaseHTTPRequestHandler

from offer_modify_service import is_authorized


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({"authenticated": is_authorized(self.headers.get("Cookie"))}).encode()
        self.send_response(200 if is_authorized(self.headers.get("Cookie")) else 401)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
