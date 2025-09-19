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

interface PhotoFile {
  filename: string
}

interface StarInfo {
  id: string
  englishName?: string
  chineseName?: string
  nickname?: string
  tags?: string[]
}

export function usePhotosWithAssociations(
  page: number = 1,
  limit: number = 20,
  search?: string
) {
  const normalizedSearch = search && search.trim() !== '' ? search.trim() : undefined

  return useQuery<PaginatedPhotosResult>({
    queryKey: ['photos-with-associations', page, limit, normalizedSearch || 'ALL_FILES'],
    queryFn: async (): Promise<PaginatedPhotosResult> => {
      // 1. 获取所有照片文件
      const { data: filesResult } = await api.get('/photos/files')
      let photoFiles: PhotoFile[] = filesResult.photos || []

      // 2. 如果有搜索条件，先过滤文件名
      if (normalizedSearch) {
        photoFiles = photoFiles.filter((photo: PhotoFile) => 
          photo.filename.toLowerCase().includes(normalizedSearch.toLowerCase())
        )
      }

      // 3. 为每个照片文件查询关联的艺人信息
      const photosWithAssociations: Photo[] = await Promise.all(
        photoFiles.map(async (file: PhotoFile) => {
          try {
            // 查询这个照片是否有关联的艺人
            const { data: starResult } = await api.get(`/stars/by-photo/${file.filename}`)
            const star: StarInfo = starResult.star

            // 从文件名提取数字作为ID
            const filenameNumber = parseInt(file.filename.split('.')[0])
            const id = isNaN(filenameNumber) ? Math.abs(file.filename.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0)
              return a & a
            }, 0)) : filenameNumber

            return {
              id,
              filename: file.filename,
              chineseName: star.chineseName || `照片_${file.filename.split('.')[0]}`,
              englishName: star.englishName || `Photo_${file.filename.split('.')[0]}`,
              tags: star.tags || ['未关联'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          } catch (error) {
            // 如果没有关联艺人，返回默认信息
            const filenameNumber = parseInt(file.filename.split('.')[0])
            const id = isNaN(filenameNumber) ? Math.abs(file.filename.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0)
              return a & a
            }, 0)) : filenameNumber

            return {
              id,
              filename: file.filename,
              chineseName: `照片_${file.filename.split('.')[0]}`,
              englishName: `Photo_${file.filename.split('.')[0]}`,
              tags: ['未关联'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        })
      )

      // 4. 如果有搜索条件，再次过滤（包括艺人姓名）
      let filteredPhotos = photosWithAssociations
      if (normalizedSearch) {
        filteredPhotos = photosWithAssociations.filter(photo =>
          photo.filename.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
          photo.chineseName.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
          photo.englishName.toLowerCase().includes(normalizedSearch.toLowerCase())
        )
      }

      // 5. 按英文名字母顺序排序
      const sortedPhotos = filteredPhotos.sort((a, b) => {
        const nameA = a.englishName || ''
        const nameB = b.englishName || ''
        return nameA.localeCompare(nameB, 'en', { numeric: true })
      })

      // 6. 分页处理
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const photos = sortedPhotos.slice(startIndex, endIndex)

      return {
        photos,
        total: sortedPhotos.length,
        page,
        hasMore: endIndex < sortedPhotos.length
      }
    },
    staleTime: 30 * 1000, // 30秒缓存，因为需要实时反映关联状态
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
