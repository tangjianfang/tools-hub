# 🛠️ Tools Hub - 工具聚合站

> 一站式在线工具集合，纯静态网页，部署在 Cloudflare Pages。

🌐 **在线访问：** https://tools-hub.pages.dev（部署后更新）

## ✨ 包含工具（16个）

| 分类 | 工具 |
|------|------|
| ⏰ 时间 | 实时时钟、秒表、倒计时、年龄计算 |
| 📝 文本 | 字数统计、大小写转换、Base64编解码、URL编解码 |
| 🧮 计算 | 计算器、单位换算、BMI计算、随机数生成 |
| 💻 开发 | 颜色选择器、密码生成器、JSON格式化 |
| 🌟 生活 | 二维码生成 |

## 🚀 技术栈

- 纯 HTML5 / CSS3 / JavaScript（无框架，无构建工具）
- Cloudflare Pages 托管（全球 CDN）

## 📦 本地运行

直接用浏览器打开 `index.html` 即可，无需任何构建步骤。

```bash
# 或用 Python 启动简单服务器
python -m http.server 8080
```

## 🔧 部署到 Cloudflare Pages

1. Fork 或 Push 代码到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Pages** → **Create a project** → **Connect to Git**
4. 选择本仓库，框架选 **None**，构建命令留空
5. 点击 **Save and Deploy**

每次 push 到 `main` 分支将自动重新部署。

## 📄 License

MIT
