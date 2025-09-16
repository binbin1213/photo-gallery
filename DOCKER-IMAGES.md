# Docker镜像使用指南

## 🐳 **GitHub Container Registry镜像**

### **镜像地址**
- **前端镜像**: `ghcr.io/binbin1213/photo-gallery-frontend:latest`
- **后端镜像**: `ghcr.io/binbin1213/photo-gallery-backend:latest`

### **拉取镜像**
```bash
# 拉取最新镜像
docker pull ghcr.io/binbin1213/photo-gallery-frontend:latest
docker pull ghcr.io/binbin1213/photo-gallery-backend:latest

# 拉取特定版本
docker pull ghcr.io/binbin1213/photo-gallery-frontend:v1.0.0
docker pull ghcr.io/binbin1213/photo-gallery-backend:v1.0.0
```

## 🚀 **快速部署**

### **方法1：使用预构建镜像**
```bash
# 1. 克隆仓库
git clone https://github.com/binbin1213/photo-gallery.git
cd photo-gallery

# 2. 创建生产环境配置
cat > docker-compose.prod.yml << EOF
services:
  api:
    image: ghcr.io/binbin1213/photo-gallery-backend:latest
    container_name: photo-gallery-api
    restart: unless-stopped
    ports:
      - "5551:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      UPLOAD_PATH: /app/uploads
    volumes:
      - ./photos:/app/uploads/photos:ro
      - ./data:/app/data
      - api_uploads:/app/uploads
    networks:
      - photo-network

  web:
    image: ghcr.io/binbin1213/photo-gallery-frontend:latest
    container_name: photo-gallery-web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - photo-network

volumes:
  api_uploads:

networks:
  photo-network:
    driver: bridge
EOF

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### **方法2：本地构建**
```bash
# 使用本地构建
docker-compose up -d --build
```

## 📋 **镜像标签说明**

### **标签格式**
- `latest` - 最新版本
- `v1.0.0` - 语义化版本标签
- `abc1234` - Git提交哈希

### **查看可用标签**
访问 [GitHub Container Registry](https://github.com/binbin1213/photo-gallery/pkgs/container/photo-gallery-frontend)

## 🔧 **开发环境**

### **本地开发**
```bash
# 前端开发
cd client
npm install
npm run dev

# 后端开发
cd server
npm install
npm run dev
```

### **Docker开发**
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📊 **镜像大小优化**

### **前端镜像**
- 基础镜像: `nginx:alpine`
- 构建后大小: ~80MB
- 包含: React应用 + Nginx

### **后端镜像**
- 基础镜像: `node:18-alpine`
- 构建后大小: ~350MB
- 包含: Node.js应用 + 依赖

## 🔄 **自动构建**

### **触发条件**
- 推送到 `main` 分支
- 创建标签 (如 `v1.0.0`)
- 手动触发

### **构建状态**
查看 [Actions页面](https://github.com/binbin1213/photo-gallery/actions)

## 🛠️ **故障排除**

### **权限问题**
```bash
# 登录GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u binbin1213 --password-stdin
```

### **镜像拉取失败**
```bash
# 检查网络连接
docker pull hello-world

# 检查镜像是否存在
docker search ghcr.io/binbin1213/photo-gallery
```

### **服务启动失败**
```bash
# 查看详细日志
docker-compose logs -f api
docker-compose logs -f web

# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :5551
```
