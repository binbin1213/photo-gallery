import { useState, useEffect, useRef } from 'react'
import { Settings, Grid, List, Download, Shuffle, User } from 'lucide-react'
import PhotoGrid from '../components/PhotoGrid'
import SearchBar from '../components/SearchBar'
import AdminLoginModal from '../components/AdminLoginModal'
import { usePhotos } from '../hooks/usePhotos'
import { Photo } from '../types/photo'

export default function PhotoGallery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [shuffledPhotos, setShuffledPhotos] = useState<Photo[]>([])
  const [isShuffled, setIsShuffled] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const { data: photos, isLoading, error } = usePhotos(searchQuery)

  useEffect(() => {
    // 检查管理员登录状态是否过期（24小时）
    const loginTime = localStorage.getItem('adminLoginTime')
    const isAdmin = localStorage.getItem('isAdmin')
    if (loginTime && isAdmin === 'true') {
      const now = Date.now()
      if (now - parseInt(loginTime) > 24 * 60 * 60 * 1000) {
        // 登录已过期
        localStorage.removeItem('isAdmin')
        localStorage.removeItem('adminLoginTime')
      }
    }
  }, [])

  // 随机排序函数
  const shuffleArray = (array: Photo[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // 处理随机排序
  const handleShuffle = () => {
    if (photos) {
      if (isShuffled) {
        setIsShuffled(false)
        setShuffledPhotos([])
      } else {
        const shuffled = shuffleArray(photos)
        setShuffledPhotos(shuffled)
        setIsShuffled(true)
      }
    }
  }

  // 获取要显示的照片
  const displayPhotos = isShuffled ? shuffledPhotos : photos

  // 导出数据功能
  const handleExport = () => {
    if (photos) {
      const exportData = photos.map((photo: Photo) => ({
        id: photo.id,
        filename: photo.filename,
        chineseName: photo.chineseName,
        englishName: photo.englishName,
        tags: photo.tags
      }))
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `photo-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
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
    <div className="min-h-screen pt-24">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg fixed top-0 left-0 right-0 z-[99999]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
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
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-12 w-48 bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 py-2">
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
                      
                      <button
                        onClick={() => {
                          handleShuffle()
                          setShowSettings(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/50 flex items-center gap-2"
                      >
                        <Shuffle className="w-4 h-4" />
                        {isShuffled ? '恢复排序' : '随机排序'}
                      </button>
                      
                      <div className="border-t border-gray-200/50 mt-1 pt-1">
                        <button
                          onClick={() => {
                            const isAdmin = localStorage.getItem('isAdmin')
                            const loginTime = localStorage.getItem('adminLoginTime')
                            const now = Date.now()
                            
                            if (isAdmin === 'true' && loginTime && now - parseInt(loginTime) < 24 * 60 * 60 * 1000) {
                              // 已登录且未过期
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
                          管理面板
                        </button>
                        
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
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 text-white backdrop-blur-sm">
            加载照片时出错: {error.message}
          </div>
        )}

        {displayPhotos && (
          <PhotoGrid photos={displayPhotos} />
        )}
      </main>

      {/* 管理员登录弹窗 */}
      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          window.open('/admin', '_blank')
          setShowAdminLogin(false)
        }}
      />
    </div>
  )
}