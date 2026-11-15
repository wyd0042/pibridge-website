import argparse
import io
import json
import math
import re
from datetime import datetime
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageOps

FIELDS = (
    "originalSchool", "originalProgramme", "school", "programme",
    "offerDate", "intake", "offerType",
)
MAX_SIDE = 1800
WORDMARK = Path(__file__).resolve().parents[1] / "assets" / "brand" / "wordmark.png"


def png(image):
    data = io.BytesIO()
    # Copy only pixel data. Discard document and camera metadata.
    clean = Image.new("RGB", image.size)
    clean.paste(image)
    clean.save(data, format="PNG")
    return data.getvalue()


def load_offer(data):
    if data.startswith(b"%PDF-"):
        with pymupdf.open(stream=data, filetype="pdf") as document:
            if not len(document):
                raise ValueError("PDF 没有页面")
            page = document[0]
            scale = MAX_SIDE / max(page.rect.width, page.rect.height)
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)

            def normalize(rect):
                rect = pymupdf.Rect(rect) * page.rotation_matrix
                return [rect.x0 / page.rect.width, rect.y0 / page.rect.height,
                        rect.x1 / page.rect.width, rect.y1 / page.rect.height]

            lines = []
            for block in page.get_text("dict", flags=pymupdf.TEXTFLAGS_DICT & ~pymupdf.TEXT_PRESERVE_IMAGES)["blocks"]:
                for line in block.get("lines", []):
                    text = "".join(span["text"] for span in line["spans"]).strip()
                    if text:
                        lines.append((text, normalize(line["bbox"])))
            links = [normalize(link["from"]) for link in page.get_links()]
            return image, lines, links
    with Image.open(io.BytesIO(data), formats=["PNG", "JPEG", "WEBP"]) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail((MAX_SIDE, MAX_SIDE))
        return image, [], []


def read_image(image):
    warning = "图片 OCR 不可用，请手动填写字段。自动图片识别使用 macOS Vision。"
    try:
        from Foundation import NSData
        from Vision import (
            VNImageRequestHandler, VNRecognizeTextRequest, VNRequestTextRecognitionLevelAccurate,
        )
    except ImportError:
        return [], warning
    data = png(image)
    request = VNRecognizeTextRequest.alloc().init()
    request.setRecognitionLevel_(VNRequestTextRecognitionLevelAccurate)
    request.setRecognitionLanguages_(["en-US", "zh-Hans", "zh-Hant"])
    handler = VNImageRequestHandler.alloc().initWithData_options_(
        NSData.dataWithBytes_length_(data, len(data)), {}
    )
    success, _ = handler.performRequests_error_([request], None)
    if not success:
        return [], warning
    lines = []
    for observation in request.results() or []:
        candidates = observation.topCandidates_(1)
        if candidates:
            bounds = observation.boundingBox()
            x, y = bounds.origin
            w, h = bounds.size
            lines.append((str(candidates[0].string()), [x, 1 - y - h, x + w, 1 - y]))
    return lines, "" if lines else "未识别到文字，无法自动打码。"


