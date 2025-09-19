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
  birthDate?: string
  birthMonth?: number
  height?: number
  age?: number
  university?: string
  major?: string
  degree?: string
  representativeWorks?: string[]
  description?: string
}

interface FilterOptions {
  ageRange: {
    min: number | null
    max: number | null
  }
  heightRange: {
    min: number | null
    max: number | null
  }
  universities: string[]
  birthMonths: number[]
  degrees: string[]
  tags: string[]
  searchText: string
}

export function usePhotosWithAssociations(
  page: number = 1,
  limit: number = 20,
  search?: string,
  filters?: FilterOptions
) {
  const normalizedSearch = search && search.trim() !== '' ? search.trim() : undefined

  return useQuery<PaginatedPhotosResult>({
    queryKey: ['photos-with-associations', page, limit, normalizedSearch || 'ALL_FILES', filters],
    queryFn: async (): Promise<PaginatedPhotosResult> => {
      // 1. 获取所有照片文件
      const { data: filesResult } = await api.get('/photos/files')
      let photoFiles: PhotoFile[] = filesResult.photos || []

      // 2. 为每个照片文件查询关联的艺人信息（不过滤，获取所有数据）
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
              birthDate: star.birthDate,
              birthMonth: star.birthMonth,
              height: star.height,
              age: star.age,
              university: star.university,
              major: star.major,
              degree: star.degree,
              representativeWorks: star.representativeWorks,
              description: star.description,
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
              birthDate: undefined,
              birthMonth: undefined,
              height: undefined,
              age: undefined,
              university: undefined,
              major: undefined,
              degree: undefined,
              representativeWorks: undefined,
              description: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        })
      )

      // 3. 应用搜索和筛选条件
      let filteredPhotos = photosWithAssociations

      // 基础搜索过滤
      if (normalizedSearch) {
        filteredPhotos = filteredPhotos.filter(photo =>
          photo.filename.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
          photo.chineseName.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
          photo.englishName.toLowerCase().includes(normalizedSearch.toLowerCase())
        )
      }

      // 应用高级筛选
      if (filters) {
        filteredPhotos = filteredPhotos.filter(photo => {
          // 年龄范围筛选
          if (filters.ageRange.min !== null && photo.age !== undefined) {
            if (photo.age < filters.ageRange.min) return false
          }
          if (filters.ageRange.max !== null && photo.age !== undefined) {
            if (photo.age > filters.ageRange.max) return false
          }

          // 身高范围筛选
          if (filters.heightRange.min !== null && photo.height !== undefined) {
            if (photo.height < filters.heightRange.min) return false
          }
          if (filters.heightRange.max !== null && photo.height !== undefined) {
            if (photo.height > filters.heightRange.max) return false
          }

          // 大学筛选
          if (filters.universities.length > 0 && photo.university) {
            if (!filters.universities.includes(photo.university)) return false
          }

          // 出生月份筛选
          if (filters.birthMonths.length > 0 && photo.birthMonth) {
            if (!filters.birthMonths.includes(photo.birthMonth)) return false
          }

          // 学位筛选
          if (filters.degrees.length > 0 && photo.degree) {
            if (!filters.degrees.includes(photo.degree)) return false
          }

          // 标签筛选
          if (filters.tags.length > 0 && photo.tags) {
            const hasMatchingTag = filters.tags.some(tag => 
              photo.tags?.some(photoTag => photoTag.includes(tag))
            )
            if (!hasMatchingTag) return false
          }

          // 高级搜索文本筛选
          if (filters.searchText.trim()) {
            const searchLower = filters.searchText.toLowerCase()
            const matchesSearch = 
              photo.chineseName?.toLowerCase().includes(searchLower) ||
              photo.englishName?.toLowerCase().includes(searchLower) ||
              photo.university?.toLowerCase().includes(searchLower) ||
              photo.major?.toLowerCase().includes(searchLower) ||
              photo.degree?.toLowerCase().includes(searchLower) ||
              photo.representativeWorks?.some(work => work.toLowerCase().includes(searchLower)) ||
              photo.description?.toLowerCase().includes(searchLower)
            
            if (!matchesSearch) return false
          }

          return true
        })
      }

      // 4. 按英文名字母顺序排序
      const sortedPhotos = filteredPhotos.sort((a, b) => {
        const nameA = a.englishName || ''
        const nameB = b.englishName || ''
        return nameA.localeCompare(nameB, 'en', { numeric: true })
      })

      // 5. 分页处理
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
