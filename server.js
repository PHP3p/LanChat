// server.js
// 简单的局域网文字互传服务：Express + ws
// 运行：node server.js  (默认端口 3000)

const http = require("http");
const path = require("path");
const express = require("express");
const WebSocket = require("ws");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

// Vercel兼容性处理
const isVercel = !!process.env.VERCEL;

// 检查是否为本地环境（localhost、172开头、192开头IP）
function isLocalEnvironment(req) {
  const host = req.get('host') || '';
  const hostname = host.split(':')[0];
  
  // 检查是否为本地环境
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('172.') ||
    hostname.startsWith('192.')
  );
}

// 文件上传目录
const UPLOAD_DIR = path.join(__dirname, "uploads");

const PORT = process.env.PORT || 3000;

// 创建Express应用
const app = express();

// 静态资源
app.use(express.static(path.join(__dirname, "public")));

// 解析 JSON 和 URL 编码数据，增加限制以支持大文件
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// 优化静态文件服务性能
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: '1d', // 缓存静态资源1天
    etag: false   // 禁用etag以提高性能
}));

// 文件上传目录 - 仅在本地环境启用
let uploadMiddleware = (req, res, next) => {
    if (isLocalEnvironment(req)) {
        // 本地环境支持文件上传
        const UPLOAD_DIR = path.join(__dirname, "uploads");
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        
        // 配置 multer 使用流式存储以提高性能
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, UPLOAD_DIR);
            },
            filename: function (req, file, cb) {
                // 生成唯一文件名
                const fileExtension = path.extname(file.originalname);
                const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
                cb(null, uniqueFileName);
            }
        });
        
        // 本地环境不限制文件大小
        const upload = multer({ 
            storage: storage
        });
        
        // 执行上传中间件
        upload.single('file')(req, res, next);
    } else {
        // 线上环境不支持文件上传
        return res.status(403).json({ 
            error: '文件上传功能仅在本地环境可用',
            message: '线上环境不支持文件上传，请在本地网络中使用此功能' 
        });
    }
};

// 文件上传接口 - 使用自定义中间件
app.post('/upload', uploadMiddleware, (req, res) => {
    // 检查是否为本地环境
    if (!isLocalEnvironment(req)) {
        return res.status(403).json({ 
            error: '文件上传功能仅在本地环境可用',
            message: '线上环境不支持文件上传，请在本地网络中使用此功能' 
        });
    }
    
    try {
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
            fileSize: req.file.size
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ error: '文件上传失败' });
    }
});

// 文件访问接口 - 仅在本地环境启用
app.get('/uploads/:filename', (req, res, next) => {
    if (isLocalEnvironment(req)) {
        // 本地环境提供文件访问
        const filename = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, filename);
        
        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: '文件不存在' });
        }
    } else {
        // 线上环境不提供文件访问
        res.status(403).json({ 
            error: '文件访问功能仅在本地环境可用',
            message: '线上环境不支持文件访问，请在本地网络中使用此功能' 
        });
    }
});

// 简单健康检查
app.get("/health", (_req, res) => res.json({ ok: true }));

// Vercel环境中导出app供Serverless函数使用
if (isVercel) {
    module.exports = app;
} else {
    // 本地环境中启动服务器
    const server = http.createServer(app);
    
    // 创建WebSocket服务器
    const wss = new WebSocket.Server({ server });

    // 小工具：从 URL 查询串里取房间码
    function getRoomFromReq(req) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            return url.searchParams.get("room") || "default";
        } catch {
            return "default";
        }
    }

    // 记录：每个 ws -> 房间；每个房间 -> Set(ws)
    const roomMap = new Map();

    function joinRoom(ws, room) {
        ws._room = room;
        if (!roomMap.has(room)) roomMap.set(room, new Set());
        roomMap.get(room).add(ws);
    }

    function leaveRoom(ws) {
        const room = ws._room;
        if (!room) return;
        const set = roomMap.get(room);
        if (set) {
            set.delete(ws);
            if (set.size === 0) roomMap.delete(room);
        }
    }

    wss.on("connection", (ws, req) => {
        const room = getRoomFromReq(req);
        joinRoom(ws, room);

        ws.on("message", (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch {
                // 忽略无效消息
                return;
            }

            // 广播到房间里的其他客户端
            const set = roomMap.get(room);
            if (set) {
                for (const client of set) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(msg));
                    }
                }
            }
        });

        ws.on("close", () => {
            leaveRoom(ws);
        });
    });

    // 获取本机IP地址
    function getLocalIpAddress() {
        const interfaces = os.networkInterfaces();
        let localIp = 'localhost';
        
        for (let interfaceName in interfaces) {
            const interface = interfaces[interfaceName];
            for (let i = 0; i < interface.length; i++) {
                const alias = interface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address; // 找到一个就返回
                }
            }
        }
        return localIp;
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`LAN Chat running at http://0.0.0.0:${PORT}`);
        const localIp = getLocalIpAddress();
        if (localIp !== 'localhost') {
            console.log(`Access on LAN: http://${localIp}:${PORT}`);
            console.log(`Example room URL: http://${localIp}:${PORT}/?room=team1`);
        }
    });
}
