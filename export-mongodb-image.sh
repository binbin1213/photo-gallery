#!/bin/bash

# MongoDB镜像导出脚本
echo "🐳 开始下载并导出MongoDB镜像..."

# 下载MongoDB 7.0镜像
echo "📥 下载MongoDB 7.0镜像..."
docker pull mongo:7.0

# 检查镜像是否下载成功
if docker images mongo:7.0 | grep -q "7.0"; then
    echo "✅ MongoDB镜像下载成功"
else
    echo "❌ MongoDB镜像下载失败"
    exit 1
fi

# 导出镜像为tar文件
echo "📦 导出镜像为tar文件..."
docker save -o mongodb-7.0.tar mongo:7.0

# 检查导出是否成功
if [ -f "mongodb-7.0.tar" ]; then
    echo "✅ MongoDB镜像导出成功"
    echo "📁 文件位置: $(pwd)/mongodb-7.0.tar"
    echo "📊 文件大小: $(du -h mongodb-7.0.tar | cut -f1)"
    echo ""
    echo "🚀 接下来的步骤:"
    echo "1. 将 mongodb-7.0.tar 文件上传到群晖"
    echo "2. 在群晖上执行: docker load -i mongodb-7.0.tar"
    echo "3. 运行: docker images 确认镜像已加载"
    echo "4. 重新执行: ./update-synology.sh"
else
    echo "❌ MongoDB镜像导出失败"
    exit 1
fi
