import base64
import json
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from PIL import Image

from pipeline import inspect_offer, redact, website_data

HERE = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024


def image_url(data):
    return "data:image/png;base64," + base64.b64encode(data).decode("ascii")


@app.get("/")
def index():
    return send_file(HERE / "index.html")


@app.get("/workbench.js")
def script():
    return send_file(HERE / "workbench.js")


@app.post("/inspect")
def inspect():
    try:
        image, fields, masks = inspect_offer(request.files["offer"].read())
        fields = website_data(fields, "offer-redacted.png")
        return jsonify(image=image_url(redact(image, masks)), fields=fields, maskCount=len(masks))
    except (ValueError, OSError, RuntimeError, Image.DecompressionBombError) as error:
        return jsonify(error=str(error)), 400


@app.post("/export")
def export():
    try:
        image, _, automatic = inspect_offer(request.files["offer"].read())
        extra = json.loads(request.form["masks"])
        if not isinstance(extra, list):
            raise ValueError("遮盖区域格式无效")
        fields = website_data(json.loads(request.form["fields"]), "offer-redacted.png")
        return jsonify(image=image_url(redact(image, automatic + extra)), fields=fields)
    except (ValueError, OSError, RuntimeError, Image.DecompressionBombError) as error:
        return jsonify(error=str(error)), 400


@app.after_request
def disable_cache(response):
    response.headers["Cache-Control"] = "no-store"
    return response


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=4174)
