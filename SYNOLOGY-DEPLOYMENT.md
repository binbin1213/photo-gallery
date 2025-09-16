# 群晖部署指南

## 📋 部署前准备

### 1. 确保群晖已安装Docker套件
- 打开 **套件中心**
- 搜索并安装 **Docker** 套件

### 2. 创建必要的文件夹
在群晖文件管理中创建以下文件夹结构：
```
/volume1/docker/photo-gallery/
├── photos/          # 存放照片文件
├── data/            # 存放数据文件
└── uploads/         # 上传临时文件
```

## 🚀 部署方法

### 方法1：使用Docker GUI（推荐）

1. **打开Docker套件**
2. **点击"容器" → "新增"**
3. **选择"从Docker Hub"**
4. **输入镜像名称**：`ghcr.io/binbin1213/photo-gallery-backend:latest`
5. **配置容器**：
   - 容器名称：`photo-gallery-backend`
   - 端口映射：`5551:5000`
   - 环境变量：
     - `NODE_ENV=production`
     - `PORT=5000`
     - `UPLOAD_PATH=/app/uploads`
   - 卷映射：
     - `/volume1/docker/photo-gallery/photos:/app/uploads/photos:ro`
     - `/volume1/docker/photo-gallery/data:/app/data`
     - `/volume1/docker/photo-gallery/uploads:/app/uploads`

6. **重复步骤4-5创建前端容器**：
   - 镜像：`ghcr.io/binbin1213/photo-gallery-frontend:latest`
   - 容器名称：`photo-gallery-frontend`
   - 端口映射：`80:80`

### 方法2：使用SSH + Docker Compose

1. **启用SSH服务**
   - 控制面板 → 终端机和SNMP → 启用SSH服务

2. **上传文件到群晖**
   ```bash
   # 将以下文件上传到群晖
   scp docker-compose.synology.yml admin@群晖IP:/volume1/docker/photo-gallery/
   scp -r photos/ admin@群晖IP:/volume1/docker/photo-gallery/
   scp -r data/ admin@群晖IP:/volume1/docker/photo-gallery/
   ```

3. **SSH登录群晖**
   ```bash
   ssh admin@群晖IP
   ```

4. **进入目录并启动**
   ```bash
   cd /volume1/docker/photo-gallery/
   docker-compose -f docker-compose.synology.yml up -d
   ```

## 📁 文件准备

### 1. 上传照片
将你的照片文件上传到：
```
/volume1/docker/photo-gallery/photos/
```

### 2. 上传数据文件
将 `photo-names.json` 上传到：
```
/volume1/docker/photo-gallery/data/
```

## 🌐 访问应用

部署完成后，通过以下地址访问：
- **前端界面**：`http://群晖IP`
- **API接口**：`http://群晖IP:5551`

## 🔧 常见问题

### 1. 端口冲突
如果80端口被占用，可以修改为其他端口，如8080：
```yaml
ports:
  - "8080:80"
```

### 2. 权限问题
确保Docker容器有权限访问映射的文件夹：
```bash
# 在群晖SSH中执行
sudo chown -R 1000:1000 /volume1/docker/photo-gallery/
```

### 3. 防火墙设置
确保群晖防火墙允许80和5551端口访问。

## 📊 监控和管理

### 查看容器状态
```bash
docker ps
```

### 查看日志
```bash
docker logs photo-gallery-backend
docker logs photo-gallery-frontend
```

### 重启服务
```bash
docker restart photo-gallery-backend
docker restart photo-gallery-frontend
```

## 🔄 更新应用

当有新的镜像发布时：
1. 在Docker套件中停止容器
2. 删除旧容器
3. 重新创建容器（会自动拉取最新镜像）
4. 启动新容器
