# Vercel 一键部署指南

## 部署按钮实现方式

要在 README.md 中添加一键部署到 Vercel 的按钮，需要在文件中添加以下 Markdown 代码：

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/你的仓库名)
```

## 部署步骤

1. 首先确保您的项目已经推送到 GitHub 仓库
2. 将下面的代码添加到您的 README.md 文件中：

```markdown
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/USERNAME/REPO_NAME)
```
3. 将 `USERNAME` 替换为您的 GitHub 用户名
4. 将 `REPO_NAME` 替换为您的仓库名称

## 注意事项

由于 Vercel Serverless Functions 不支持 WebSocket 持久连接，实时通信功能会受到限制。我们建议：

1. 使用第三方服务如 Pusher 或 Socket.io 替代 WebSocket
2. 选择支持 WebSocket 的传统服务器托管服务
3. 文件上传功能在线上环境已被禁用（仅本地环境支持）

## 手动部署步骤

如果您无法使用一键部署按钮，可以按照以下步骤手动部署到 Vercel：

1. 访问 [Vercel 官网](https://vercel.com)
2. 使用您的 GitHub 账户登录
3. 点击 "New Project"
4. 选择您的仓库
5. 配置项目设置（Vercel 会自动检测配置）
6. 点击 "Deploy"
7. 等待部署完成并访问您的应用