// API配置 - 根据环境自动切换
const getApiBaseUrl = () => {
  // 如果是HTTPS环境（外网访问），使用外网API域名
  if (window.location.protocol === 'https:') {
    // 外网访问时，使用ddnsto映射的API域名
    const apiUrl = 'https://api-gmmlsls.gd.ddnsto.com/api'
    console.log('🌐 外网HTTPS环境，使用外网API地址:', apiUrl)
    return apiUrl
  }
  
  // 如果是HTTP环境（内网访问），使用相对路径让Nginx代理
  console.log('🏠 内网HTTP环境，使用相对路径 /api')
  return '/api'
}

export const API_BASE_URL = getApiBaseUrl()
