import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

import { Photo } from '../types/photo'
import StarProfile from './StarProfile'

interface PhotoCardProps {
  photo: Photo
  isAdmin?: boolean
  onReplace?: (photo: Photo) => void
}

export default function PhotoCard({ photo, isAdmin = false, onReplace }: PhotoCardProps) {
  const [showProfile, setShowProfile] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [starInfo, setStarInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  // 处理图片替换
  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止触发预览
    if (onReplace) {
      onReplace(photo)
      // 触发文件选择
      const input = document.getElementById('replace-photo-input') as HTMLInputElement
      if (input) {
        input.click()
      }
    }
  }

  // 处理图片删除
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止触发预览
    if (confirm('确定要删除这张照片吗？')) {
      try {
        const response = await fetch(`http://192.168.1.98:5551/api/photos/${photo.filename}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        
        if (result.success) {
          alert('照片删除成功！')
          window.location.reload()
        } else {
          alert('删除失败：' + result.error)
        }
      } catch (error) {
        console.error('删除错误:', error)
        alert('删除失败：' + error)
      }
    }
  }

  // 处理照片点击，获取明星信息
  const handlePhotoClick = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://192.168.1.98:5551/api/stars/by-photo/${photo.filename}`)
      const data = await response.json()
      
      if (data.star) {
        setStarInfo(data.star)
        setShowProfile(true)
      } else {
        alert('未找到该明星的详细信息')
      }
    } catch (error) {
      console.error('获取明星信息失败:', error)
      alert('获取明星信息失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="bg-white rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 photo-card-fixed-height"
        onClick={handlePhotoClick}
        data-photo-id={photo.id}
      >
        <div className="relative w-full h-full">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={`/uploads/photos/${photo.filename}`}
            alt={photo.chineseName}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3">
            <div className="flex justify-between items-center text-white gap-2">
              <span className="font-bold text-sm truncate flex-1 text-center">
                {photo.chineseName}
              </span>
              <span className="font-bold text-sm text-white/90 italic text-right flex-1">
                {photo.englishName}
              </span>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={handleReplace}
                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                title="替换照片"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                title="删除照片"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfile && starInfo && (
        <StarProfile
          star={starInfo}
          onClose={() => {
            setShowProfile(false)
            setStarInfo(null)
          }}
        />
      )}
    </>
  )
}