import { Server } from 'ws';

// Vercel Serverless Function不支持WebSocket持久连接
// 此处仅为示例，实际部署时需要使用第三方WebSocket服务如Pusher或Socket.io
export default function handler(request, response) {
  // 返回提示信息，说明WebSocket在Vercel上的限制
  response.status(200).json({
    message: 'WebSocket is not supported in Vercel Serverless Functions',
    solution: 'Please use a third-party WebSocket service like Pusher or Socket.io for real-time communication'
  });
}