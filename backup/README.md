# 备份文件说明

这个目录包含了项目中不再使用的文件，已从主项目中移除。

## 📁 文件分类

### 旧版前端文件
- `index.html` - 旧版纯HTML主页面
- `script.js` - 旧版JavaScript逻辑文件
- `styles.css` - 旧版CSS样式文件
- `photo-display-options.css` - 照片显示选项样式

### 不再使用的后端文件
- `auth.js` - 认证路由（依赖已删除的JWT）
- `fileStorage.js` - 空文件

### 根目录配置文件
- `package.json` - 根目录的package.json（现在用Docker）
- `Dockerfile` - 根目录的Dockerfile（现在用子目录的）
- `nginx.conf` - 根目录的nginx.conf（现在用client目录的）

### 启动脚本
- `start.sh` - 旧版Docker启动脚本
- `start-local.sh` - 本地开发启动脚本

### 其他文件
- `placeholder.jpg` - 占位图片

## 🔄 迁移说明

这些文件在项目重构过程中被以下新文件替代：

### 前端
- 旧版 → 新版React应用 (`client/` 目录)
- 纯HTML/JS → React + TypeScript + Vite

### 后端
- 复杂认证系统 → 简化的文件系统存储
- MongoDB依赖 → 纯文件系统存储

### 部署
- 手动配置 → Docker Compose自动化部署

## ⚠️ 注意事项

- 这些文件已从主项目中移除
- 如果需要恢复，可以从这个备份目录复制
- 建议在确认新版本稳定后再删除此备份目录

## 📅 备份时间

备份时间：2024-12-19
备份原因：项目架构简化，移除MongoDB依赖
