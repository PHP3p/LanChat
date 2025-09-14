# LAN Chat - 局域网聊天应用

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/USERNAME/REPO_NAME)

## 功能特性
- 实时文本聊天
- 文件传输（最大支持500MB）
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