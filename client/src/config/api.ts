// API配置 - 统一使用相对路径，让Nginx处理代理
const getApiBaseUrl = () => {
  // 无论是内网还是外网访问，都使用相对路径
  // Nginx会处理代理到后端API服务
  console.log('🌐 使用相对路径 /api，由Nginx代理到后端')
  return '/api'
}

export const API_BASE_URL = getApiBaseUrl()
