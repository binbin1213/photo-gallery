import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePhotosPaginated } from '../hooks/usePhotosPaginated'
import { usePhotosFromFiles } from '../hooks/usePhotosFromFiles'
import PhotoCard from './PhotoCard'
import { Photo } from '../types/photo'

interface InfinitePhotoGridProps {
  isAdmin?: boolean
  onReplace?: (photo: Photo) => void
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: any
  onTotalChange?: (total: number) => void
}

export default function InfinitePhotoGrid({ 
  isAdmin = false, 
  onReplace, 
  search, 
  sortBy = 'createdAt', 
  sortOrder = 'desc', 
  filters = {}, // TODO: 将来用于高级筛选功能
  onTotalChange 
}: InfinitePhotoGridProps) {
  // 暂时使用 filters 来避免 TypeScript 警告，将来会实现筛选功能
  console.debug('Filters received:', filters)
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [useFileMode, setUseFileMode] = useState(false)
  const queryClient = useQueryClient()
  
  // 尝试从数据库获取照片
  const { data: dbData, isLoading: dbLoading, error: dbError } = usePhotosPaginated(page, 20, search, sortBy, sortOrder)
  
  // 从文件获取照片（备用模式）
  const { data: fileData, isLoading: fileLoading, error: fileError } = usePhotosFromFiles(page, 20, search)

  // 强制使用文件模式：显示实际照片文件，等待手动关联艺人信息
  useEffect(() => {
    console.log('强制使用文件模式显示照片')
    setUseFileMode(true)
  }, [])

  // 选择使用哪个数据源
  const data = useFileMode ? fileData : dbData
  const isLoading = useFileMode ? fileLoading : dbLoading
  const error = useFileMode ? fileError : dbError
  
  // 当数据加载完成时，添加到总列表中
  useEffect(() => {
    if (data?.photos) {
      if (page === 1) {
        // 第一页，替换所有数据
        setAllPhotos(data.photos)
        // 回调总数给父组件
        if (onTotalChange) {
          onTotalChange(data.total)
        }
      } else {
        // 后续页面，追加数据
        setAllPhotos(prev => [...prev, ...data.photos])
      }
      setIsLoadingMore(false)
    }
  }, [data, page, search, onTotalChange])
  
  // 搜索时重置
  useEffect(() => {
    setPage(1)
    setAllPhotos([])
    // 清空搜索或切换搜索时，回到顶部，触发首屏加载
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // 失效相关缓存，确保立即重新拉取
    queryClient.invalidateQueries({ queryKey: ['photos-paginated'] })
  }, [search, queryClient])
  
  // 加载更多
  const loadMore = useCallback(() => {
    if (data?.hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      setPage(prev => prev + 1)
    }
  }, [data?.hasMore, isLoadingMore])
  
  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= 
          document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])
  
  // 骨架屏加载组件
  const SkeletonCard = () => (
    <div className="skeleton-card h-60 rounded-xl"></div>
  )

  if (isLoading && page === 1) {
    return (
      <div className="photo-grid-container">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        加载失败，请刷新页面重试
      </div>
    )
  }
  
  return (
    <div>
      <div className="photo-grid-container">
        {allPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PhotoCard
              photo={photo}
              isAdmin={isAdmin}
              onReplace={onReplace}
            />
          </div>
        ))}
      </div>
      
      {/* 加载更多指示器 */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8 animate-in fade-in-0 duration-300">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-600 text-sm">正在加载更多...</span>
          </div>
        </div>
      )}
      
      {/* 没有更多数据 */}
      {!data?.hasMore && allPhotos.length > 0 && (
        <div className="text-center text-gray-500 py-8">
          已加载全部 {allPhotos.length} 张照片
        </div>
      )}
    </div>
  )
}
