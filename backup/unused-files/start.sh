#!/bin/bash

echo "🚀 启动照片展示墙 Docker 版本"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "📦 构建 Docker 镜像..."
docker-compose build

echo "🔄 启动服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "✅ 启动完成！"
echo ""
echo "🌐 网站地址: http://localhost"
echo "📁 照片管理: http://localhost/photo-manager.html"
echo "🔄 重置数据: http://localhost/reset.html"
echo ""
echo "📋 管理命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""