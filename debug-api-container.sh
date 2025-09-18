#!/bin/bash

echo "🔍 API容器详细诊断..."

echo "📋 API容器详细信息："
docker inspect photo-gallery-api --format='{{.State.Health.Status}}: {{range .State.Health.Log}}{{.Output}}{{end}}'

echo ""
echo "📊 API容器最近日志："
docker logs photo-gallery-api --tail 30

echo ""
echo "🔗 MongoDB连接测试："
docker exec photo-gallery-api node -e "
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://admin:photo_gallery_2024@mongodb:27017/photo_gallery?authSource=admin';
console.log('尝试连接到:', uri);
mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB连接成功'))
  .catch(err => console.log('❌ MongoDB连接失败:', err.message));
setTimeout(() => process.exit(0), 3000);
" 2>/dev/null || echo "❌ 无法执行MongoDB连接测试"

echo ""
echo "🌐 容器内部网络测试："
docker exec photo-gallery-api ping -c 2 mongodb 2>/dev/null || echo "❌ 无法ping通MongoDB容器"

echo ""
echo "📁 上传目录检查："
docker exec photo-gallery-api ls -la /app/uploads/ 2>/dev/null || echo "❌ 无法访问上传目录"
