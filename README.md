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

## 添加并发布家庭新书

家庭书籍必须写入 `public/private-books/<slug>/`，并在 `public/private-books/index.json` 注册。书籍目录至少包含：

```text
public/private-books/<slug>/
  book.json
  cover.jpg
  page-001.jpg
  page-002.jpg
  ...
```

`book.json` 使用 `titleZh`、`titleNl`、`cover` 和 `pages[].paragraphs[]` 字段；每个段落包含 `nl` 和 `zh`。新增书不需要修改 React 代码，但必须更新索引并验证 LAN 书架显示新书。

完整的 PDF/照片处理、索引、验证和旧测试书处理规则见项目根目录 `AGENTS.md`。

公共/演示书才放入 `public/books/<slug>/` 并更新 `public/books/index.json`。不要把家庭扫描件、私有页面图片或私有翻译放入 `public/books/`。

## 家庭 Wi-Fi 本地使用

真实书籍放在 `public/private-books/`，该目录已被 Git 忽略，不会推送到 GitHub。双击根目录的 `开始阅读器.cmd`，电脑会启动本地网站并显示一个家庭 Wi-Fi 地址；手机连接同一个 Wi-Fi 后打开该地址即可。电脑需要保持开机并让启动窗口保持运行。

## GitHub Pages

`.github/workflows/deploy.yml` 会在 `main` 分支推送后自动构建并发布。仓库需要启用 Settings → Pages → Source: GitHub Actions；仓库如果是私有，是否能免费访问取决于 GitHub 账号/计划和组织策略，GitHub 页面会显示最终可用性。GitHub Pages 是静态托管，密码门属于轻量隐私门，不是服务器端 DRM。
