/**
 * 新闻API测试脚本
 * 用于验证World News API SDK集成是否正常
 */

const { NewsApi, ApiClient } = require('./server/javascript-client/dist/index');

// 测试配置
const testConfig = {
    apiKey: 'YOUR_API_KEY_HERE', // 请替换为您的实际API密钥
    baseUrl: 'https://api.worldnewsapi.com'
};

// 初始化API客户端
function createNewsApiClient() {
    const apiClient = new ApiClient();
    apiClient.basePath = testConfig.baseUrl;
    apiClient.apiKey = testConfig.apiKey;
    
    return new NewsApi(apiClient);
}

// 测试搜索新闻
async function testSearchNews() {
    console.log('\n🔍 测试搜索新闻功能...');
    
    try {
        const newsApi = createNewsApiClient();
        
        const searchParams = {
            text: '科技',
            language: 'zh',
            number: 5,
            sort: 'publish-time',
            'sort-direction': 'DESC'
        };
        
        console.log('搜索参数:', searchParams);
        
        const response = await newsApi.searchNews(searchParams);
        
        console.log('✅ 搜索成功!');
        console.log(`📰 找到 ${response.available || 0} 条相关新闻`);
        console.log(`📄 返回 ${response.news?.length || 0} 条新闻`);
        
        if (response.news && response.news.length > 0) {
            console.log('\n📝 第一条新闻:');
            const firstNews = response.news[0];
            console.log(`标题: ${firstNews.title || '无标题'}`);
            console.log(`摘要: ${firstNews.summary ? firstNews.summary.substring(0, 100) + '...' : '无摘要'}`);
            console.log(`发布时间: ${firstNews.publish_date || '未知'}`);
            console.log(`来源: ${firstNews.source_country || '未知'}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ 搜索新闻失败:', error.message);
        return false;
    }
}

// 测试热门新闻
async function testTopNews() {
    console.log('\n🔥 测试热门新闻功能...');
    
    try {
        const newsApi = createNewsApiClient();
        
        const topParams = {
            language: 'zh',
            country: 'CN',
            category: 'general',
            number: 5
        };
        
        console.log('查询参数:', topParams);
        
        const response = await newsApi.topNews(topParams);
        
        console.log('✅ 获取热门新闻成功!');
        console.log(`📄 返回 ${response.top_news?.length || 0} 条热门新闻`);
        
        if (response.top_news && response.top_news.length > 0) {
            console.log('\n📝 第一条热门新闻:');
            const firstNews = response.top_news[0];
            const firstArticle = firstNews.news?.[0];
            if (firstArticle) {
                console.log(`标题: ${firstArticle.title || '无标题'}`);
                console.log(`摘要: ${firstArticle.summary ? firstArticle.summary.substring(0, 100) + '...' : '无摘要'}`);
                console.log(`发布时间: ${firstArticle.publish_date || '未知'}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ 获取热门新闻失败:', error.message);
        return false;
    }
}

// 测试API状态
async function testApiStatus() {
    console.log('\n🔧 测试API连接状态...');
    
    if (!testConfig.apiKey || testConfig.apiKey === 'YOUR_API_KEY_HERE') {
        console.error('❌ API密钥未配置');
        console.log('📝 请在此文件顶部设置您的实际API密钥');
        return false;
    }
    
    try {
        const newsApi = createNewsApiClient();
        
        // 尝试一个简单的搜索请求来测试连接
        await newsApi.searchNews({
            text: 'test',
            language: 'en',
            number: 1
        });
        
        console.log('✅ API连接正常');
        return true;
    } catch (error) {
        console.error('❌ API连接失败:', error.message);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('🔑 可能是API密钥无效，请检查密钥是否正确');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            console.log('🚫 可能是API配额不足或权限问题');
        } else if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
            console.log('🌐 网络连接问题，请检查网络连接');
        }
        
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🧪 开始新闻API集成测试...');
    console.log('=' .repeat(50));
    
    const results = {
        apiStatus: await testApiStatus(),
        searchNews: false,
        topNews: false
    };
    
    if (results.apiStatus) {
        results.searchNews = await testSearchNews();
        results.topNews = await testTopNews();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果汇总:');
    console.log(`API连接: ${results.apiStatus ? '✅ 通过' : '❌ 失败'}`);
    console.log(`搜索新闻: ${results.searchNews ? '✅ 通过' : '❌ 失败'}`);
    console.log(`热门新闻: ${results.topNews ? '✅ 通过' : '❌ 失败'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 测试通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过! SDK集成成功!');
    } else {
        console.log('⚠️  部分测试失败，请检查配置和网络连接');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testSearchNews,
    testTopNews,
    testApiStatus,
    runTests
};
