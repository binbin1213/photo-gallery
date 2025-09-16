#!/bin/bash

# 群晖更新脚本
echo "🔄 开始更新照片展示墙..."

# 停止容器
echo "⏹️  停止容器..."
docker-compose -f docker-compose.synology.yml down

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker pull ghcr.io/binbin1213/photo-gallery-backend:latest
docker pull ghcr.io/binbin1213/photo-gallery-frontend:latest

# 重新启动
echo "🚀 启动容器..."
docker-compose -f docker-compose.synology.yml up -d

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 检查状态
echo "✅ 检查容器状态..."
docker ps | grep photo-gallery

# 获取群晖IP地址
SYNOLOGY_IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null || echo "群晖IP")

echo "🎉 更新完成！"
echo "🌐 访问地址: http://${SYNOLOGY_IP}"
echo "📝 如果无法访问，请检查群晖防火墙设置"
