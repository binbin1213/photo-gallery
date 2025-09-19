// 简单的TMDB API测试
const https = require('https');

// TMDB API配置
const TMDB_API_KEY = '0edaa05c0fcde2dbb17e7cd88d24f3d9';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 测试搜索艺人
async function testSearchPerson() {
  console.log('🔍 测试TMDB艺人搜索...\n');
  
  const searchQuery = '周杰伦';
  const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=zh-CN`;
  
  console.log(`📡 请求URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`✅ 状态码: ${response.status}`);
    console.log(`📊 返回数据:`);
    console.log(JSON.stringify(data, null, 2));
    
    // 分析搜索结果
    if (data.results && data.results.length > 0) {
      console.log(`\n🎭 找到 ${data.results.length} 个艺人:`);
      data.results.forEach((person, index) => {
        console.log(`${index + 1}. ${person.name}`);
        console.log(`   - ID: ${person.id}`);
        console.log(`   - 知名度: ${person.popularity}`);
        console.log(`   - 代表作品: ${person.known_for?.map(item => item.title || item.name).join(', ') || '无'}`);
        console.log(`   - 头像: ${person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : '无'}`);
        console.log('');
      });
    } else {
      console.log('❌ 没有找到相关艺人');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 测试获取艺人详情
async function testPersonDetails() {
  console.log('\n🔍 测试TMDB艺人详情...\n');
  
  const personId = 123456; // 使用一个测试ID
  const url = `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=zh-CN`;
  
  console.log(`📡 请求URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`✅ 状态码: ${response.status}`);
    console.log(`📊 返回数据:`);
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testSearchPerson();
  await testPersonDetails();
}

runTests().catch(console.error);
