# Vercel 部署重要说明

## WebSocket 功能限制

在 Vercel 上部署此应用时，需要注意以下重要限制：

1. **WebSocket 不支持**: Vercel Serverless Functions 不支持 WebSocket 持久连接
2. **实时通信受限**: 应用的实时聊天功能在 Vercel 部署环境中无法正常工作

## 解决方案

### 方案一：使用第三方 WebSocket 服务
- [Pusher](https://pusher.com/)
- [Socket.io](https://socket.io/)
- [Ably](https://ably.com/)

### 方案二：本地部署
如果需要完整的 WebSocket 功能，请考虑在支持 WebSocket 的传统服务器上部署此应用。

## 错误说明

您遇到的 `500: INTERNAL_SERVER_ERROR` 和 `FUNCTION_INVOCATION_FAILED` 错误很可能是由于 WebSocket 实现在 Vercel 环境中的不兼容性导致的。

## 建议

1. 查看控制台输出以获取更多错误详情
2. 考虑移除或替换 WebSocket 相关功能以适应 Vercel 环境
3. 或者使用上述第三方服务来实现实时通信功能