# Docker镜像构建和发布指南

## 📦 镜像信息

### 前端镜像
- **镜像名称**: `ghcr.io/binbin1213/photo-gallery-frontend`
- **基础镜像**: `nginx:alpine`
- **构建上下文**: `./client`
- **暴露端口**: `80`

### 后端镜像
- **镜像名称**: `ghcr.io/binbin1213/photo-gallery-backend`
- **基础镜像**: `node:18-alpine`
- **构建上下文**: `./server`
- **暴露端口**: `5000`

## 🔧 本地构建

### 构建前端镜像
```bash
cd client
docker build -t photo-gallery-frontend:local .
```

### 构建后端镜像
```bash
cd server
docker build -t photo-gallery-backend:local .
```

### 本地测试
```bash
# 启动MongoDB
docker run -d --name test-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=photo_gallery_2024 \
  -e MONGO_INITDB_DATABASE=photo_gallery \
  -p 27017:27017 \
  mongo:7.0

# 启动后端
docker run -d --name test-backend \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://admin:photo_gallery_2024@host.docker.internal:27017/photo_gallery?authSource=admin \
  -e DB_NAME=photo_gallery \
  -p 5551:5000 \
  photo-gallery-backend:local

# 启动前端
docker run -d --name test-frontend \
  -p 8080:80 \
  photo-gallery-frontend:local
```

## 🚀 自动构建和发布

### GitHub Actions工作流

项目使用GitHub Actions自动构建和发布Docker镜像：

1. **触发条件**:
   - 推送到`main`分支
   - 创建新的标签（`v*`）
   - 手动触发

2. **构建过程**:
   - 设置Docker Buildx
   - 登录GitHub Container Registry
   - 构建前端和后端镜像
   - 推送镜像到GHCR
   - 生成生产环境配置文件

3. **镜像标签**:
   - `latest`: 最新的main分支构建
   - `<commit-sha>`: 特定提交的镜像
   - `<tag>`: 版本标签镜像

### 发布新版本

1. **创建版本标签**:
   ```bash
   git tag -a v2.1.0 -m "Release v2.1.0"
   git push origin v2.1.0
   ```

2. **GitHub Actions自动执行**:
   - 构建Docker镜像
   - 推送到Container Registry
   - 创建GitHub Release
   - 生成发布说明

## 📋 镜像版本历史

### v2.0.0 (当前版本)
- ✨ 照片-艺人关联系统
- 🗄️ MongoDB数据库集成
- 📊 Excel/CSV数据导入
- 🔐 安全权限控制
- 🎨 现代化UI设计

### v1.0.0
- 🎯 基础照片展示
- 🔍 简单搜索功能
- 📱 响应式设计

## 🔍 镜像详情

### 镜像大小优化
- 使用Alpine Linux基础镜像
- 多阶段构建减少镜像体积
- 仅安装生产环境依赖

### 安全特性
- 非root用户运行
- 健康检查配置
- 最小化攻击面

### 性能优化
- Nginx静态文件服务
- Node.js生产模式
- 压缩和缓存配置

## 🛠️ 故障排除

### 常见问题

1. **镜像拉取失败**:
   ```bash
   # 检查镜像是否存在
   docker pull ghcr.io/binbin1213/photo-gallery-frontend:latest
   ```

2. **容器启动失败**:
   ```bash
   # 查看容器日志
   docker logs <container-name>
   ```

3. **权限问题**:
   ```bash
   # 确保有权限访问GHCR
   echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
   ```

## 📖 相关文档

- [部署指南](./README.md)
- [群晖部署](./SYNOLOGY-DEPLOYMENT.md)
- [Docker Compose配置](./docker-compose.yml)