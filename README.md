# 照片展示墙项目

一个基于Docker的现代化照片展示应用，支持中英文姓名显示、搜索功能和管理员编辑。

## 功能特点

- 📸 支持展示大量照片（默认配置120张）
- 🏷️ 每张照片显示中文名和英文名
- 🔍 实时搜索功能，支持中英文搜索
- 📱 响应式设计，支持移动端
- ✨ 现代化UI设计，基于React + TypeScript
- 🔐 管理员权限系统
- 🖼️ 点击查看大图预览
- 📤 数据导出备份功能
- 📥 数据导入恢复功能
- 📋 JSON模板下载
- 🐳 Docker容器化部署
- ⚡ 高性能图片处理（Sharp）
- 🎨 美观的动画效果（Framer Motion）

## 技术架构

### 前端技术栈
- **React 18** + **TypeScript** - 现代化前端框架
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **Framer Motion** - 动画库
- **React Query** - 数据获取和缓存
- **Zustand** - 状态管理
- **Fuse.js** - 模糊搜索

### 后端技术栈
- **Node.js** + **Express** - 后端API服务
- **Sharp** - 高性能图片处理
- **Multer** - 文件上传处理
- **CORS** - 跨域资源共享

### 部署架构
- **Docker** + **Docker Compose** - 容器化部署
- **Nginx** - 反向代理和静态文件服务
- **文件系统存储** - 照片和元数据存储

## 使用方法

### 1. 准备照片
在项目根目录的 `photos` 文件夹中放置照片，按数字命名：
```
photos/
├── 1.jpg
├── 2.jpg
├── 3.jpg
...
├── 120.jpg
```

支持的图片格式：JPG、PNG、WebP、HEIC

### 2. 启动项目
使用Docker Compose启动所有服务：
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

### 4. 管理照片信息
- **搜索**：在搜索框输入姓名进行实时搜索
- **查看大图**：点击照片查看高清大图
- **管理员模式**：输入密码进入管理员模式
- **批量编辑**：管理员模式下可以批量编辑姓名信息
- **数据导出/导入**：支持JSON格式的数据备份和恢复

## 项目结构

```
photo/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   └── types/         # TypeScript类型定义
│   ├── Dockerfile         # 前端Docker配置
│   └── package.json       # 前端依赖
├── server/                # 后端Node.js API
│   ├── src/
│   │   └── app-simple.js  # 主应用文件
│   ├── Dockerfile         # 后端Docker配置
│   └── package.json       # 后端依赖
├── photos/                # 照片存储目录
│   ├── 1.jpg
│   ├── 2.jpg
│   └── ...
├── data/                  # 数据文件
│   └── photo-names.json   # 姓名数据
├── docker-compose.yml     # Docker编排配置
└── README.md             # 项目说明
```

## 开发说明

### 本地开发
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

### 生产部署
```bash
# 构建并启动所有服务
docker-compose up -d

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build
```

### 数据管理
- 照片文件存储在 `photos/` 目录
- 姓名数据存储在 `data/photo-names.json`
- 支持JSON格式的数据导入导出
- 管理员可以批量编辑姓名信息

## 浏览器兼容性

支持所有现代浏览器：
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 许可证

MIT License