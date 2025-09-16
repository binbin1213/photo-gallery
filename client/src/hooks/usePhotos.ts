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
      return data.stars || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}