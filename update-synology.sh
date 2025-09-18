#!/bin/bash

# 群晖更新脚本 - v2.0
echo "🔄 开始更新照片展示墙 v2.0..."

# 检查Docker Compose文件是否存在
if [ ! -f "docker-compose.synology.yml" ]; then
    echo "❌ 未找到 docker-compose.synology.yml 文件"
    echo "请确保在正确的目录下运行此脚本"
    exit 1
fi

# 备份数据库（如果MongoDB容器正在运行）
if docker ps | grep -q "photo-gallery-mongodb"; then
    echo "💾 备份数据库..."
    docker exec photo-gallery-mongodb mongodump --uri="mongodb://admin:photo_gallery_2024@localhost:27017/photo_gallery?authSource=admin" --out=/data/backup/$(date +%Y%m%d_%H%M%S) || echo "⚠️  数据库备份失败，继续更新..."
fi

# 停止容器
echo "⏹️  停止容器..."
docker-compose -f docker-compose.synology.yml down

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker pull ghcr.io/binbin1213/photo-gallery-backend:latest
docker pull ghcr.io/binbin1213/photo-gallery-frontend:latest
docker pull mongo:7.0

# 重新启动
echo "🚀 启动容器..."
docker-compose -f docker-compose.synology.yml up -d

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 10

# 检查状态
echo "✅ 检查容器状态..."
docker ps | grep photo-gallery

# 检查服务健康状态
echo "🔍 检查服务健康状态..."
sleep 5

# 检查API是否响应
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5551/api/photos/files || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API服务正常"
else
    echo "⚠️  API服务可能未正常启动 (HTTP: $API_STATUS)"
fi

# 获取群晖IP地址
SYNOLOGY_IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null || echo "群晖IP")

echo ""
echo "🎉 更新完成！"
echo "🌐 前端访问地址: http://${SYNOLOGY_IP}:8881"
echo "🔧 管理面板地址: http://${SYNOLOGY_IP}:8881/admin"
echo "🔌 API接口地址: http://${SYNOLOGY_IP}:5551"
echo ""
echo "📝 如果无法访问，请检查："
echo "   1. 群晖防火墙设置（端口8881, 5551）"
echo "   2. 容器是否正常启动（docker ps）"
echo "   3. 查看日志（docker-compose -f docker-compose.synology.yml logs）"
