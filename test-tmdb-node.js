// TMDB API测试 - 使用Node.js原生https模块
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

// TMDB API配置
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZWRhYTA1YzBmY2RlMmRiYjE3ZTdjZDg4ZDI0ZjNkOSIsIm5iZiI6MTU5OTk2NjM5MS43NDcsInN1YiI6IjVmNWQ4Y2I3NjNkOTM3MDAzNmJiMmZjMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.saAFMNKEZz_51mxXyTq-CjJSMI3Tjpk6KzTmbYQqaCo';
const TMDB_BASE_URL = 'api.themoviedb.org';

// 使用Node.js原生https模块发送请求
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    // 配置代理
    const proxyUrl = 'http://192.168.1.108:7890';
    const agent = new HttpsProxyAgent(proxyUrl);
    
    const options = {
      hostname: TMDB_BASE_URL,
      port: 443,
      path: path,
      method: 'GET',
      agent: agent,
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
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
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.end();
  });
}

// 测试TMDB API
async function testTMDB() {
  console.log('🔍 开始测试TMDB API...\n');
  
  // 测试1: 搜索艺人
  console.log('📡 测试1: 搜索艺人 - 周杰伦');
  try {
    const searchPath = `/3/search/person?query=${encodeURIComponent('周杰伦')}&language=zh-CN&include_adult=false&page=1`;
    const result = await makeRequest(searchPath);
    
    console.log(`✅ 状态码: ${result.status}`);
    if (result.status === 200) {
      console.log(`📊 找到 ${result.data.results.length} 个结果`);
      if (result.data.results.length > 0) {
        const first = result.data.results[0];
        console.log(`- 第一个结果: ${first.name}`);
        console.log(`- ID: ${first.id}`);
        console.log(`- 知名度: ${first.popularity}`);
        console.log(`- 代表作品: ${first.known_for?.map(item => item.title || item.name).join(', ') || '无'}`);
      }
    } else {
      console.log(`❌ 请求失败: ${result.data.status_message || '未知错误'}`);
    }
  } catch (error) {
    console.log(`❌ 搜索失败: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试2: 获取艺人详情
  console.log('📡 测试2: 获取艺人详情 - ID 123456');
  try {
    const detailPath = `/3/person/123456?language=zh-CN`;
    const result = await makeRequest(detailPath);
    
    console.log(`✅ 状态码: ${result.status}`);
    if (result.status === 200) {
      console.log(`📊 艺人信息:`);
      console.log(`- 姓名: ${result.data.name}`);
      console.log(`- 出生日期: ${result.data.birthday}`);
      console.log(`- 出生地: ${result.data.place_of_birth}`);
      console.log(`- 职业: ${result.data.known_for_department}`);
      console.log(`- 知名度: ${result.data.popularity}`);
      console.log(`- 头像: ${result.data.profile_path ? `https://image.tmdb.org/t/p/w500${result.data.profile_path}` : '无'}`);
    } else {
      console.log(`❌ 请求失败: ${result.data.status_message || '未知错误'}`);
    }
  } catch (error) {
    console.log(`❌ 详情获取失败: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试3: 搜索电影
  console.log('📡 测试3: 搜索电影 - 周杰伦');
  try {
    const moviePath = `/3/search/movie?query=${encodeURIComponent('周杰伦')}&language=zh-CN&include_adult=false&page=1`;
    const result = await makeRequest(moviePath);
    
    console.log(`✅ 状态码: ${result.status}`);
    if (result.status === 200) {
      console.log(`📊 找到 ${result.data.results.length} 个电影结果`);
      if (result.data.results.length > 0) {
        const first = result.data.results[0];
        console.log(`- 第一个结果: ${first.title}`);
        console.log(`- 上映日期: ${first.release_date}`);
        console.log(`- 评分: ${first.vote_average}`);
      }
    } else {
      console.log(`❌ 请求失败: ${result.data.status_message || '未知错误'}`);
    }
  } catch (error) {
    console.log(`❌ 电影搜索失败: ${error.message}`);
  }
}

// 运行测试
testTMDB().catch(console.error);
