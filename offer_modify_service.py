import hashlib
import hmac
import json
import os
import time
from email import policy
from email.parser import BytesParser
from http import cookies

from PIL import Image
from offer_modify.pipeline import inspect_offer, redact

MAX_FILE_BYTES = 4 * 1024 * 1024
COOKIE_NAME = "pibridge_offer_session"
SESSION_SECONDS = 8 * 60 * 60


def password():
    return os.environ.get("OFFER_MODIFY_PASSWORD", "")


def username():
    return os.environ.get("OFFER_MODIFY_USERNAME", "")


def session_value(expiry):
    secret = f"{username()}:{password()}".encode("utf-8")
    signature = hmac.new(secret, f"offer-modify:{expiry}".encode(), hashlib.sha256).hexdigest()
    return f"{expiry}.{signature}"


def is_authorized(cookie_header):
    secret = password()
    if not secret:
        return False
    jar = cookies.SimpleCookie()
    try:
        jar.load(cookie_header or "")
        raw = jar[COOKIE_NAME].value
        expiry, signature = raw.split(".", 1)
        if int(expiry) < int(time.time()):
            return False
        return hmac.compare_digest(signature, session_value(expiry).split(".", 1)[1])
    except (KeyError, ValueError, cookies.CookieError):
        return False


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


def parse_upload(content_type, body):
    headers = f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("ascii")
    message = BytesParser(policy=policy.default).parsebytes(headers + body)
    if not message.is_multipart():
        raise ValueError("请上传 PDF 文件。")
    for part in message.iter_parts():
        if part.get_param("name", header="content-disposition") == "offer":
            payload = part.get_payload(decode=True) or b""
            filename = part.get_filename() or "offer.pdf"
            if len(payload) > MAX_FILE_BYTES:
                raise ValueError("文件不能超过 4 MB。")
            if not filename.lower().endswith(".pdf") or not payload.startswith(b"%PDF-"):
                raise ValueError("请选择有效的 PDF 文件。")
            return payload
    raise ValueError("没有收到 PDF 文件。")


def process_pdf(content_type, body):
    data = parse_upload(content_type, body)
    image, _, masks = inspect_offer(data)
    for side in (1800, 1500, 1200, 900):
        output = image.copy()
        output.thumbnail((side, side))
        png = redact(output, masks)
        if len(png) <= 4_300_000:
            return png, len(masks)
    raise ValueError("生成图片过大，请换一份文件重试。")
