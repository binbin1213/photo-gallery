// 高级豆瓣API测试 - 尝试不同的请求方式
const https = require('https');

// 豆瓣API配置
const DOUBAN_HOST = 'frodo.douban.com';
const API_KEY = '0ac44ae016490db2204ce0a042db2916';

// 测试不同的API路径和请求方式
const testConfigs = [
  {
    name: '电影搜索 - 标准路径',
    path: '/api/v2/search/movie?q=周杰伦&apikey=' + API_KEY,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://movie.douban.com/'
    }
  },
  {
    name: '电影搜索 - 简化路径',
    path: '/v2/search/movie?q=周杰伦&apikey=' + API_KEY,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://movie.douban.com/'
    }
  },
  {
    name: '正在热映 - 标准路径',
    path: '/api/v2/movie/in_theaters?apikey=' + API_KEY,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://movie.douban.com/'
    }
  },
  {
    name: 'Top250 - 标准路径',
    path: '/api/v2/movie/top250?apikey=' + API_KEY,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://movie.douban.com/'
    }
  },
  {
    name: '电影详情 - 标准路径',
    path: '/api/v2/movie/subject/1292052?apikey=' + API_KEY,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://movie.douban.com/'
    }
  }
];

// 使用https模块发送请求
function makeRequest(config) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOUBAN_HOST,
      port: 443,
      path: config.path,
      method: 'GET',
      headers: config.headers
    };
    
    const req = https.request(options, (res) => {
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
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data, // 返回原始数据
            parseError: error.message
          });
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
    
    req.end();
  });
}

// 测试所有配置
async function testAllConfigs() {
  console.log('🔍 开始高级豆瓣API测试...\n');
  
  for (const config of testConfigs) {
    console.log(`📡 测试: ${config.name}`);
    console.log(`🔗 路径: ${config.path}`);
    console.log(`📋 请求头:`, config.headers);
    
    try {
      const result = await makeRequest(config);
      
      console.log(`✅ 状态码: ${result.status}`);
      console.log(`📊 响应头:`, result.headers);
      console.log(`📊 返回数据:`);
      
      if (result.parseError) {
        console.log(`❌ JSON解析失败: ${result.parseError}`);
        console.log(`📄 原始数据: ${result.data}`);
      } else {
        console.log(JSON.stringify(result.data, null, 2));
        
        // 分析数据结构
        if (result.data.subjects) {
          console.log(`\n🎭 找到 ${result.data.subjects.length} 个结果`);
          if (result.data.subjects.length > 0) {
            const first = result.data.subjects[0];
            console.log(`- 第一个结果: ${first.title || first.name || '未知'}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// 运行测试
testAllConfigs().catch(console.error);
