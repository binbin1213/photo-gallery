// API配置 - 根据环境自动切换
const getApiBaseUrl = () => {
  // 如果是HTTPS环境（外网访问），使用相对路径
  if (window.location.protocol === 'https:') {
    return '/api'
  }
  // 如果是HTTP环境（内网访问），使用完整地址
  return 'http://192.168.1.98:5551/api'
}

export const API_BASE_URL = getApiBaseUrl()
