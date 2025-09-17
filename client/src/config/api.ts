// API配置 - 根据环境自动切换
const getApiBaseUrl = () => {
  // 如果是HTTPS环境（外网访问），使用相对路径
  if (window.location.protocol === 'https:') {
    return '/api'
  }
  
  // 如果是HTTP环境（内网访问）
  const hostname = window.location.hostname
  const currentPort = window.location.port || '80'
  
  // 根据前端端口推断后端端口
  let apiPort = '5551' // 默认后端端口
  
  if (currentPort === '8881') {
    // 如果前端在8881端口，后端在5551端口
    apiPort = '5551'
  } else if (currentPort === '80') {
    // 如果前端在80端口，后端在5551端口
    apiPort = '5551'
  } else if (currentPort === '3000') {
    // 开发环境，前端在3000端口，后端在5000端口
    apiPort = '5000'
  }
  
  return `http://${hostname}:${apiPort}/api`
}

export const API_BASE_URL = getApiBaseUrl()
