# LAN Chat - 局域网聊天应用

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/lan-chat)

点击上面的按钮一键部署到 Vercel。Vercel 会自动从 GitHub 仓库拉取代码并部署应用。

### 重要说明

由于 Vercel Serverless Functions 不支持 WebSocket 持久连接，此应用的实时聊天功能在 Vercel 上会受限。建议使用第三方 WebSocket 服务如 Pusher 或 Socket.io 替代。

为了适配Vercel环境，我们提供了专门的server.vercel.js文件，其中移除了WebSocket相关功能，改用轮询方式实现消息传递。

详细信息请查看 [VERCEL_DEPLOY_NOTICE.md](VERCEL_DEPLOY_NOTICE.md) 文件。

## 功能特性
- 实时文本聊天
- 支持文件传输 (本地环境无限制，线上环境不支持)
- 多房间支持
- 局域网设备发现

## Vercel部署说明
由于Vercel的Serverless Functions不支持WebSocket持久连接，实时通信功能会受到限制。

### 解决方案
1. 使用第三方服务如Pusher或Socket.io替代WebSocket
2. 选择支持WebSocket的传统服务器托管服务

### 部署步骤
1. 将项目推送到GitHub仓库
2. 在Vercel仪表板导入项目
3. 配置环境变量（如果需要）
4. 部署应用

## 一键部署脚本
您也可以使用我们提供的一键部署脚本：
```bash
./deploy.sh
```

## 本地运行
1. 安装依赖：`npm install`
2. 启动服务：`node server.js`
3. 访问应用：打开浏览器访问显示的局域网地址