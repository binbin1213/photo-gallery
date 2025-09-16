# 照片展示墙 - Docker部署版

一个基于Docker的现代化照片展示应用，支持中英文姓名显示、搜索功能和管理员编辑。

## 🚀 快速开始

### 1. 准备照片
将照片文件放入 `photos/` 目录，按数字命名：
```
photos/
├── 1.jpg
├── 2.jpg
├── 3.jpg
...
├── 120.jpg
```

### 2. 启动服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 访问应用
- 前端应用：http://localhost
- 后端API：http://localhost:5551

## 📁 项目结构

```
photo/
├── client/                 # 前端React应用
├── server/                 # 后端Node.js API
├── photos/                 # 照片存储目录
├── data/                   # 数据文件
│   └── photo-names.json    # 姓名数据
├── docker-compose.yml      # Docker编排配置
└── README-DOCKER.md        # 本文档
```

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite + Tailwind CSS
- Framer Motion + React Query

### 后端
- Node.js + Express
- Sharp图片处理
- 文件系统存储

### 部署
- Docker + Docker Compose
- Nginx反向代理

## 📝 数据管理

- **照片存储**：`photos/` 目录
- **姓名数据**：`data/photo-names.json`
- **数据格式**：JSON格式，支持导入导出

## 🔧 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec api sh
docker-compose exec web sh
```

## 📊 服务端口

- **前端**: 80 (Nginx)
- **后端**: 5551 (Node.js API)

## 🔍 故障排除

### 服务无法启动
```bash
# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :5551

# 查看详细日志
docker-compose logs api
docker-compose logs web
```

### 照片无法显示
1. 检查 `photos/` 目录是否存在
2. 确认照片文件命名格式正确
3. 检查文件权限

### 数据无法保存
1. 检查 `data/` 目录权限
2. 确认 `photo-names.json` 文件存在

## 📄 许可证

MIT License
