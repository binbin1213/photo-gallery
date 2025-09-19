#!/usr/bin/env node

/**
 * TMDB集成功能测试脚本
 * 测试后端API接口是否正常工作
 */

const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

// 配置
const API_BASE_URL = 'http://localhost:5551'; // 本地API地址
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZWRhYTA1YzBmY2RlMmRiYjE3ZTdjZDg4ZDI0ZjNkOSIsIm5iZiI6MTU5OTk2NjM5MS43NDcsInN1YiI6IjVmNWQ4Y2I3NjNkOTM3MDAzNmJiMmZjMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.saAFMNKEZz_51mxXyTq-CjJSMI3Tjpk6KzTmbYQqaCo';

// 代理配置
const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy || 'http://192.168.1.108:7890';
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

// 测试用例
const testCases = [
  {
    name: '搜索艺人 - 周杰伦',
    url: `${API_BASE_URL}/api/tmdb/search/person?query=周杰伦&limit=5`,
    method: 'GET'
  },
  {
    name: '搜索艺人 - 英文名',
    url: `${API_BASE_URL}/api/tmdb/search/person?query=Jay Chou&limit=5`,
    method: 'GET'
  },
  {
    name: '搜索电影 - 泰坦尼克号',
    url: `${API_BASE_URL}/api/tmdb/search/movie?query=泰坦尼克号&limit=3`,
    method: 'GET'
  },
  {
    name: '搜索电影 - 英文名',
    url: `${API_BASE_URL}/api/tmdb/search/movie?query=Titanic&limit=3`,
    method: 'GET'
  }
];

// 发送HTTP请求
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'TMDB-Integration-Test/1.0',
        'Accept': 'application/json'
      },
      agent: agent
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: result
          });
        } catch (e) {
          reject(new Error(`JSON解析失败: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`请求失败: ${e.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

// 运行测试
async function runTests() {
  console.log('🧪 开始TMDB集成功能测试...\n');
  
  if (proxyUrl) {
    console.log(`🌐 使用代理: ${proxyUrl}\n`);
  } else {
    console.log('🌐 直连模式（无代理）\n');
  }

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📋 测试: ${testCase.name}`);
    console.log(`🔗 URL: ${testCase.url}`);
    
    try {
      const result = await makeRequest(testCase.url, testCase.method);
      
      if (result.status === 200) {
        console.log(`✅ 状态: ${result.status} - 成功`);
        
        // 检查返回数据结构
        if (testCase.url.includes('/search/person')) {
          if (result.data.results && Array.isArray(result.data.results)) {
            console.log(`📊 找到 ${result.data.results.length} 个艺人`);
            if (result.data.results.length > 0) {
              const first = result.data.results[0];
              console.log(`👤 第一个结果: ${first.chineseName} (${first.englishName})`);
            }
          } else {
            console.log('⚠️  返回数据格式异常');
          }
        } else if (testCase.url.includes('/search/movie')) {
          if (result.data.results && Array.isArray(result.data.results)) {
            console.log(`📊 找到 ${result.data.results.length} 部电影`);
            if (result.data.results.length > 0) {
              const first = result.data.results[0];
              console.log(`🎬 第一部电影: ${first.title} (${first.releaseDate})`);
            }
          } else {
            console.log('⚠️  返回数据格式异常');
          }
        }
        
        passedTests++;
      } else {
        console.log(`❌ 状态: ${result.status} - 失败`);
        console.log(`📄 响应: ${JSON.stringify(result.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  // 测试结果汇总
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！TMDB集成功能正常工作。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置和网络连接。');
  }

  // 额外测试：获取演员列表
  if (passedTests > 0) {
    console.log('\n🎭 测试演员列表功能...');
    try {
      // 先搜索一个电影
      const movieResult = await makeRequest(`${API_BASE_URL}/api/tmdb/search/movie?query=Titanic&limit=1`);
      if (movieResult.status === 200 && movieResult.data.results.length > 0) {
        const movie = movieResult.data.results[0];
        console.log(`🎬 找到电影: ${movie.title} (ID: ${movie.id})`);
        
        // 获取演员列表
        const castResult = await makeRequest(`${API_BASE_URL}/api/tmdb/movie/${movie.id}/cast`);
        if (castResult.status === 200) {
          console.log(`✅ 成功获取演员列表: ${castResult.data.castCount} 位演员`);
          if (castResult.data.cast.length > 0) {
            const firstActor = castResult.data.cast[0];
            console.log(`👤 第一位演员: ${firstActor.name} (饰演: ${firstActor.character})`);
          }
        } else {
          console.log(`❌ 获取演员列表失败: ${castResult.status}`);
        }
      }
    } catch (error) {
      console.log(`❌ 演员列表测试失败: ${error.message}`);
    }
  }
}

// 检查API服务是否运行
async function checkAPIService() {
  try {
    const result = await makeRequest(`${API_BASE_URL}/api/stats`);
    if (result.status === 200) {
      console.log('✅ API服务运行正常');
      return true;
    } else {
      console.log(`❌ API服务响应异常: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 无法连接到API服务: ${error.message}`);
    console.log('💡 请确保后端服务正在运行: docker-compose up -d');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 TMDB集成功能测试工具\n');
  
  // 检查API服务
  const apiRunning = await checkAPIService();
  if (!apiRunning) {
    process.exit(1);
  }
  
  console.log('');
  
  // 运行测试
  await runTests();
}

// 运行测试
main().catch(console.error);
