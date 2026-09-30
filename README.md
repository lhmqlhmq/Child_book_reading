# 给孩子读书

手机优先的家庭荷兰语阅读器，使用 React + Vite + GitHub Pages。示例书是完全自制的占位内容。

## 本地运行

```bash
npm install
npm run dev
```

## 设置家庭密码

仓库只保存 SHA-256 hash，不保存明文。发布前在本地运行：

```bash
npm run set-password -- "你的家庭密码"
```

然后提交 `src/passwordHash.js` 的变化。首次发布前请设置你自己的家庭密码。

## 添加新书

新建 `public/books/<slug>/book.json`、`cover.svg/jpg` 和页面图片，然后把 `{ "slug": "<slug>", "cover": "cover..." }` 加入 `public/books/index.json`。不需要修改 React 代码。

## 家庭 Wi-Fi 本地使用

真实书籍放在 `public/private-books/`，该目录已被 Git 忽略，不会推送到 GitHub。双击根目录的 `开始阅读器.cmd`，电脑会启动本地网站并显示一个家庭 Wi-Fi 地址；手机连接同一个 Wi-Fi 后打开该地址即可。电脑需要保持开机并让启动窗口保持运行。

## GitHub Pages

`.github/workflows/deploy.yml` 会在 `main` 分支推送后自动构建并发布。仓库需要启用 Settings → Pages → Source: GitHub Actions；仓库如果是私有，是否能免费访问取决于 GitHub 账号/计划和组织策略，GitHub 页面会显示最终可用性。GitHub Pages 是静态托管，密码门属于轻量隐私门，不是服务器端 DRM。
