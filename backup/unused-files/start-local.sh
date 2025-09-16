#!/bin/bash

echo "🚀 启动本地开发版本"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 MongoDB 是否运行（可选）
if command -v mongod &> /dev/null; then
    echo "📦 检测到 MongoDB，尝试启动..."
    # 在后台启动 MongoDB（如果没有运行）
    if ! pgrep -x "mongod" > /dev/null; then
        mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data --port 27017 2>/dev/null || echo "⚠️  MongoDB 启动失败，将使用内存数据库"
    fi
else
    echo "⚠️  未检测到 MongoDB，将使用简化版本"
fi

# 创建必要的目录
mkdir -p server/src/{models,routes}
mkdir -p client/src/{components,pages,hooks,store,types,utils}

echo "📦 安装后端依赖..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔄 启动后端服务..."
npm run dev &
SERVER_PID=$!

cd ..

echo "📦 安装前端依赖..."
cd client
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔄 启动前端服务..."
npm run dev &
CLIENT_PID=$!

cd ..

echo ""
echo "✅ 本地开发环境启动完成！"
echo ""
echo "🌐 前端地址: http://localhost:5173"
echo "🔌 API地址: http://localhost:5000"
echo ""
echo "📋 停止服务:"
echo "  kill $SERVER_PID $CLIENT_PID"
echo "  或者按 Ctrl+C"
echo ""

# 等待用户中断
trap "echo '🛑 停止服务...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT
wait