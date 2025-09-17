import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Photo } from '../types/photo'
import { API_BASE_URL } from '../config/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

interface PaginatedPhotosResult {
  photos: Photo[]
  total: number
  page: number
  hasMore: boolean
}

export function usePhotosPaginated(
  page: number = 1, 
  limit: number = 20, 
  search?: string, 
  sortBy: string = 'createdAt', 
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  // 统一规范搜索参数，空字符串当作未搜索
  const normalizedSearch = search && search.trim() !== '' ? search.trim() : undefined
  
  return useQuery<PaginatedPhotosResult>({
    queryKey: ['photos-paginated', page, limit, normalizedSearch || 'ALL_PHOTOS', sortBy, sortOrder],
    queryFn: async (): Promise<PaginatedPhotosResult> => {
      const { data } = await api.get('/stars', {
        params: { 
          ...(normalizedSearch ? { search: normalizedSearch } : {}), 
          page, 
          limit,
          sort: sortBy,
          order: sortOrder
        }
      })
      
      const photos = (data.stars || []).map((star: any) => ({
        id: star._id,
        filename: star.photoFilename,
        chineseName: star.chineseName,
        englishName: star.englishName,
        tags: star.tags || [],
        createdAt: star.createdAt,
        updatedAt: star.updatedAt
      }))
      
      return {
        photos,
        total: data.total || photos.length,
        page,
        hasMore: typeof data.hasMore === 'boolean' ? data.hasMore : (photos.length === limit)
      }
    },
    staleTime: normalizedSearch ? 0 : 5 * 60 * 1000, // 搜索结果立即过期，普通浏览缓存5分钟
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
