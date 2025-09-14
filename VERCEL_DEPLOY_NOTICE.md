# Vercel 部署重要说明

## WebSocket 功能限制

由于 Vercel Serverless Functions 不支持 WebSocket 持久连接，实时聊天功能可能无法正常工作。

## 文件上传功能限制

为了提高应用的安全性和兼容性，文件上传功能在 Vercel 环境中已被禁用：
- 本地环境（localhost、172.x.x.x、192.x.x.x）：支持无限制文件上传
- Vercel 环境：文件上传功能被禁用，API 会返回 403 错误

## 解决方案

1. 使用第三方 WebSocket 服务（如 Pusher 或 Socket.io）
2. 使用传统服务器部署方式

## 错误说明

如果遇到 500 错误，可能是由于 WebSocket 不兼容导致的。

## 建议

- 查看控制台错误详情
- 移除或替换 WebSocket 功能
- 考虑使用第三方 WebSocket 服务