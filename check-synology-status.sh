#!/bin/bash

echo "🔍 检查群晖照片展示墙服务状态..."

echo "📊 容器状态："
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 服务健康检查："

# 检查前端
echo "前端服务 (8881端口):"
curl -s -o /dev/null -w "HTTP状态: %{http_code}, 响应时间: %{time_total}s\n" http://localhost:8881/ || echo "❌ 前端服务不可访问"

# 检查API健康检查端点
echo "API健康检查 (5551端口):"
curl -s -o /dev/null -w "HTTP状态: %{http_code}, 响应时间: %{time_total}s\n" http://localhost:5551/api/health || echo "❌ API服务不可访问"

# 检查照片文件端点
echo "照片文件接口:"
curl -s -o /dev/null -w "HTTP状态: %{http_code}, 响应时间: %{time_total}s\n" http://localhost:5551/api/photos/files || echo "❌ 照片文件接口不可访问"

echo ""
echo "📝 如果有问题，请运行："
echo "   docker-compose -f docker-compose.synology.yml logs --tail 20"
