# Offer Modify

在本机处理 PNG、JPEG、WebP 或 PDF。PDF 只读取第一页。工作台识别文字和位置，自动覆盖姓名、编号、联系方式、链接和原院校等信息。PDF 优先使用文本层，扫描件和图片使用 macOS Vision OCR。其余版面保留，并加上 PiBridge 水印。

## 启动

在官网仓库根目录用 Python 3.12 运行：

```sh
python3.12 -m venv offer-modify/.venv
offer-modify/.venv/bin/pip install -r offer-modify/requirements.txt
offer-modify/.venv/bin/python offer-modify/server.py
```

访问 <http://127.0.0.1:4174/> 并上传文件，点击「自动打码」即可预览和下载。发布前请核对自动结果，尤其是未标注的姓名、图片内的标识和 OCR 识别错误。发现遗漏可以拖框补盖，再点击「更新下载文件」。

PNG 的马赛克区域由不透明色块覆盖。JSON 保留独立的、可编辑的网页展示字段，包括原院校和原专业。接入官网时，更新 `offers[0].image` 为公开资产路径，核对并挑选案例字段，并将准备公开的图片加入 `scripts/public-files.mjs` 的允许列表。

## HKU CS 样例

```sh
offer-modify/.venv/bin/python offer-modify/pipeline.py \
  "/Users/markwong/Desktop/宣传材料/HKU CS offer.pdf" \
  --out offer-modify/output/hku-cs
```

打码使用深蓝实色。水印使用官网页眉的 PiBridge 字标和蓝色拱桥图案。
