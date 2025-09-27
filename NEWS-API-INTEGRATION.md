# 📰 新闻API集成指南

本文档说明如何在照片展示墙项目中集成和使用World News API功能。

## 🎯 功能概述

新集成的新闻API提供以下功能：
- 📰 **新闻搜索** - 根据关键词搜索相关新闻
- 🔥 **热门新闻** - 获取最新热门新闻
- 🔗 **内容提取** - 从URL提取新闻正文
- 💾 **智能缓存** - 减少API调用，提高响应速度

## 🔧 配置步骤

### 1. 设置API密钥

在 `server/.env` 文件中添加以下配置：

```bash
# World News API 配置
WORLD_NEWS_API_KEY=your-actual-api-key-here
WORLD_NEWS_API_BASE_URL=https://api.worldnewsapi.com

# 新闻功能配置
ENABLE_NEWS_FEATURE=true
NEWS_CACHE_DURATION=30
```

### 2. 安装和启动

SDK已经集成到项目中，直接启动服务即可：

```bash
# 启动Docker服务
docker-compose up -d

# 或本地开发模式
cd server
npm run dev
```

## 📡 API接口文档

所有新闻API的基础路径为 `/api/news`

### 🔍 搜索新闻
```http
GET /api/news/search?q=科技&language=zh&number=10
```

**参数说明:**
- `q` (必需) - 搜索关键词
- `language` - 语言代码 (默认: zh)
- `number` - 返回数量 (默认: 10, 最大: 50)
- `offset` - 偏移量 (默认: 0)
- `sort` - 排序方式 (publish-time, relevance)

**响应示例:**
```json
{
  "news": [
    {
      "title": "科技新闻标题",
      "summary": "新闻摘要...",
      "url": "https://example.com/news",
      "publish_date": "2024-12-19",
      "source_country": "CN"
    }
  ],
  "total": 100,
  "cached": false,
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

### 🔥 热门新闻
```http
GET /api/news/top?language=zh&country=CN&category=general
```

**参数说明:**
- `language` - 语言代码 (默认: zh)
- `country` - 国家代码 (默认: CN)
- `category` - 新闻分类 (general, business, technology等)
- `number` - 返回数量 (默认: 10)

### 🔗 内容提取
```http
GET /api/news/extract?url=https://example.com/news-article
```

**参数说明:**
- `url` (必需) - 要提取内容的新闻URL

### 📊 服务状态
```http
GET /api/news/status
```

返回新闻服务的当前状态和配置信息。

## 🧪 测试SDK集成

使用提供的测试脚本验证集成是否成功：

```bash
# 1. 编辑测试文件，设置您的API密钥
vim test-news-api.js

# 2. 运行测试
node test-news-api.js
```

测试脚本会验证：
- ✅ API连接状态
- ✅ 搜索新闻功能
- ✅ 热门新闻功能

## 💾 缓存机制

为了提高性能和减少API调用：

- **缓存时长**: 30分钟 (可配置)
- **缓存策略**: 基于请求参数的内存缓存
- **缓存标识**: 自动在响应中标明是否来自缓存

## 🚨 错误处理

API会返回标准化的错误响应：

```json
{
  "error": "错误描述",
  "code": "ERROR_CODE", 
  "message": "详细错误信息"
}
```

**常见错误代码:**
- `NEWS_DISABLED` - 新闻功能已禁用
- `API_KEY_MISSING` - API密钥未配置
- `QUERY_REQUIRED` - 搜索关键词为空
- `QUERY_TOO_LONG` - 搜索关键词过长
- `INVALID_URL` - 无效的URL格式

## 🔧 开发指南

### 前端集成示例

```typescript
// 搜索新闻
const searchNews = async (query: string) => {
  try {
    const response = await fetch(`/api/news/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('搜索新闻失败:', error);
  }
};

// 获取热门新闻
const getTopNews = async () => {
  try {
    const response = await fetch('/api/news/top');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取热门新闻失败:', error);
  }
};
```

### React组件示例

```typescript
import { useQuery } from '@tanstack/react-query';

const NewsComponent = () => {
  const { data: topNews, isLoading } = useQuery({
    queryKey: ['topNews'],
    queryFn: () => fetch('/api/news/top').then(res => res.json()),
    staleTime: 30 * 60 * 1000, // 30分钟
  });

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      {topNews?.news?.map(article => (
        <div key={article.url}>
          <h3>{article.title}</h3>
          <p>{article.summary}</p>
        </div>
      ))}
    </div>
  );
};
```

## 📝 配置文件

### 新闻配置 (`server/src/config/news.js`)
包含所有新闻API的配置选项，如默认参数、限制等。

### API路由 (`server/src/routes/news.js`)
包含所有新闻相关的API端点实现。

## 🚀 生产部署

确保在生产环境中：

1. **设置正确的API密钥**
2. **配置合适的缓存时长**
3. **监控API使用量**
4. **设置日志记录**

## 💡 扩展建议

可以考虑添加的功能：
- 🏷️ 新闻分类和标签
- 🔔 新闻订阅和通知
- 📊 新闻统计和分析
- 🌐 多语言新闻支持
- 📱 移动端优化

## 🆘 故障排除

**问题1: API密钥无效**
- 检查密钥是否正确设置
- 确认API账户状态正常

**问题2: 网络连接失败**
- 检查网络连接
- 确认防火墙设置

**问题3: 缓存问题**
- 重启服务清空缓存
- 调整缓存时长配置

**问题4: 权限错误**
- 检查API配额使用情况
- 确认账户权限设置

---

✨ **新闻API集成完成！** 现在可以在照片展示墙中添加丰富的新闻内容了。
