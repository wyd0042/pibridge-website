import json
from http.server import BaseHTTPRequestHandler

from offer_modify_service import is_authorized, process_pdf


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not is_authorized(self.headers.get("Cookie")):
            return self.respond(401, {"error": "访问已过期，请重新输入密码。"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 4_500_000:
                return self.respond(413, {"error": "文件不能超过 4 MB。"})
            png, _mask_count = process_pdf(self.headers.get("Content-Type", ""), self.rfile.read(length))
        except ValueError as error:
            return self.respond(400, {"error": str(error)})
        except Exception:
            return self.respond(400, {"error": "无法读取此 PDF。请确认它包含可提取文字，或换一份文件重试。"})
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Disposition", "attachment; filename=offer-redacted.png")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(png)))
        self.end_headers()
        self.wfile.write(png)

    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
