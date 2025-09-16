import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Photo } from '../types/photo'

const api = axios.create({
  baseURL: '/api'
})

export function usePhotos(search?: string) {
  return useQuery({
    queryKey: ['photos', search],
    queryFn: async (): Promise<Photo[]> => {
      const { data } = await api.get('/stars', {
        params: { search, limit: 120 }
      })
      // 转换数据格式，将 photoFilename 映射为 filename
      return (data.stars || []).map((star: any) => ({
        id: star._id,
        filename: star.photoFilename,
        chineseName: star.chineseName,
        englishName: star.englishName,
        tags: star.tags || [],
        createdAt: star.createdAt,
        updatedAt: star.updatedAt
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}