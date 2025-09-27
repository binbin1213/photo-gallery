const express = require('express');
const { NewsApi, ApiClient } = require('../../javascript-client/dist/index');
const newsConfig = require('../config/news');

const router = express.Router();

// 检查新闻功能是否启用
const checkNewsEnabled = (req, res, next) => {
    if (!newsConfig.enabled) {
        return res.status(503).json({
            error: '新闻功能已禁用',
            code: 'NEWS_DISABLED'
        });
    }
    if (!newsConfig.apiKey) {
        return res.status(500).json({
            error: '新闻API密钥未配置',
            code: 'API_KEY_MISSING'
        });
    }
    next();
};

// 初始化新闻API客户端
const getNewsApiClient = () => {
    const apiClient = new ApiClient();
    apiClient.basePath = newsConfig.baseUrl;
    apiClient.apiKey = newsConfig.apiKey;
    
    const newsApi = new NewsApi(apiClient);
    return newsApi;
};

// 内存缓存
const cache = new Map();
const getCacheKey = (endpoint, params) => {
    return `${endpoint}_${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < newsConfig.cacheDuration * 60 * 1000) {
        return cached.data;
    }
    cache.delete(key);
    return null;
};

const setCache = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

/**
 * GET /api/news/search
 * 搜索新闻
 */
router.get('/search', checkNewsEnabled, async (req, res) => {
    try {
        const {
            q: query,
            language = newsConfig.defaultParams.language,
            number = newsConfig.defaultParams.number,
            offset = 0,
            sort = newsConfig.defaultParams.sort,
            sort_direction = newsConfig.defaultParams.sort_direction
        } = req.query;

        if (!query) {
            return res.status(400).json({
                error: '搜索关键词不能为空',
                code: 'QUERY_REQUIRED'
            });
        }

        if (query.length > newsConfig.limits.maxSearchLength) {
            return res.status(400).json({
                error: `搜索关键词长度不能超过${newsConfig.limits.maxSearchLength}个字符`,
                code: 'QUERY_TOO_LONG'
            });
        }

        const params = {
            text: query,
            language,
            number: Math.min(number, newsConfig.limits.maxNewsPerRequest),
            offset,
            sort,
            'sort-direction': sort_direction
        };

        // 检查缓存
        const cacheKey = getCacheKey('search', params);
        let cachedData = getFromCache(cacheKey);
        if (cachedData) {
            return res.json({
                ...cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        const newsApi = getNewsApiClient();
        const response = await newsApi.searchNews(params);

        const result = {
            news: response.news || [],
            total: response.available || 0,
            query: query,
            language: language,
            cached: false,
            timestamp: new Date().toISOString()
        };

        // 设置缓存
        setCache(cacheKey, result);

        res.json(result);
    } catch (error) {
        console.error('搜索新闻错误:', error);
        res.status(500).json({
            error: '搜索新闻失败',
            message: error.message || '未知错误',
            code: 'SEARCH_FAILED'
        });
    }
});

/**
 * GET /api/news/top
 * 获取热门新闻
 */
router.get('/top', checkNewsEnabled, async (req, res) => {
    try {
        const {
            language = newsConfig.defaultParams.language,
            country = 'CN',
            category = 'general',
            number = newsConfig.defaultParams.number
        } = req.query;

        const params = {
            language,
            country,
            category,
            number: Math.min(number, newsConfig.limits.maxNewsPerRequest)
        };

        // 检查缓存
        const cacheKey = getCacheKey('top', params);
        let cachedData = getFromCache(cacheKey);
        if (cachedData) {
            return res.json({
                ...cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        const newsApi = getNewsApiClient();
        const response = await newsApi.topNews(params);

        const result = {
            news: response.top_news || [],
            language: language,
            country: country,
            category: category,
            cached: false,
            timestamp: new Date().toISOString()
        };

        // 设置缓存
        setCache(cacheKey, result);

        res.json(result);
    } catch (error) {
        console.error('获取热门新闻错误:', error);
        res.status(500).json({
            error: '获取热门新闻失败',
            message: error.message || '未知错误',
            code: 'TOP_NEWS_FAILED'
        });
    }
});

/**
 * GET /api/news/extract
 * 从URL提取新闻内容
 */
router.get('/extract', checkNewsEnabled, async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                error: '新闻URL不能为空',
                code: 'URL_REQUIRED'
            });
        }

        // 简单的URL验证
        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                error: '无效的URL格式',
                code: 'INVALID_URL'
            });
        }

        const params = { url };

        // 检查缓存
        const cacheKey = getCacheKey('extract', params);
        let cachedData = getFromCache(cacheKey);
        if (cachedData) {
            return res.json({
                ...cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        const newsApi = getNewsApiClient();
        const response = await newsApi.extractNews(params);

        const result = {
            ...response,
            cached: false,
            timestamp: new Date().toISOString()
        };

        // 设置缓存
        setCache(cacheKey, result);

        res.json(result);
    } catch (error) {
        console.error('提取新闻内容错误:', error);
        res.status(500).json({
            error: '提取新闻内容失败',
            message: error.message || '未知错误',
            code: 'EXTRACT_FAILED'
        });
    }
});

/**
 * GET /api/news/status
 * 检查新闻服务状态
 */
router.get('/status', (req, res) => {
    res.json({
        enabled: newsConfig.enabled,
        hasApiKey: !!newsConfig.apiKey,
        cacheSize: cache.size,
        cacheDuration: newsConfig.cacheDuration,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
