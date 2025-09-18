import { useQuery } from '@tanstack/react-query'
import { API_BASE_URL } from '../config/api'
import { Photo } from '../types/photo'

interface PhotoFile {
  filename: string
  isUsed: boolean
  starInfo: any
}

interface PhotosFromFilesResult {
  photos: Photo[]
  total: number
  page: number
  hasMore: boolean
}

export function usePhotosFromFiles(
  page: number = 1,
  limit: number = 20,
  search?: string
) {
  const normalizedSearch = search && search.trim() !== '' ? search.trim() : undefined

  return useQuery<PhotosFromFilesResult>({
    queryKey: ['photos-from-files', page, limit, normalizedSearch || 'ALL_FILES'],
    queryFn: async (): Promise<PhotosFromFilesResult> => {
      // 获取所有照片文件
      const response = await fetch(`${API_BASE_URL}/photos/files`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('获取照片文件失败')
      }

      let photoFiles: PhotoFile[] = result.photos || []

      // 如果有搜索条件，过滤文件名
      if (normalizedSearch) {
        photoFiles = photoFiles.filter(photo => 
          photo.filename.toLowerCase().includes(normalizedSearch.toLowerCase())
        )
      }

      // 转换为Photo格式
      const allPhotos: Photo[] = photoFiles.map((file, index) => ({
        id: `file_${file.filename}`, // 使用文件名作为临时ID
        filename: file.filename,
        chineseName: `照片_${file.filename.split('.')[0]}`, // 临时中文名
        englishName: `Photo_${file.filename.split('.')[0]}`, // 临时英文名
        tags: ['未关联'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // 分页处理
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const photos = allPhotos.slice(startIndex, endIndex)

      return {
        photos,
        total: allPhotos.length,
        page,
        hasMore: endIndex < allPhotos.length
      }
    },
    staleTime: 5 * 60 * 1000, // 缓存5分钟
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
