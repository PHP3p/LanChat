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


const PORT = process.env.PORT || 3000;

// Vercel环境中不启动独立服务器
if (isVercel) {
  const app = express();
  module.exports = app;
} else {
  const app = express();

  // 静态资源
  app.use(express.static(path.join(__dirname, "public")));

  // 文件上传目录
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

  // 增加文件大小限制到500MB以支持更大的文件传输
  const upload = multer({ 
      storage: storage,
      limits: {
          fileSize: 500 * 1024 * 1024 // 500MB 限制
      }
  });

  // 解析 JSON 和 URL 编码数据，增加限制以支持大文件
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // 优化静态文件服务性能
  app.use(express.static(path.join(__dirname, "public"), {
      maxAge: '1d', // 缓存静态资源1天
      etag: false   // 禁用etag以提高性能
  }));

  // 文件上传接口 - 使用 multer
  app.post('/upload', upload.single('file'), (req, res) => {
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

  // 提供上传文件访问，添加正确的MIME类型支持和性能优化
  app.use('/uploads', express.static(UPLOAD_DIR, {
      maxAge: '7d', // 缓存上传文件7天
      etag: false,  // 禁用etag以提高性能
      lastModified: true,
      setHeaders: (res, path) => {
          // 为视频文件设置正确的MIME类型和支持流式传输的头部
          if (path.endsWith('.mp4')) {
              res.setHeader('Content-Type', 'video/mp4');
          } else if (path.endsWith('.webm')) {
              res.setHeader('Content-Type', 'video/webm');
          } else if (path.endsWith('.ogg')) {
              res.setHeader('Content-Type', 'video/ogg');
          } else if (path.endsWith('.mov')) {
              res.setHeader('Content-Type', 'video/quicktime');
          }
          
          // 添加支持流式传输的头部
          res.setHeader('Accept-Ranges', 'bytes');
      }
  }));

  // 简单健康检查
  app.get("/health", (_req, res) => res.json({ ok: true }));

  const server = http.createServer(app);
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
              msg = JSON.parse(raw.toString());
          } catch {
              return;
          }
          // 处理心跳消息
          if (msg.type === "ping") {
              ws.send(JSON.stringify({ type: "pong" }));
              return;
          }
          // 统一消息格式：{ type: 'chat', nickname, text, ts } 或 { type: 'file', nickname, file, ts }
          if (msg.type === "chat" && typeof msg.text === "string") {
              const payload = JSON.stringify({
                  type: "chat",
                  nickname: String(msg.nickname || "匿名"),
                  text: msg.text.slice(0, 5000), // 简单长度保护
                  ts: Date.now(),
              });

              // 仅广播到同房间
              const peers = roomMap.get(ws._room) || new Set();
              for (const client of peers) {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                      client.send(payload);
                  }
              }
          } else if (msg.type === "file" && msg.file) {
              const payload = JSON.stringify({
                  type: "file",
                  nickname: String(msg.nickname || "匿名"),
                  file: msg.file,
                  ts: Date.now(),
              });

              // 仅广播到同房间
              const peers = roomMap.get(ws._room) || new Set();
              for (const client of peers) {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                      client.send(payload);
                  }
              }
          }
      });

      ws.on("close", () => {
          leaveRoom(ws);
          const peers = roomMap.get(ws._room) || new Set();
          const payload = JSON.stringify({
              type: "system",
              text: `${ws._nickname || "匿名"} 离开了房间`,
              ts: Date.now(),
          });
          for (const client of peers) {
              if (client.readyState === WebSocket.OPEN) {
                  client.send(payload);
              }
          }
      });

      
      // 欢迎消息
      ws.send(
          JSON.stringify({
              type: "system",
              text: `已加入房间：${room}`,
              ts: Date.now(),
          })
      );
  });

  // 获取本机局域网 IPv4 地址
  function getLocalIP() {
      const nets = os.networkInterfaces();
      let localIp = "127.0.0.1";
      for (const name of Object.keys(nets)) {
          for (const net of nets[name]) {
              // 只要 IPv4 且不是回环地址、不是内网 link-local
              if (net.family === "IPv4" && !net.internal) {
                  localIp = net.address;
                  return localIp; // 找到一个就返回
              }
          }
      }
      return localIp;
  }


  if (!isVercel) {
      server.listen(PORT, '0.0.0.0', () => {
          console.log(`LAN Chat running at http://0.0.0.0:${PORT}`);
          const interfaces = os.networkInterfaces();
          for (let interfaceName in interfaces) {
              const interface = interfaces[interfaceName];
              for (let i = 0; i < interface.length; i++) {
                  const alias = interface[i];
                  if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                      console.log(`Access on LAN: http://${alias.address}:${PORT}`);
                      console.log(`Example room URL: http://${alias.address}:${PORT}/?room=team1`);
                      break;
                  }
              }
          }
      });
  }
}

// Vercel环境中导出app供Serverless函数使用
if (isVercel) {
  const app = express();
  
  // 静态资源
  app.use(express.static(path.join(__dirname, "public")));

  // 文件上传目录
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

  // 增加文件大小限制到500MB以支持更大的文件传输
  const upload = multer({ 
      storage: storage,
      limits: {
          fileSize: 500 * 1024 * 1024 // 500MB 限制
      }
  });

  // 解析 JSON 和 URL 编码数据，增加限制以支持大文件
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // 优化静态文件服务性能
  app.use(express.static(path.join(__dirname, "public"), {
      maxAge: '1d', // 缓存静态资源1天
      etag: false   // 禁用etag以提高性能
  }));

  // 文件上传接口 - 使用 multer
  app.post('/upload', upload.single('file'), (req, res) => {
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

  // 提供上传文件访问，添加正确的MIME类型支持和性能优化
  app.use('/uploads', express.static(UPLOAD_DIR, {
      maxAge: '7d', // 缓存上传文件7天
      etag: false,  // 禁用etag以提高性能
      lastModified: true,
      setHeaders: (res, path) => {
          // 为视频文件设置正确的MIME类型和支持流式传输的头部
          if (path.endsWith('.mp4')) {
              res.setHeader('Content-Type', 'video/mp4');
          } else if (path.endsWith('.webm')) {
              res.setHeader('Content-Type', 'video/webm');
          } else if (path.endsWith('.ogg')) {
              res.setHeader('Content-Type', 'video/ogg');
          } else if (path.endsWith('.mov')) {
              res.setHeader('Content-Type', 'video/quicktime');
          }
          
          // 添加支持流式传输的头部
          res.setHeader('Accept-Ranges', 'bytes');
      }
  }));

  // 简单健康检查
  app.get("/health", (_req, res) => res.json({ ok: true }));
  
  module.exports = app;
}
