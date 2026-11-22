# Offer Modify

Offer 图片与 PDF 脱敏工具。处理时提取文字及位置，自动遮盖可识别的姓名、编号、联系方式、链接和原院校，并添加 PiBridge 水印。PDF 仅处理第一页。

## 网站内部工具

入口：<https://pibridgeedu.cn/mockup/>。登录账号和密码通过 Vercel 环境变量配置，不写入网页或代码：

- `OFFER_MODIFY_USERNAME`
- `OFFER_MODIFY_PASSWORD`

网页一次处理一份 PDF，文件上限 4 MB。处理完成后自动下载带水印 PNG。在线处理需要 PDF 含可提取文字；扫描件可能无法自动识别。工具不会主动将上传文件写入持久存储。请检查下载结果，确认个人信息遮盖完整后再发送或发布。

## 本机工作台

本机工作台支持 PNG、JPEG、WebP 和 PDF；PDF 仅读取第一页。图像识别使用 macOS Vision，PDF 优先读取文字层。工作台可预览遮盖结果、手动补盖，并导出 PNG 与网页字段 JSON。

从项目根目录运行：

```sh
python3.12 -m venv offer-modify/.venv
offer-modify/.venv/bin/pip install -r offer-modify/requirements.txt
offer-modify/.venv/bin/python offer-modify/server.py
```

然后打开 <http://127.0.0.1:4174/>。发布材料前检查遮盖、文字识别及水印效果。网站公开文件由 `scripts/public-files.mjs` 控制；内部上传文件不会自动进入网站案例。
