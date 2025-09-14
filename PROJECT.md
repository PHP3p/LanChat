# LAN Chat - 局域网聊天应用

## 项目概述
LAN Chat 是一个基于 Node.js 和 WebSocket 的轻量级局域网实时聊天应用，专为局域网环境设计，支持文本消息和文件传输功能。

## 功能特性
- 实时文本聊天：支持多用户实时文本消息传输
- 文件传输：支持大文件传输（最大500MB）
- 多房间支持：用户可以创建或加入不同的聊天房间
- 局域网设备发现：自动显示局域网访问地址
- 响应式设计：适配不同设备屏幕尺寸

## 技术栈
- 后端：Node.js, Express, WebSocket
- 前端：HTML5, CSS3, JavaScript ES6+
- 文件上传：Multer
- 构建工具：Vercel (支持部署)

## 部署说明
### 本地部署
1. 克隆项目到本地
2. 安装依赖：`npm install`
3. 启动服务：`node server.js`
4. 访问应用：打开浏览器访问显示的局域网地址

### Vercel部署
注意：由于Vercel Serverless Functions不支持WebSocket持久连接，实时通信功能会受到限制。
建议解决方案：
1. 使用第三方服务如Pusher或Socket.io替代WebSocket
2. 选择支持WebSocket的传统服务器托管服务

## 目录结构
```
lan-chat/
├── api/              # API路由目录
│   └── websocket.js  # WebSocket相关说明
├── public/           # 前端静态资源
│   └── index.html    # 主页面
├── uploads/          # 文件上传目录
├── server.js         # 主服务文件
├── package.json      # 项目配置文件
├── vercel.json       # Vercel配置文件
├── .gitignore        # Git忽略文件配置
└── README.md         # 项目说明文件
```

## 使用方法
1. 启动服务后，应用会显示局域网访问地址
2. 在浏览器中打开地址即可访问应用
3. 可通过URL参数指定房间号，例如：`http://192.168.1.3:3000/?room=team1`
4. 输入昵称后即可开始聊天和文件传输

## 注意事项
- 上传的文件存储在本地uploads目录中
- 建议定期清理uploads目录以释放存储空间
- 应用仅适用于局域网环境，不支持外网访问