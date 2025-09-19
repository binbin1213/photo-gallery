// 简单的豆瓣API测试
const https = require('https');

// 豆瓣API配置
const DOUBAN_HOST = 'https://frodo.douban.com';
const API_KEY = '0ac44ae016490db2204ce0a042db2916';

// 测试不同的豆瓣API端点
const testEndpoints = [
  {
    name: '电影搜索 (v2)',
    url: `${DOUBAN_HOST}/api/v2/search/movie?q=周杰伦&apikey=${API_KEY}`
  },
  {
    name: '电影搜索 (v1)',
    url: `${DOUBAN_HOST}/api/v1/search/movie?q=周杰伦&apikey=${API_KEY}`
  },
  {
    name: '正在热映 (v2)',
    url: `${DOUBAN_HOST}/api/v2/movie/in_theaters?apikey=${API_KEY}`
  },
  {
    name: '正在热映 (v1)',
    url: `${DOUBAN_HOST}/api/v1/movie/in_theaters?apikey=${API_KEY}`
  },
  {
    name: 'Top250 (v2)',
    url: `${DOUBAN_HOST}/api/v2/movie/top250?apikey=${API_KEY}`
  },
  {
    name: 'Top250 (v1)',
    url: `${DOUBAN_HOST}/api/v1/movie/top250?apikey=${API_KEY}`
  },
  {
    name: '电影详情 (v2)',
    url: `${DOUBAN_HOST}/api/v2/movie/subject/1292052?apikey=${API_KEY}`
  },
  {
    name: '电影详情 (v1)',
    url: `${DOUBAN_HOST}/api/v1/movie/subject/1292052?apikey=${API_KEY}`
  },
  {
    name: '艺人搜索 (v2)',
    url: `${DOUBAN_HOST}/api/v2/search/celebrity?q=周杰伦&apikey=${API_KEY}`
  },
  {
    name: '艺人搜索 (v1)',
    url: `${DOUBAN_HOST}/api/v1/search/celebrity?q=周杰伦&apikey=${API_KEY}`
  }
];

// 使用https模块发送请求
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 测试所有端点
async function testAllEndpoints() {
  console.log('🔍 开始测试豆瓣API端点...\n');
  
  for (const endpoint of testEndpoints) {
    console.log(`📡 测试: ${endpoint.name}`);
    console.log(`🔗 URL: ${endpoint.url}`);
    
    try {
      const result = await makeRequest(endpoint.url);
      
      console.log(`✅ 状态码: ${result.status}`);
      console.log(`📊 返回数据:`);
      console.log(JSON.stringify(result.data, null, 2));
      
      // 分析数据结构
      if (result.data.subjects) {
        console.log(`\n🎭 找到 ${result.data.subjects.length} 个结果`);
        if (result.data.subjects.length > 0) {
          const first = result.data.subjects[0];
          console.log(`- 第一个结果: ${first.title || first.name || '未知'}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// 运行测试
testAllEndpoints().catch(console.error);
