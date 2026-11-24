# PiBridge 派桥留学网站

PiBridge 留学服务网站，使用静态 HTML、CSS 和 JavaScript 构建。正式网址：[https://pibridgeedu.cn](https://pibridgeedu.cn)

## 网站页面

- `index.html`：首页
- `services.html`：申请服务
- `cases.html`：录取案例
- `about.html`：导师团队与品牌介绍
- `service-vip.html`：高端 5v1 服务
- `contact.html`：申请评估与联系

## Offer 脱敏工具

内部工具入口为 `https://pibridgeedu.cn/mockup/`，不显示在网站导航中。页面要求账号密码；Vercel 项目需要设置以下环境变量：

- `OFFER_MODIFY_USERNAME`
- `OFFER_MODIFY_PASSWORD`

每次上传一份不超过 4 MB 的 PDF。工具处理第一页，自动遮盖可识别的个人信息并添加 PiBridge 水印，然后下载 PNG。在线处理要求 PDF 含有可提取文字；扫描件可能无法识别。网站应用不主动保存上传文件。发布前请人工检查下载结果，确认遮盖完整。

## 本地构建

需要 Node.js 24 或更新版本。

```sh
npm ci
npm run generate
npm run build
npm run preview
```

本地预览地址为 `http://127.0.0.1:4173/`。`npm run build` 会清空并重新生成 `dist/`，仅复制公开页面和资源清单中的文件。

## 更新网站内容

- 页面内容和模板：编辑 `scripts/render-pages.mjs`，然后运行 `npm run generate`。
- Offer 和案例资料：编辑 `assets/published-offers.json`。公开前确认授权和脱敏情况。
- 可发布文件清单：编辑 `scripts/public-files.mjs`。
- 共用样式和交互：编辑 `styles.css` 与 `app.js`。
- 图片来源记录：编辑 `assets/sources.json`。

将更改推送到 Vercel 项目配置的部署分支后，Vercel 会重新构建并部署。

## 录取材料维护

当前共 31 份材料，按 `assets/published-offers.json` 的记录顺序从左到右连续展示，不按学校分组。桌面每行四张，手机每行两张；Offer 卡片没有原图链接或放大弹窗。追加材料时添加图片和清单记录，然后运行 `npm run generate`、`npm test` 和 `npm run build`。卡片仅显示学校与项目，不显示录取状态和学年；图片正文保持原样。

MMSC 使用用户最后提供的新截图。UCL 金融科技及爱丁堡人工智能图片的公开副本已通过程序纯色遮盖个人信息；原始上传文件不随站点发布。

CUHK 数学材料的两份相同上传已按文件哈希去重。两份 PolyU 材料的公开副本已用程序遮盖申请人姓名、申请号、参考编号及称呼中的姓名，原图保留。