def extract(text):
    line_text = " ".join(text.split())
    patterns = {
        "originalSchool": [
            r"(?:原院校|本科院校|毕业院校)[ \t]*[:：][ \t]*([^\n]+)",
            r"(?:Previous|Original|Undergraduate) (?:School|Institution|University)\s*[:：]\s*([^\n]+)",
        ],
        "originalProgramme": [r"(?:Bachelor['’]s Degree|Bachelor of [\w ]+?) in (.{2,90}?) (?:at|from) "],
        "school": [
            r"(?:录取院校|目标院校)[ \t]*[:：][ \t]*([^\n]+)",
            r"(?:Target|Admitting) (?:School|Institution|University)\s*[:：]\s*([^\n]+)",
        ],
        "programme": [
            r"(?:录取项目|录取专业)[ \t]*[:：][ \t]*([^\n]+)",
            r"(?:Programme(?: Name)?|Program(?: Name)?)\s*[:：]\s*([^\n]+)",
            r"^(Master of [^\n]{2,120})$",
        ],
        "offerDate": [
            r"(?:发函日期|录取日期)[ \t]*[:：][ \t]*([^\n]+)",
            r"(?:Offer Date|Date of (?:Offer|Issue)|Issued on)\s*[:：]?\s*([^\n]+)",
        ],
        "intake": [r"(?:commencing|starting|beginning) in ([A-Za-z]+ \d{4})"],
        "offerType": [r"\b((?:UN)?CONDITIONAL) OFFER OF ADMISSION\b"],
    }
    values = dict.fromkeys(FIELDS)
    for field, options in patterns.items():
        for pattern in options:
            source = line_text if field in {"originalProgramme", "intake", "offerType"} else text
            match = re.search(pattern, source, re.I | re.M)
            if match:
                values[field] = match[1].strip()
                break
    hku = re.search(r"^\s*The University of Hong Kong\s*$", text, re.I | re.M)
    if hku:
        values["school"] = "香港大学"
        if not values["offerDate"]:
            header = re.split(r"OFFER OF ADMISSION", text, maxsplit=1, flags=re.I)[0]
            date = re.search(r"^\s*([A-Za-z]+ \d{1,2}, \d{4})\s*$", header, re.M)
            values["offerDate"] = date[1] if date else None
    if not values["originalSchool"]:
        institution = re.search(
            r"\bBachelor['’]s Degree in .{2,90}? (?:at|from) "
            r"((?:[\w’'-]+ ){0,12}(?:University|College|Institute|Polytechnic)"
            r"(?: of (?:[A-Z][\w’'-]* ){0,4}[A-Z][\w’'-]*)?)\b",
            line_text,
        )
        if institution:
            values["originalSchool"] = institution[1]
    if re.search(r"Bachelor['’]s Degree in .{2,90}? at Sun Yat-sen University", line_text, re.I):
        values["originalSchool"] = "中山大学"
    if values["offerDate"]:
        raw_date = values["offerDate"].replace("年", "-").replace("月", "-").removesuffix("日")
        values["offerDate"] = None
        for pattern in ("%B %d, %Y", "%d %B %Y", "%Y-%m-%d"):
            try:
                values["offerDate"] = datetime.strptime(raw_date, pattern).date().isoformat()
                break
            except ValueError:
                continue
    if values["intake"]:
        try:
            values["intake"] = datetime.strptime(values["intake"], "%B %Y").strftime("%Y-%m")
        except ValueError:
            values["intake"] = None
    if values["offerType"]:
        values["offerType"] = {"conditional": "有条件录取", "unconditional": "无条件录取"}[
            values["offerType"].lower()
        ]
    return values


SENSITIVE_LINE = re.compile(
    r"@|https?\s*[:：]|\bwww\.|\b(?:[\w-]+\.)+(?:edu|ac|com|org|net|hk|cn|uk)(?=[/\s.,)]|$)"
    r"|\b\d{6,}\b|(?<!\w)\+?\d[\d .()-]{7,}\d(?!\w)|\b(?:Dear|Mr\.?|Mrs\.?|Ms\.?|Miss)\s+"
    r"|\b(?:name|e-?mail|address|phone|mobile|telephone|passport|date of birth|"
    r"(?:application|applicant|student|candidate|reference|registration|identity|offer|case)"
    r"\s*(?:number|no\.?|id|ref(?:erence)?)|ref\.?\s*(?:no\.?|[:：]))\b"
    r"|\b(?:reference|ref\.?|id|no\.?)\s*[:：#]\s*[A-Z0-9]|姓名|申请人|申请编号|申请号码|学号|证件|护照|地址|邮编|邮箱|電子郵件|电话|電話|出生日期"
    r"|(?:原|本科|毕业|畢業)(?:院校|学校|學校|專業|专业)"
    r"|\b(?:previous|original|undergraduate|home)\s+(?:school|institution|university)\b",
    re.I,
)
PREVIOUS_DEGREE = re.compile(
    r"\b(?:your|obtaining|completed?|awarded|holding|hold)\b.{0,140}"
    r"\b(?:bachelor['’]s|undergraduate degree|bachelor of)\b|Sun\s+Yat[ -]sen|中山大学|中山大學",
    re.I,
)


