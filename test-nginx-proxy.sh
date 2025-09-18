#!/bin/bash

echo "🔍 测试Nginx到API的代理连接..."

echo "📊 检查前端容器能否连接到API："
docker exec photo-gallery-frontend ping -c 2 api 2>/dev/null || echo "❌ 前端无法ping通API容器"

echo ""
echo "🌐 测试前端容器内部的API连接："
docker exec photo-gallery-frontend wget -qO- http://api:5000/api/health 2>/dev/null || echo "❌ 前端无法通过内部网络访问API"

echo ""
echo "📋 检查前端Nginx日志："
docker logs photo-gallery-frontend --tail 10

echo ""
echo "🔧 测试API容器的健康状态："
docker exec photo-gallery-api node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  console.log('收到请求:', req.url);
  res.end('OK');
});
server.listen(5000, () => {
  console.log('✅ API端口5000监听正常');
  server.close();
});
" 2>/dev/null || echo "❌ API端口监听测试失败"

echo ""
echo "🌐 检查容器网络："
docker network ls | grep photo-gallery
