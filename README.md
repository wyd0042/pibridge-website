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

当前共 53 份材料，按 `assets/published-offers.json` 的记录顺序从左到右连续展示；当前为牛剑、IC、LSE、Berkeley、Columbia、UCL 优先，其余美国院校材料穿插后续项目，不按地区分组。桌面每行四张，手机每行两张；Offer 卡片没有原图链接或放大弹窗。追加材料时添加图片和清单记录，然后运行 `npm run generate`、`npm test` 和 `npm run build`。卡片仅显示学校与项目，不显示录取状态和学年；图片正文保持原样。

MMSC 使用用户最后提供的新截图。UCL 金融科技及爱丁堡人工智能图片的公开副本已通过程序纯色遮盖个人信息；原始上传文件不随站点发布。

CUHK 数学材料的两份相同上传已按文件哈希去重。两份 PolyU 材料的公开副本已用程序遮盖申请人姓名、申请号、参考编号及称呼中的姓名，原图保留。

全部公开 Offer 图片带三行横向 PiBridge 品牌水印，保留原图尺寸，并使用正片叠底保持深色正文清晰。未加水印副本保存在本地忽略目录 `qa/offer-originals/`，不随网站发布。批量处理脚本为 `python3 scripts/watermark-offers.py`，重复运行不会重复叠加；替换 CUHK Math 可加 `--replace-cuhk-math 图片路径`。清单包含原始文件哈希和公开水印副本哈希。

Offer 卡片使用相同图片框高度，学校与项目文字起始线保持一致；长项目名称横向自动换行。2026-11-24 已将检查中发现底角小红书标识的四份材料（LSE Mathematics and Computation、UCL Financial Mathematics、CUHK Mathematics 与 NUS Smart Industries and Digital Transformation）全部替换为用户提供的无该标识新截图，并继续加三行 PiBridge 水印。其余材料和展示顺序保持一致。

本次追加 13 份材料，依上传顺序接在已有 38 份之后。密歇根应用统计材料为院系推荐，杜克两份材料为奖学金通知，清单按原文记录；牛津数学与理论物理材料未显示学年，未推断填写。纽约大学两份材料及 USC 的残留姓名、学号与 NetID 已在公开副本中遮盖。

27 Fall 文字名单保存在 `assets/fall-2027-offers.json`，首页及录取案例页展示学校与项目，重复记录保留，推研逐条标注，不展示学生姓名缩写或照片。

NTU FinTech 的 Digital Financial Services 方向照片已加入现有 NTU 材料旁边；照片墙不再显示材料总数。27 Fall 文字名单中已有该方向，保留原有 20 条记录。

LSE MSc Quantitative Methods for Risk Management 已加入现有 LSE 材料末尾，使用 2024/25 学年的原始录取截图；公开副本遮盖申请人联系地址，并加三行 PiBridge 水印。27 Fall 文字名单保持原有 20 条。
