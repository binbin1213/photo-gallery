export interface Photo {
  id: number
  filename: string
  originalName?: string
  chineseName: string
  englishName: string
  tags?: string[]
  metadata?: {
    size: number
    width: number
    height: number
    format: string
  }
  createdAt: string
  updatedAt: string
}