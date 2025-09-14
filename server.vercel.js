const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 判断是否为本地环境
function isLocalEnvironment() {
    // 在Vercel环境中返回false
    if (process.env.VERCEL) {
        return false;
    }
    
    // 在本地开发环境中返回true
    return !process.env.NOW_REGION || process.env.NOW_REGION === 'dev1';
}

// 创建上传目录（如果不存在）
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    }
});

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('public'));

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' });
    }

    const { roomId } = req.body;
    
    if (!roomId) {
        return res.status(400).json({ error: '缺少房间参数' });
    }

    // 返回文件信息
    res.json({
        url: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        roomId: roomId
    });
});

// 获取上传文件列表
app.get('/api/files', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: '读取文件列表失败' });
        }

        const fileList = files.map(file => {
            const filePath = path.join(UPLOAD_DIR, file);
            const stat = fs.statSync(filePath);
            return {
                name: file,
                size: stat.size,
                modified: stat.mtime
            };
        });

        res.json(fileList);
    });
});

// Vercel特定的WebSocket提示接口
app.get('/api/websocket', (req, res) => {
    res.status(200).json({
        message: 'WebSocket is not supported in Vercel Serverless Functions',
        solution: 'Please use a third-party WebSocket service like Pusher or Socket.io for real-time communication'
    });
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        environment: isLocalEnvironment() ? 'local' : 'vercel',
        timestamp: new Date().toISOString()
    });
});

// Vercel Serverless Functions不支持WebSocket持久连接
// 这里提供一个简单的轮询接口作为替代方案
app.get('/api/messages', (req, res) => {
    // 在实际应用中，这里应该从数据库或缓存中获取消息
    res.status(200).json({
        messages: [],
        message: 'Vercel环境使用轮询代替WebSocket，请定期调用此接口获取新消息'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: '服务器内部错误',
        message: isLocalEnvironment() ? err.message : '请检查服务器日志获取更多信息'
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        error: '页面未找到',
        message: '请求的资源不存在'
    });
});

// 只在本地环境中启动服务器
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Vercel适配版本服务器正在运行在端口 ${PORT}`);
        console.log(`在Vercel环境中，WebSocket功能已被替换为轮询机制`);
    });
}

// 导出app供Vercel使用
module.exports = app;