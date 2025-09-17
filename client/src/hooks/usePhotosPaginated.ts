import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Photo } from '../types/photo'

const api = axios.create({
  baseURL: 'http://192.168.1.98:5551/api'
})

interface PaginatedPhotosResult {
  photos: Photo[]
  total: number
  page: number
  hasMore: boolean
}

export function usePhotosPaginated(page: number = 1, limit: number = 20, search?: string) {
  return useQuery({
    queryKey: ['photos-paginated', page, limit, search],
    queryFn: async (): Promise<PaginatedPhotosResult> => {
      const { data } = await api.get('/stars', {
        params: { 
          search, 
          page, 
          limit,
          sort: 'createdAt',
          order: 'desc'
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
        hasMore: photos.length === limit
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
