import { useState, useEffect, useRef } from 'react'
import { Settings, Grid, List, Download, User } from 'lucide-react'
import InfinitePhotoGrid from '../components/InfinitePhotoGrid'
import SearchBar from '../components/SearchBar'
import AdminLoginModal from '../components/AdminLoginModal'
// 移除usePhotos，改用InfinitePhotoGrid
import { Photo } from '../types/photo'

export default function PhotoGallery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // 移除随机排序相关状态，改用InfinitePhotoGrid
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [replacingPhoto, setReplacingPhoto] = useState<Photo | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  // 移除旧的usePhotos，改用InfinitePhotoGrid内部管理

  useEffect(() => {
    // 检查管理员登录状态是否过期（24小时）
    const loginTime = localStorage.getItem('adminLoginTime')
    const adminStatus = localStorage.getItem('isAdmin')
    if (loginTime && adminStatus === 'true') {
      const now = Date.now()
      if (now - parseInt(loginTime) > 24 * 60 * 60 * 1000) {
        // 登录已过期
        localStorage.removeItem('isAdmin')
        localStorage.removeItem('adminLoginTime')
        setIsAdmin(false)
      } else {
        setIsAdmin(true)
      }
    } else {
      setIsAdmin(false)
    }
  }, [])

  // 移除随机排序函数，改用InfinitePhotoGrid

  // 移除随机排序功能

  // 处理图片替换
  const handleReplacePhoto = (photo: Photo) => {
    setReplacingPhoto(photo)
  }

  // 处理替换文件上传
  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingPhoto) return

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch(`http://192.168.1.98:5551/api/photos/${replacingPhoto.filename}/replace`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        alert('照片替换成功！')
        window.location.reload()
      } else {
        alert('替换失败：' + result.error)
      }
    } catch (error) {
      console.error('替换错误:', error)
      alert('替换失败：' + error)
    } finally {
      setReplacingPhoto(null)
    }
  }

  // 移除displayPhotos，改用InfinitePhotoGrid

  // 导出数据功能 - 简化版本
  const handleExport = () => {
    alert('导出功能已移至管理面板')
  }

  // 点击外部关闭设置菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-900 pt-24">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              泰海男星图鉴
            </h1>
            <div className="flex items-center gap-4">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索姓名..."
              />
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-200/50">
                        显示选项
                      </div>
                      
                      <button
                        onClick={() => {
                          setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                          setShowSettings(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/50 flex items-center gap-2"
                      >
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                        {viewMode === 'grid' ? '列表视图' : '网格视图'}
                      </button>
                      
                        {/* 移除随机排序按钮 */}
                      
                      <div className="border-t border-gray-200/50 mt-1 pt-1">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                // 进入管理面板
                                window.open('/admin', '_blank')
                                setShowSettings(false)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <User className="w-4 h-4" />
                              进入管理面板
                            </button>
                            <button
                              onClick={() => {
                                // 退出管理员模式
                                localStorage.removeItem('isAdmin')
                                localStorage.removeItem('adminLoginTime')
                                setIsAdmin(false)
                                setShowSettings(false)
                                alert('已退出管理员模式')
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <User className="w-4 h-4" />
                              退出管理员
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              const isAdmin = localStorage.getItem('isAdmin')
                              const loginTime = localStorage.getItem('adminLoginTime')
                              const now = Date.now()
                              
                              if (isAdmin === 'true' && loginTime && now - parseInt(loginTime) < 24 * 60 * 60 * 1000) {
                                // 已登录且未过期
                                setIsAdmin(true) // 确保当前页面状态正确
                                window.open('/admin', '_blank')
                              } else {
                                // 未登录或已过期
                                setShowAdminLogin(true)
                              }
                              setShowSettings(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/50 flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            管理员登录
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            handleExport()
                            setShowSettings(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/50 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          导出数据
                        </button>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <InfinitePhotoGrid 
          isAdmin={isAdmin}
          onReplace={handleReplacePhoto}
          search={searchQuery}
        />
      </main>

      {/* 管理员登录弹窗 */}
      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          setIsAdmin(true) // 立即更新当前页面的管理员状态
          window.open('/admin', '_blank')
          setShowAdminLogin(false)
        }}
      />

      {/* 隐藏的文件输入框用于替换 */}
      <input
        type="file"
        accept="image/*"
        onChange={handleReplaceUpload}
        style={{ display: 'none' }}
        id="replace-photo-input"
      />
    </div>
  )
}