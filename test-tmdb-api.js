// TMDB API测试脚本
const https = require('https');

// TMDB API配置
const TMDB_API_KEY = '0edaa05c0fcde2dbb17e7cd88d24f3d9';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZWRhYTA1YzBmY2RlMmRiYjE3ZTdjZDg4ZDI0ZjNkOSIsIm5iZiI6MTU5OTk2NjM5MS43NDcsInN1YiI6IjVmNWQ4Y2I3NjNkOTM3MDAzNmJiMmZjMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.saAFMNKEZz_51mxXyTq-CjJSMI3Tjpk6KzTmbYQqaCo';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 测试不同的TMDB API端点
const testEndpoints = [
  {
    name: '搜索艺人',
    url: `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=周杰伦&language=zh-CN`
  },
  {
    name: '搜索电影',
    url: `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=周杰伦&language=zh-CN`
  },
  {
    name: '热门艺人',
    url: `${TMDB_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}&language=zh-CN`
  },
  {
    name: '艺人详情',
    url: `${TMDB_BASE_URL}/person/123456?api_key=${TMDB_API_KEY}&language=zh-CN`
  },
  {
    name: '电影详情',
    url: `${TMDB_BASE_URL}/movie/550?api_key=${TMDB_API_KEY}&language=zh-CN`
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
  console.log('🔍 开始测试TMDB API...\n');
  
  for (const endpoint of testEndpoints) {
    console.log(`📡 测试: ${endpoint.name}`);
    console.log(`🔗 URL: ${endpoint.url}`);
    
    try {
      const result = await makeRequest(endpoint.url);
      
      console.log(`✅ 状态码: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`📊 返回数据:`);
        console.log(JSON.stringify(result.data, null, 2));
        
        // 分析数据结构
        if (result.data.results) {
          console.log(`\n🎭 找到 ${result.data.results.length} 个结果`);
          if (result.data.results.length > 0) {
            const first = result.data.results[0];
            console.log(`- 第一个结果: ${first.name || first.title || '未知'}`);
            if (first.known_for) {
              console.log(`- 代表作品: ${first.known_for.map(item => item.title || item.name).join(', ')}`);
            }
          }
        }
      } else {
        console.log(`❌ 请求失败: ${result.data.status_message || '未知错误'}`);
      }
      
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// 运行测试
testAllEndpoints().catch(console.error);
