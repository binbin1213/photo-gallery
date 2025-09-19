export interface Photo {
  id: number
  filename: string
  originalName?: string
  chineseName: string
  englishName: string
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
  metadata?: {
    size: number
    width: number
    height: number
    format: string
  }
  createdAt: string
  updatedAt: string
}