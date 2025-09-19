# TMDB API 集成配置说明

## 概述

本项目已集成 TMDB (The Movie Database) API，支持：
- 搜索艺人信息
- 搜索电影信息
- 获取电影演员列表
- 从 TMDB 创建新艺人并关联照片

## 功能特性

### 1. 艺人搜索增强
- 在艺人关联模态框中，可以选择搜索本地数据库或 TMDB
- TMDB 搜索结果包含更丰富的艺人信息（简介、出生地、代表作等）
- 支持从 TMDB 直接创建新艺人并关联照片

### 2. 电影演员列表
- 在艺人详情页面，点击代表作名称可查看该电影的演员列表
- 显示演员头像、姓名、饰演角色、热度等信息
- 支持显示前20位主要演员

## 配置说明

### 环境变量配置

如果需要通过代理访问 TMDB API，请在 Docker 环境变量中配置：

```bash
# 设置代理（如果需要）
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
export http_proxy=http://your-proxy:port
export https_proxy=http://your-proxy:port
```

### Docker Compose 配置

项目已自动支持代理配置，环境变量会传递给容器：

```yaml
environment:
  # TMDB API 代理配置（如果需要）
  HTTP_PROXY: ${HTTP_PROXY:-}
  HTTPS_PROXY: ${HTTPS_PROXY:-}
  http_proxy: ${http_proxy:-}
  https_proxy: ${https_proxy:-}
```

### 使用示例

1. **设置代理环境变量**：
   ```bash
   export HTTP_PROXY=http://192.168.1.108:7890
   export HTTPS_PROXY=http://192.168.1.108:7890
   ```

2. **启动服务**：
   ```bash
   docker-compose up -d
   ```

3. **验证功能**：
   - 打开艺人关联模态框
   - 切换到 "TMDB" 搜索模式
   - 搜索艺人名称
   - 点击 "创建并关联" 按钮

## API 接口

### 后端接口

- `GET /api/tmdb/search/person` - 搜索艺人
- `GET /api/tmdb/search/movie` - 搜索电影
- `GET /api/tmdb/movie/:movieId/cast` - 获取电影演员列表
- `GET /api/tmdb/person/:personId` - 获取艺人详情

### 前端功能

- 艺人搜索模态框支持 TMDB 搜索
- 艺人详情页面支持点击作品查看演员列表
- 自动创建 TMDB 艺人并关联照片

## 注意事项

1. **网络访问**：确保服务器能够访问 `api.themoviedb.org`
2. **代理配置**：如果网络环境需要代理，请正确配置代理环境变量
3. **API 限制**：TMDB API 有请求频率限制，请合理使用
4. **数据同步**：TMDB 数据会保存到本地数据库，支持离线查看

## 故障排除

### 常见问题

1. **TMDB 搜索无结果**：
   - 检查网络连接
   - 确认代理配置正确
   - 查看后端日志中的错误信息

2. **演员列表加载失败**：
   - 确认电影名称正确
   - 检查 TMDB 中是否存在该电影
   - 查看网络请求是否成功

3. **代理配置问题**：
   - 确认代理服务器地址和端口正确
   - 测试代理是否可用：`curl -x http://proxy:port https://api.themoviedb.org/3/movie/550`
   - 检查防火墙设置

### 调试方法

1. **查看后端日志**：
   ```bash
   docker logs photo-gallery-api
   ```

2. **测试 TMDB API**：
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.themoviedb.org/3/search/person?query=周杰伦
   ```

3. **检查环境变量**：
   ```bash
   docker exec photo-gallery-api env | grep -i proxy
   ```
