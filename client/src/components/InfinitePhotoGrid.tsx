import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePhotosPaginated } from '../hooks/usePhotosPaginated'
import PhotoCard from './PhotoCard'
import { Photo } from '../types/photo'

interface InfinitePhotoGridProps {
  isAdmin?: boolean
  onReplace?: (photo: Photo) => void
  search?: string
}

export default function InfinitePhotoGrid({ isAdmin = false, onReplace, search }: InfinitePhotoGridProps) {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const queryClient = useQueryClient()
  
  const { data, isLoading, error } = usePhotosPaginated(page, 20, search)
  
  // 当数据加载完成时，添加到总列表中
  useEffect(() => {
    if (data?.photos) {
      if (page === 1) {
        // 第一页，替换所有数据
        setAllPhotos(data.photos)
      } else {
        // 后续页面，追加数据
        setAllPhotos(prev => [...prev, ...data.photos])
      }
      setIsLoadingMore(false)
    }
  }, [data, page])
  
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
  
  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
