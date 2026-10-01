# 给孩子读书

手机优先的家庭荷兰语阅读器，使用 React + Vite，在电脑本地运行。

## 本地运行

```bash
npm install
npm run dev
```

## 添加家庭新书

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

## 家庭 Wi-Fi 本地使用

真实书籍放在 `public/private-books/`，该目录已被 Git 忽略，不会推送到 GitHub。双击根目录的 `开始阅读器.cmd`，电脑会启动本地网站并显示一个家庭 Wi-Fi 地址；手机连接同一个 Wi-Fi 后打开该地址即可。电脑需要保持开机并让启动窗口保持运行。

项目也已配置 Windows 后台任务 `Child Reading Local Server`：登录电脑时自动启动，并每天 18:45 再检查一次。这样通常不需要手动打开阅读器，晚上使用时直接用手机访问即可。电脑关机或睡眠时，手机仍然无法访问。

## GitHub 仓库的用途

GitHub 只用于保存程序代码和版本备份。家庭书籍位于被 Git 忽略的本地目录，不会上传。当前不使用 GitHub Pages，也不需要配置公开网站。
