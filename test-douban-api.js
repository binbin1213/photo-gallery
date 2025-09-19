const https = require('https');

// 豆瓣API测试
async function testDoubanAPI() {
  console.log('🔍 开始测试豆瓣API...\n');
  
  // 测试搜索艺人
  const searchQuery = '周杰伦';
  const apiUrl = `https://api.douban.com/v2/movie/search?q=${encodeURIComponent(searchQuery)}`;
  
  console.log(`📡 请求URL: ${apiUrl}`);
  console.log('⏳ 发送请求...\n');
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('✅ 请求成功！');
    console.log('📊 返回数据结构:');
    console.log(JSON.stringify(data, null, 2));
    
    // 分析数据结构
    if (data.subjects && data.subjects.length > 0) {
      console.log('\n🎭 艺人信息示例:');
      const firstSubject = data.subjects[0];
      console.log(`- 标题: ${firstSubject.title}`);
      console.log(`- 年份: ${firstSubject.year}`);
      console.log(`- 类型: ${firstSubject.genres?.join(', ')}`);
      console.log(`- 评分: ${firstSubject.rating?.average}`);
      console.log(`- 演员: ${firstSubject.casts?.map(cast => cast.name).join(', ')}`);
      console.log(`- 导演: ${firstSubject.directors?.map(dir => dir.name).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    
    // 尝试其他API端点
    console.log('\n🔄 尝试其他API端点...');
    await testAlternativeEndpoints();
  }
}

// 测试其他可能的API端点
async function testAlternativeEndpoints() {
  const endpoints = [
    'https://api.douban.com/v2/movie/in_theaters',
    'https://api.douban.com/v2/movie/top250',
    'https://api.douban.com/v2/movie/search?q=电影'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 测试: ${endpoint}`);
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log('✅ 成功！数据结构:');
      console.log(JSON.stringify(data, null, 2));
      break;
      
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
    }
  }
}

// 运行测试
testDoubanAPI();
