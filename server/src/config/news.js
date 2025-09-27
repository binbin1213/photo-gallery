/**
 * 新闻API配置
 */

const newsConfig = {
    // World News API 配置
    apiKey: process.env.WORLD_NEWS_API_KEY,
    baseUrl: process.env.WORLD_NEWS_API_BASE_URL || 'https://api.worldnewsapi.com',
    
    // 缓存配置
    cacheDuration: parseInt(process.env.NEWS_CACHE_DURATION) || 30, // 分钟
    
    // 功能开关
    enabled: process.env.ENABLE_NEWS_FEATURE === 'true' || false,
    
    // 默认查询参数
    defaultParams: {
        language: 'zh',  // 中文新闻
        number: 10,      // 每次返回10条新闻
        sort: 'publish-time', // 按发布时间排序
        sort_direction: 'DESC' // 降序
    },
    
    // API限制
    limits: {
        maxNewsPerRequest: 50,
        maxSearchLength: 100
    }
};

module.exports = newsConfig;
