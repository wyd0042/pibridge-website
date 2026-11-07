# PiBridge 留学工作室官网视觉样稿

原生 HTML / CSS / JavaScript 双页网站，无后台、数据库、上传或实际咨询表单。

- 首页：`index.html`
- 案例：`cases.html`
- Offer 墙：`cases.html#offers`
- 地区筛选示例：`cases.html?region=us#admissions`

## 本地预览与检查

需要 Node.js 24+ 和 Python 3。

```sh
npm ci
npm test
npm run build
npm run preview
```

打开 `http://127.0.0.1:4173`。不要通过 `file://` 打开：网站使用 JavaScript ES modules。

`npm test` 检查案例筛选、详情到大图的切换、二维码、关闭与焦点恢复、手机菜单，以及项目子路径下的链接和图片。DOM 测试不替代浏览器视觉验收。

## 替换 Logo、文案及 Offer

1. **Logo**：替换 `assets/brand/logo.png`，保持宽高比例；必要时更新 `app.js` 内图片尺寸及 `styles.css` 的 `.brand` 宽度。二维码位于 `assets/brand/wechat-qr.png`，保留完整二维码和白边。
2. **文案**：首页正文在 `index.html`，案例页正文在 `cases.html`；导航、咨询区和页脚在 `app.js`；颜色与间距在 `styles.css` 顶部。
3. **案例**：编辑 `cases-data.js`。每条记录包括 `id`、`region`、`school`、`programme`、`title`、`background`、`tags`、`image`、`summary`、`demo` 和 `placeholder`。地区值为 `uk/us/au/ca/hk/sg`。批量占位由 `Array.from` 生成，可将对应展示位改写为独立对象，并相应减少生成数量。
4. **Offer 图片**：放入 `assets/offers/`，更新案例的 `image` 相对路径，并在 `scripts/build.mjs` 的 `publicFiles` 中加入该文件。构建只复制该清单，不会自动发布整个文件夹。
5. **真实材料发布**：先确认授权和脱敏，再以事实替换背景、成绩与说明；仅对已确认的案例设置 `demo: false`、`placeholder: false`。MIT 与中性样稿持续作为演示使用。顶部视觉样稿提示在正式上线前应一并审核。

案例卡、详情和 Offer 墙共用数据。初始提供 20 个案例位、22 个 Offer 位，与参考案例页保持展示密度；这些数量不是服务或录取业绩。额外两个 Offer 位仅为待替换排版展示位。

## 素材来源与公开范围

- 视觉布局参考：<https://xzcoffer.cn/>、<https://xzcoffer.cn/cases.html#offers>。重新实现布局与样式；未使用参考站的学生资料、Offer、评价、数字或联系方式。
- Logo 来自已有 PiBridge `header.png`，裁切区域 `[75,55,720,210]`。
- 官方微信二维码来自已有 `cta-footer.png`，裁切区域 `[375,225,705,555]`，保留白边与品牌蓝色边角。
- `demo-offer.png` 是已有明确标记的示例材料。
- `mit-demo.jpg` 复制自已获准公开的 `samples/mit/offer.jpg`，字节不变，保留既有脱敏和水印。清华大学、GPA 3.8、雅思 8.0 均为原模板演示设定。
- `placeholder.svg` 为本站自行制作的明确标记展示位；品牌 Hero 使用 HTML/CSS 排版，无外部图库依赖。

原始品牌长图、私人 Offer、学生资料、模板工作台、绝对本地路径、配置中的嵌入图片及凭据不进入构建。模板目录保持只读。

## GitHub Pages

GitHub Actions 在 `main` 推送后运行测试，以白名单构建 `dist/`，再发布该目录。源码和 README 不会出现在网站构建中。所有页面、脚本及资源使用相对路径，支持 `/pibridge-website/` 项目路径。

- 仓库：<https://github.com/wyd0042/pibridge-website>
- 预览：<https://wyd0042.github.io/pibridge-website/>

首次启用时，在仓库 Settings → Pages 中选择 GitHub Actions。后续编辑、提交并推送 `main` 即可自动更新。

## 视觉验收

验收尺寸为 1440px 和 390px；检查两页、六个地区筛选、案例详情、大图滚动、弹窗关闭、二维码、手机菜单及演示标签。390px 的 Offer 墙使用单列完整图片，桌面使用四列。

本次运行的浏览器连接不可用，未生成桌面或手机截图，实际浏览器视觉和扫码验收仍待补齐。自动化 DOM 测试及线上 HTTP 资源检查的结果将在交付时单独说明。
