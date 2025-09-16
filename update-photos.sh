#!/bin/bash

# 照片更新脚本
# 使用方法: ./update-photos.sh

echo "🔄 开始更新照片..."

# 停止容器
echo "⏹️  停止容器..."
docker-compose -f docker-compose.synology.yml down

# 等待容器完全停止
sleep 3

# 检查照片目录
echo "📁 检查照片目录..."
if [ ! -d "/volume1/docker/photo-gallery/photos" ]; then
    echo "❌ 照片目录不存在: /volume1/docker/photo-gallery/photos"
    exit 1
fi

# 显示当前照片数量
PHOTO_COUNT=$(ls -1 /volume1/docker/photo-gallery/photos/*.jpg 2>/dev/null | wc -l)
echo "📸 当前照片数量: $PHOTO_COUNT"

# 重新启动容器
echo "🚀 启动容器..."
docker-compose -f docker-compose.synology.yml up -d

# 等待容器启动
sleep 5

# 检查容器状态
echo "✅ 检查容器状态..."
docker ps | grep photo-gallery

echo "🎉 照片更新完成！"
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}')"