def automatic_masks(lines, fields, links):
    masks = list(links)
    ordered = sorted(lines, key=lambda item: (item[1][1], item[1][0]))
    greeting = next(
        (re.match(r"Dear\s+(?:(?:Mr|Mrs|Ms|Dr)\.?\s+)?([\w'’ -]+)", line, re.I)
         for line, _ in ordered if re.match(r"Dear\s+", line, re.I)), None,
    )
    recipient = greeting[1].strip() if greeting else ""
    if recipient.lower() in {"applicant", "candidate", "student", "sir", "madam"}:
        recipient = ""
    school = fields["originalSchool"]
    track_rows = []
    for line, box in ordered:
        recipient_match = recipient and re.search(r"(?<!\w)" + re.escape(recipient) + r"(?!\w)", line, re.I)
        if SENSITIVE_LINE.search(line) or recipient_match or (school and school.casefold() in line.casefold()):
            masks.append(box)
        if PREVIOUS_DEGREE.search(line):
            track_rows.append(box)
            masks.append(box)
    # A prior-degree condition can wrap the institution or qualification onto the next line.
    for previous in track_rows:
        for line, box in ordered:
            if 0 < box[1] - previous[1] <= max(0.025, (previous[3] - previous[1]) * 1.5):
                if re.search(r"university|college|degree|school|institute|大学|大學|学位|學位|\bYat[ -]sen\b", line, re.I):
                    masks.append(box)
    # Formal offer letters often put an unlabelled recipient block between the date and heading.
    title = next((box for line, box in ordered if re.match(r"(?:(?:un)?conditional\s+)?offer of admission\b", line, re.I)), None)
    if title:
        header_date = next((box for line, box in reversed(ordered)
                            if box[3] < title[1] and re.fullmatch(r"[A-Za-z]+ \d{1,2}, \d{4}", line)), None)
        if header_date:
            masks.extend(box for _, box in ordered if header_date[3] < box[1] < title[1])
    return [list(box) for box in dict.fromkeys(
        (max(0, x1 - .005), max(0, y1 - .003), min(1, x2 + .005), min(1, y2 + .003))
        for x1, y1, x2, y2 in masks if 0 <= x1 < x2 <= 1 and 0 <= y1 < y2 <= 1
    )]


def inspect_offer(data):
    image, lines, links = load_offer(data)
    if not lines:
        lines, warning = read_image(image)
        if not lines:
            raise ValueError(warning)
    fields = extract("\n".join(text for text, _ in lines))
    return image, fields, automatic_masks(lines, fields, links)


def add_watermark(image):
    width, height = image.size
    with Image.open(WORDMARK) as source:
        mark = source.convert("RGB")
    mark.thumbnail((max(1, round(width * .30)), max(1, round(height * .18))))
    white = Image.new("RGB", mark.size, "white")
    mark = Image.blend(white, mark, .16).rotate(22, Image.Resampling.BICUBIC, expand=True, fillcolor="white")
    pattern = Image.new("RGB", image.size, "white")
    for row, y in enumerate((.18, .40, .62, .84)):
        columns = (.25, .69) if row % 2 == 0 else (.34, .78)
        for x in columns:
            pattern.paste(mark, (round(x * width - mark.width / 2), round(y * height - mark.height / 2)))
    return ImageChops.multiply(image, pattern)


def redact(image, masks):
    width, height = image.size
    if not isinstance(masks, list) or len(masks) > 1000:
        raise ValueError("遮盖区域格式无效")
    result = image.copy()
    draw = ImageDraw.Draw(result)
    for coords in masks:
        if not isinstance(coords, list) or len(coords) != 4 or any(type(n) not in (int, float) for n in coords):
            raise ValueError("区域需要四个数值坐标")
        x1, y1, x2, y2 = coords
        if not (0 <= x1 < x2 <= 1 and 0 <= y1 < y2 <= 1):
            raise ValueError("区域坐标无效")
        left, top = math.floor(x1 * width), math.floor(y1 * height)
        right, bottom = math.ceil(x2 * width), math.ceil(y2 * height)
        draw.rectangle((left, top, right - 1, bottom - 1), fill="#0b3d65")
    return png(add_watermark(result))


def website_data(fields, image):
    if not isinstance(fields, dict):
        raise ValueError("展示字段格式无效")
    output = {}
    for field in FIELDS:
        value = fields.get(field)
        if value is not None and (not isinstance(value, str) or len(value) > 180):
            raise ValueError(f"展示字段格式无效：{field}")
        output[field] = (value.strip() or None) if value else None
    output["offers"] = [{"image": image, "caption": " · ".join(
        value for value in (output["school"], output["programme"], "Offer") if value
    )}]
    return output


def main():
    parser = argparse.ArgumentParser(description="Offer Modify")
    parser.add_argument("input", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    image, extracted, masks = inspect_offer(args.input.read_bytes())
    image_bytes = redact(image, masks)
    fields = website_data(extracted, "offer-redacted.png")
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "offer-redacted.png").write_bytes(image_bytes)
    (args.out / "offer.json").write_text(json.dumps(fields, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
