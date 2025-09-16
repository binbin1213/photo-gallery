# 更新日志

## [2.1.0] - 2024-12-19

### 🗑️ 移除功能
- **移除MongoDB数据库**：项目不再使用MongoDB，改为纯文件系统存储
- **简化架构**：减少数据库依赖，降低部署复杂度

### 📝 修改内容

#### Docker配置
- 从 `docker-compose.yml` 中移除MongoDB服务
- 移除MongoDB相关的环境变量和依赖
- 简化服务启动顺序

#### 后端代码
- 删除 `server/src/models/Photo.js` - MongoDB模型文件
- 删除 `server/src/routes/photos.js` - MongoDB路由文件  
- 删除 `server/src/app.js` - 包含MongoDB的完整应用文件
- 更新 `server/package.json` - 移除mongoose、jsonwebtoken、bcryptjs依赖
- 优化 `server/src/app-simple.js` - 改进日志输出

#### 文档更新
- 更新 `README.md` - 反映新的技术架构
- 创建 `README-DOCKER.md` - 专门的Docker部署文档
- 更新项目结构说明

### 🎯 技术架构变更

#### 之前
```
前端 (React) → 后端 (Node.js) → MongoDB数据库
```

#### 现在  
```
前端 (React) → 后端 (Node.js) → 文件系统存储
```

### 📊 优势
- **简化部署**：无需数据库服务，减少容器数量
- **降低资源消耗**：减少内存和存储使用
- **提高可靠性**：减少服务依赖，降低故障点
- **易于维护**：数据直接存储在文件系统中

### 🔧 数据存储
- **照片文件**：`photos/` 目录
- **姓名数据**：`data/photo-names.json` 文件
- **格式**：JSON格式，支持导入导出

### 📋 迁移说明
现有项目可以直接使用新的配置，无需数据迁移：
- 照片文件保持不变
- 姓名数据格式保持不变
- 所有功能正常工作

### 🚀 部署命令
```bash
# 停止旧服务
docker-compose down

# 启动新服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```
