import { useState, useEffect, useRef } from 'react'
import { Settings, Grid, List, Download, User, Filter } from 'lucide-react'
import InfinitePhotoGrid from '../components/InfinitePhotoGrid'
import SearchBar from '../components/SearchBar'
import AdminLoginModal from '../components/AdminLoginModal'
import StatsPanel from '../components/StatsPanel'
import FilterPanel from '../components/FilterPanel'
import BirthdaySidebar from '../components/BirthdaySidebar'
import { useAdmin } from '../contexts/AdminContext'
// 移除usePhotos，改用InfinitePhotoGrid
import { Photo } from '../types/photo'
import { API_BASE_URL } from '../config/api'

export default function PhotoGallery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // 移除随机排序相关状态，改用InfinitePhotoGrid
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const { isAdmin, setIsAdmin } = useAdmin()
  const [replacingPhoto, setReplacingPhoto] = useState<Photo | null>(null)
  const [sortBy] = useState('createdAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  const [totalPhotos, setTotalPhotos] = useState(0)
  const [filters, setFilters] = useState<{
    ageRange: { min: number | null; max: number | null }
    heightRange: { min: number | null; max: number | null }
    universities: string[]
    birthMonths: number[]
    degrees: string[]
    tags: string[]
    searchText: string
  }>({
    ageRange: { min: null, max: null },
    heightRange: { min: null, max: null },
    universities: [],
    birthMonths: [],
    degrees: [],
    tags: [],
    searchText: ''
  })
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

      const response = await fetch(`${API_BASE_URL}/photos/${replacingPhoto.filename}/replace`, {
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
    <div className="text-gray-900 min-h-screen">
      {/* Header */}
      <header className="bg-gray-800/95 backdrop-blur-md border-b border-gray-600/50 shadow-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wide flex-shrink-0">
              泰海男星图鉴
            </h1>
            <div className="flex items-center gap-2 sm:gap-6 flex-1 justify-end">
              <div className="flex-1 max-w-xs sm:max-w-sm">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="搜索姓名..."
                />
              </div>
              
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-12 sm:top-14 w-48 sm:w-52 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-600/50 py-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 text-sm font-medium text-white/80 border-b border-gray-600/50">
                        显示选项
                      </div>
                      
                      <button
                        onClick={() => {
                          setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                          setShowSettings(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2"
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
                              className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/20 flex items-center gap-2"
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
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
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
                            className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2"
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
                          className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2"
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
      <main className="max-w-7xl mx-auto px-2 py-2 pt-16 sm:px-6 sm:py-8 sm:pt-20">
        <div className="flex gap-2 sm:gap-4">
          {/* 左侧生日艺人侧边栏 - 移动端隐藏 */}
          <div className="hidden xl:block flex-shrink-0 w-80">
            <BirthdaySidebar />
          </div>
          
          {/* 右侧主要内容区域 */}
          <div className="flex-1 bg-white/5 rounded-xl p-3 sm:p-8 backdrop-blur-sm border border-white/10">
            {/* 统计面板 */}
            <StatsPanel totalPhotos={totalPhotos} />
            
            {/* 筛选标签栏 */}
            <div className="mt-4 sm:mt-6 mb-4">
              <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
                <span className="text-white/80 text-xs sm:text-sm font-medium mr-1 sm:mr-2">筛选:</span>
                
                {/* 年龄筛选 */}
                {(filters.ageRange.min !== null || filters.ageRange.max !== null) && (
                  <span className="bg-blue-500/20 text-blue-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    年龄 {filters.ageRange.min || '不限'}-{filters.ageRange.max || '不限'}岁
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, ageRange: { min: null, max: null } }))}
                      className="ml-1 hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 身高筛选 */}
                {(filters.heightRange.min !== null || filters.heightRange.max !== null) && (
                  <span className="bg-green-500/20 text-green-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    身高 {filters.heightRange.min || '不限'}-{filters.heightRange.max || '不限'}cm
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, heightRange: { min: null, max: null } }))}
                      className="ml-1 hover:text-green-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 大学筛选 */}
                {filters.universities.length > 0 && (
                  <span className="bg-purple-500/20 text-purple-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    大学 {filters.universities.join(', ')}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, universities: [] }))}
                      className="ml-1 hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 出生月份筛选 */}
                {filters.birthMonths.length > 0 && (
                  <span className="bg-orange-500/20 text-orange-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    月份 {filters.birthMonths.map(m => `${m}月`).join(', ')}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, birthMonths: [] }))}
                      className="ml-1 hover:text-orange-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 学位筛选 */}
                {filters.degrees.length > 0 && (
                  <span className="bg-pink-500/20 text-pink-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    学位 {filters.degrees.join(', ')}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, degrees: [] }))}
                      className="ml-1 hover:text-pink-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 标签筛选 */}
                {filters.tags.length > 0 && (
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    标签 {filters.tags.join(', ')}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, tags: [] }))}
                      className="ml-1 hover:text-yellow-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 高级搜索 */}
                {filters.searchText.trim() !== '' && (
                  <span className="bg-red-500/20 text-red-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                    搜索 "{filters.searchText}"
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, searchText: '' }))}
                      className="ml-1 hover:text-red-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {/* 添加筛选按钮 */}
                <button
                  onClick={() => setShowFilterPanel(true)}
                  className="bg-white/10 hover:bg-white/20 text-white/90 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 transition-colors"
                >
                  <Filter className="w-3 h-3" />
                  <span className="hidden sm:inline">添加筛选</span>
                  <span className="sm:hidden">筛选</span>
                </button>
                
                {/* 清除所有筛选 */}
                {(filters.ageRange.min !== null || filters.ageRange.max !== null ||
                  filters.heightRange.min !== null || filters.heightRange.max !== null ||
                  filters.universities.length > 0 || filters.birthMonths.length > 0 ||
                  filters.degrees.length > 0 || filters.tags.length > 0 ||
                  filters.searchText.trim() !== '') && (
                  <button
                    onClick={() => setFilters({
                      ageRange: { min: null, max: null },
                      heightRange: { min: null, max: null },
                      universities: [],
                      birthMonths: [],
                      degrees: [],
                      tags: [],
                      searchText: ''
                    })}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors"
                  >
                    <span className="hidden sm:inline">清除所有</span>
                    <span className="sm:hidden">清除</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* 照片网格 */}
            <InfinitePhotoGrid 
              key={`${searchQuery || 'all'}-${sortBy}-${sortOrder}-${JSON.stringify(filters)}`}
              isAdmin={isAdmin}
              onReplace={handleReplacePhoto}
              search={searchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              filters={filters}
              onTotalChange={setTotalPhotos}
            />
          </div>
        </div>
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

      {/* 筛选面板 */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters)
          setShowFilterPanel(false)
        }}
        onClearFilters={() => {
          setFilters({
            ageRange: { min: null, max: null },
            heightRange: { min: null, max: null },
            universities: [],
            birthMonths: [],
            degrees: [],
            tags: [],
            searchText: ''
          })
        }}
        currentFilters={filters}
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