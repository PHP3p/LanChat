#!/bin/bash

# LAN Chat 部署脚本
# 用于一键部署到 Vercel

echo "LAN Chat 部署脚本"
echo "=================="

# 检查是否已安装 Vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "未检测到 Vercel CLI，正在安装..."
    npm install -g vercel
fi

echo "正在部署到 Vercel..."
vercel --prod

echo "部署完成！"