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

export function usePhotosPaginated(page: number = 1, limit: number = 20, search?: string) {
  // 统一规范搜索参数，空字符串当作未搜索
  const normalizedSearch = search && search.trim() !== '' ? search.trim() : undefined
  
  console.log('usePhotosPaginated 调用参数:', { page, limit, search, normalizedSearch })
  
  return useQuery<PaginatedPhotosResult>({
    queryKey: ['photos-paginated', page, limit, normalizedSearch || null],
    queryFn: async (): Promise<PaginatedPhotosResult> => {
      console.log('API 请求参数:', { 
        search: normalizedSearch, 
        page, 
        limit,
        sort: 'createdAt',
        order: 'desc'
      })
      
      const { data } = await api.get('/stars', {
        params: { 
          ...(normalizedSearch ? { search: normalizedSearch } : {}), 
          page, 
          limit,
          sort: 'createdAt',
          order: 'desc'
        }
      })
      
      console.log('API 响应数据:', data)
      
      const photos = (data.stars || []).map((star: any) => ({
        id: star._id,
        filename: star.photoFilename,
        chineseName: star.chineseName,
        englishName: star.englishName,
        tags: star.tags || [],
        createdAt: star.createdAt,
        updatedAt: star.updatedAt
      }))
      
      const result = {
        photos,
        total: data.total || photos.length,
        page,
        hasMore: typeof data.hasMore === 'boolean' ? data.hasMore : (photos.length === limit)
      }
      
      console.log('处理后的结果:', result)
      return result
    },
    staleTime: 0, // 暂时设为0，确保每次都重新获取
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
