# PiBridge 派桥留学官网视觉样稿

原生 HTML、CSS、JavaScript 静态站点。按参考站恢复完整页面结构、照片轮播、团队、案例、流程、资讯和基础演示交互，无后台或个人资料收集。

- 在线预览：<https://wyd0042.github.io/pibridge-website/>
- GitHub：<https://github.com/wyd0042/pibridge-website>
- 视觉及公开演示素材参考：<https://xzcoffer.cn/index.html>

## 页面清单

| 页面 | 路径 | 主要内容区块数 |
| --- | --- | --- |
| 首页 | `index.html` | 13 |
| 高端 5v1 VIP | `service-vip.html` | 7 |
| 关于我们 | `about.html` | 7 |
| 服务流程 | `services.html` | 4 |
| 品牌口碑与案例 | `cases.html` | 6 |
| 联系我们 | `contact.html` | 4 |
| 留学资讯 | `news.html` | 2 |
| 排名主题资讯 | `article-ranking.html` | 3 |
| 文书主题资讯 | `article-sop.html` | 3 |
| 签证主题资讯 | `article-visa.html` | 3 |

页面使用原站对应路径及锚点。案例页支持 `#admissions`、`#offers`、`#reviews`、`#rankings` 和 `#case-1` 至 `#case-20`。筛选示例：`cases.html?region=us&degree=phd#admissions`。

## 内容性质

所有页面顶部明确标识为视觉样稿。参考站的 20 个案例、22 份 Offer、人物照片、历程、数字和服务方案仅作为演示，不代表派桥的真实团队、服务承诺、录取或发展记录。评价使用演示改写；三篇资讯为同主题演示摘要，并链接原文。

联系入口只使用已有 PiBridge 微信二维码。原站电话、邮箱、地址、二维码、备案号和咨询收件接口均未迁入。申请与订阅表单只演示浏览器校验：不发邮件，不发网络请求，不写浏览器存储，演示完成后清空输入。

## 本地运行

需要 Node.js 24+ 和 Python 3。

```sh
npm ci
npm run generate
npm test
npm run build
npm run preview
```

打开 `http://127.0.0.1:4173`。网站使用 ES modules，请通过 HTTP 预览。

## 如何修改

派桥专属内容可填写本地文件 `派桥官网专属内容清单.md`，分为 Slogan、案例和合作老师三类。该工作文件已加入 Git 忽略清单，不会随网站公开发布。

- **页面内容、共用导航、页脚及模板**：编辑 `scripts/render-pages.mjs` 后运行 `npm run generate`。根目录的 10 个 HTML 是可直接托管的生成结果；测试会检查它们和模板一致。
- **案例与 Offer**：编辑 `cases-data.js`。字段包括院校、专业、背景、成绩、地区、学位、参考来源及图片数组。替换事实资料前确认授权和脱敏，并同步修改演示说明。地区为 `hk/uk/us/ca/au/eu`，其中 `hk` 为港新、`au` 为澳新；学位为 `master/phd`。
- **Logo**：`assets/brand/wordmark.png` 只含 PiBridge 英文标志；中文“派桥留学”通过模板中的 `.brand` 文字显示。样式保持 `height:auto` 和原图比例，避免旧版固定高度造成拉伸。
- **二维码**：替换 `assets/brand/wechat-qr.png`，保留完整图案及白边。
- **配色和响应式**：编辑 `styles.css`；颜色变量位于文件顶部。当前使用 PiBridge 原模板的蓝白方案：品牌主蓝 `#1F8DE4`、浅蓝分区与白色卡片；文字按钮使用较深蓝保证可读性。
- **交互**：`app.js` 包含轮播、菜单、案例抽屉、大图、筛选、排序、弹窗和表单演示逻辑。
- **公开图片清单**：参考图片登记在 `assets/sources.json`，包括来源 URL 和 SHA-256。增加或替换后更新记录；构建清单在 `scripts/public-files.mjs`。不会自动复制整个项目或素材目录。

## 素材与发布范围

PiBridge 英文标志从原有公开品牌 Logo 裁出，二维码沿用已有品牌素材。原始模板目录没有修改。参考照片和 Offer 从用户指定参考站公开页面获取，图片内容与水印保持不变，来源记录在 `assets/sources.json`。旧版 MIT 和中性演示图片不用于新版；原素材仍保存在只读模板目录。

构建只发布 10 页、共用 CSS/JavaScript、3 份品牌资源和 46 张登记的参考图片，共 62 个文件。模板生成器、测试、README、来源登记、原始参考 HTML、私人素材及凭据不进入站点构建。

GitHub Actions 在推送 `main` 后运行测试并发布 `dist/`。所有内部页面及静态资源使用相对路径，兼容 GitHub Pages 的 `/pibridge-website/` 子路径。

## 验证记录

8 项自动化测试覆盖：10 页内容完整性、品牌文字、链接与锚点、素材清单和哈希、地区与学位组合筛选、空结果、案例直达、嵌套大图、关闭与焦点恢复、轮播与暂停、手机菜单、滚动导航、排名排序、演示表单及无网络/存储行为。

图片解码已检查。DOM 测试不替代浏览器布局验证。本次运行浏览器连接仍不可用，1440px 和 390px 的逐页截图、实际渲染、手势及扫码检查尚未完成，不能据此声称达到逐像素一致。

## Offer Modify

本机 Offer 脱敏与字段提取工具支持图片和 PDF。启动和样例说明见 [Offer Modify](offer-modify/README.md)。
