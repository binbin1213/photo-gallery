# 群晖部署指南 - v2.0

## 📋 部署前准备

### 1. 确保群晖已安装Docker套件
- 打开 **套件中心**
- 搜索并安装 **Docker** 套件

### 2. 创建必要的文件夹
在群晖文件管理中创建以下文件夹结构：
```
/volume1/docker/photo-gallery/
├── photos/          # 存放照片文件
├── data/            # 存放JSON数据文件（兼容旧版本）
├── uploads/         # 上传临时文件
└── mongodb/         # MongoDB数据库数据（v2.0新增）
```

### 3. 系统要求
- **群晖DSM**: 6.0或更高版本
- **Docker**: 最新版本
- **内存**: 建议2GB以上
- **存储**: 根据照片数量决定（建议预留10GB以上）

## 🚀 部署方法

### 方法1：使用Docker Compose（推荐）

1. **上传配置文件**
   将 `docker-compose.synology.yml` 上传到群晖的 `/volume1/docker/photo-gallery/` 目录

2. **SSH连接群晖**
   ```bash
   ssh admin@群晖IP地址
   ```

3. **进入目录并启动**
   ```bash
   cd /volume1/docker/photo-gallery/
   docker-compose -f docker-compose.synology.yml up -d
   ```

### 方法2：使用Docker GUI（手动创建）

#### 创建MongoDB容器
1. **打开Docker套件**
2. **点击"容器" → "新增"**
3. **选择"从Docker Hub"**
4. **输入镜像名称**：`mongo:7.0`
5. **配置容器**：
   - 容器名称：`photo-gallery-mongodb`
   - 端口映射：`27017:27017`
   - 环境变量：
     - `MONGO_INITDB_ROOT_USERNAME=admin`
     - `MONGO_INITDB_ROOT_PASSWORD=photo_gallery_2024`
     - `MONGO_INITDB_DATABASE=photo_gallery`
   - 卷映射：
     - `/volume1/docker/photo-gallery/mongodb:/data/db`

#### 创建后端API容器
6. **输入镜像名称**：`ghcr.io/binbin1213/photo-gallery-backend:latest`
7. **配置容器**：
   - 容器名称：`photo-gallery-api`
   - 端口映射：`5551:5000`
   - 环境变量：
     - `NODE_ENV=production`
     - `PORT=5000`
     - `UPLOAD_PATH=/app/uploads`
     - `MONGODB_URI=mongodb://admin:photo_gallery_2024@photo-gallery-mongodb:27017/photo_gallery?authSource=admin`
     - `DB_NAME=photo_gallery`
   - 卷映射：
     - `/volume1/docker/photo-gallery/photos:/app/uploads/photos:ro`
     - `/volume1/docker/photo-gallery/data:/app/data`
     - `/volume1/docker/photo-gallery/uploads:/app/uploads`

#### 创建前端容器
8. **输入镜像名称**：`ghcr.io/binbin1213/photo-gallery-frontend:latest`
9. **配置容器**：
   - 容器名称：`photo-gallery-frontend`
   - 端口映射：`8881:80`

## 📁 文件准备

### 1. 上传照片
将你的照片文件上传到：
```
/volume1/docker/photo-gallery/photos/
├── 1.jpg
├── 2.jpg
├── 3.jpg
└── ...
```

### 2. 创建必要目录
确保以下目录存在并有正确权限：
```bash
# SSH连接群晖后执行
sudo mkdir -p /volume1/docker/photo-gallery/{photos,data,uploads,mongodb}
sudo chown -R 1000:1000 /volume1/docker/photo-gallery/
```

## 🌐 访问应用

部署完成后，通过以下地址访问：
- **前端界面**：`http://群晖IP:8881`
- **API接口**：`http://群晖IP:5551`
- **管理面板**：`http://群晖IP:8881/admin`（需要密码）

## 🎯 v2.0新功能使用

### 1. 数据导入
1. **访问管理面板**：`http://群晖IP:8881/admin`
2. **输入管理员密码**
3. **选择"表格导入"功能**
4. **上传Excel/CSV文件**（包含艺人信息）
5. **预览并确认导入**

### 2. 照片-艺人关联
1. **点击任意照片**
2. **搜索艺人姓名**
3. **选择并关联**
4. **关联后照片标题自动更新**

## 🔧 常见问题

### 1. 端口冲突
如果8881端口被占用，可以修改为其他端口，如8080：
```yaml
ports:
  - "8080:80"  # 前端端口
  - "5552:5000"  # API端口（如需要）
```

### 2. 权限问题
确保Docker容器有权限访问映射的文件夹：
```bash
# 在群晖SSH中执行
sudo chown -R 1000:1000 /volume1/docker/photo-gallery/
sudo chmod -R 755 /volume1/docker/photo-gallery/
```

### 3. 防火墙设置
确保群晖防火墙允许以下端口访问：
- `8881` - 前端界面
- `5551` - API接口
- `27017` - MongoDB数据库（可选，仅调试用）

### 4. MongoDB连接问题
如果遇到数据库连接错误：
```bash
# 检查MongoDB容器状态
docker logs photo-gallery-mongodb

# 重启MongoDB容器
docker restart photo-gallery-mongodb
```

### 5. 数据迁移（从v1.0升级）
如果从v1.0升级，旧的JSON数据不会自动导入到MongoDB。需要：
1. 备份旧的 `photo-names.json` 文件
2. 使用新的Excel导入功能重新导入数据
3. 手动关联照片和艺人信息

## 📊 监控和管理

### 查看容器状态
```bash
docker ps | grep photo-gallery
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.synology.yml logs -f

# 查看单个服务日志
docker logs photo-gallery-mongodb
docker logs photo-gallery-api
docker logs photo-gallery-frontend
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.synology.yml restart

# 重启单个服务
docker restart photo-gallery-mongodb
docker restart photo-gallery-api
docker restart photo-gallery-frontend
```

### 备份数据库
```bash
# 备份MongoDB数据
docker exec photo-gallery-mongodb mongodump --uri="mongodb://admin:photo_gallery_2024@localhost:27017/photo_gallery?authSource=admin" --out=/data/backup

# 复制备份到群晖
docker cp photo-gallery-mongodb:/data/backup /volume1/docker/photo-gallery/backup
```

## 🔄 更新应用

### 使用脚本更新（推荐）
```bash
# 使用提供的更新脚本
cd /volume1/docker/photo-gallery/
./update-synology.sh
```

### 手动更新
```bash
# 停止服务
docker-compose -f docker-compose.synology.yml down

# 拉取最新镜像
docker pull ghcr.io/binbin1213/photo-gallery-backend:latest
docker pull ghcr.io/binbin1213/photo-gallery-frontend:latest
docker pull mongo:7.0

# 重新启动
docker-compose -f docker-compose.synology.yml up -d
```

## 🚨 安全建议

1. **修改默认密码**：更改MongoDB的默认密码
2. **网络隔离**：考虑使用群晖的防火墙限制访问
3. **定期备份**：定期备份MongoDB数据和照片文件
4. **监控日志**：定期检查容器日志，发现异常及时处理
