# 局域网聊天室 (LAN Chat)

一个基于Node.js、Express和WebSocket的局域网聊天室应用，支持文本消息和文件传输。

## 功能特性
- 实时文本聊天
- 文件传输（图片、视频、文档等）
- 多房间支持
- 局域网内设备发现

## 部署到Vercel的说明

由于Vercel的Serverless Functions架构限制，WebSocket持久连接无法在Vercel上正常工作。因此，此应用的实时通信功能在Vercel部署时会受到限制。

### 解决方案

1. **使用第三方WebSocket服务**：
   - Pusher (https://pusher.com/)
   - Socket.io (配合适配器使用)

2. **替代部署方案**：
   - 使用支持WebSocket的传统服务器托管服务
   - 部署到支持持久连接的云平台（如AWS EC2、DigitalOcean等）

### 部署步骤

1. 将项目推送到GitHub仓库
2. 在Vercel仪表板中导入项目
3. Vercel会自动检测并配置项目
4. 部署完成后，应用将可访问，但实时通信功能受限

## 本地运行

```bash
npm install
npm start
```

访问 `http://localhost:3000` 使用应用。