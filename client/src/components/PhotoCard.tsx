import { useState } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, X } from 'lucide-react'

import { Photo } from '../types/photo'
import StarProfile from './StarProfile'
import StarEditModal from './StarEditModal'
import StarSearchModal from './StarSearchModal'
import FavoriteButton from './FavoriteButton'
import { API_BASE_URL } from '../config/api'

interface PhotoCardProps {
  photo: Photo
  isAdmin?: boolean
  onReplace?: (photo: Photo) => void
}

export default function PhotoCard({ photo, isAdmin = false, onReplace }: PhotoCardProps) {
  const [showProfile, setShowProfile] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
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
        const response = await fetch(`${API_BASE_URL}/photos/${photo.filename}`, {
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
      const response = await fetch(`${API_BASE_URL}/stars/by-photo/${photo.filename}`)
      
      if (response.ok) {
        const data = await response.json()
        const star = data.star
        
        // 检查是否是默认生成的数据（需要重新关联）
        const isDefaultData = star.englishName?.startsWith('Star_') || 
                             star.chineseName?.startsWith('明星_') ||
                             star.description?.includes('请完善相关信息')
        
        if (isDefaultData) {
          // 默认数据，显示搜索模态框让用户关联真实艺人
          setShowSearchModal(true)
        } else {
          // 真实数据，直接显示资料
          setStarInfo(star)
          setShowProfile(true)
        }
      } else if (response.status === 404) {
        // 未找到关联的明星信息，显示搜索模态框
        setShowSearchModal(true)
      } else {
        const data = await response.json()
        alert('获取明星信息失败：' + (data.error || '未知错误'))
      }
    } catch (error) {
      console.error('获取明星信息失败:', error)
      alert('获取明星信息失败：网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 处理编辑明星信息
  const handleEditStar = (star: any) => {
    setStarInfo(star)
    setShowEditModal(true)
  }

  // 处理保存编辑
  const handleSaveEdit = (updatedStar: any) => {
    setStarInfo(updatedStar)
    setShowEditModal(false)
    // 可以在这里添加成功提示
    alert('明星信息更新成功！')
  }

  // 处理艺人关联成功
  const handleAssociate = (associatedStar: any) => {
    setStarInfo(associatedStar)
    setShowSearchModal(false)
    setShowProfile(true)
  }

  // 处理重新关联
  const handleReassociate = () => {
    setShowProfile(false)
    setShowSearchModal(true)
  }

  return (
    <>
      <div
        className="bg-white rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out photo-card-fixed-height group"
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
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-sm p-1.5 sm:p-2 transition-all duration-300 group-hover:bg-gradient-to-t group-hover:from-black/95 group-hover:via-black/80 group-hover:to-transparent">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-center" style={{color: 'white'}}>
              <span className="font-bold text-xs sm:text-sm transition-all duration-300 group-hover:scale-105 truncate" style={{color: 'white'}}>
                {photo.chineseName}
              </span>
              <span className="text-xs flex-shrink-0" style={{color: 'rgba(255,255,255,0.6)'}}>•</span>
              <span className="font-medium text-xs sm:text-sm italic transition-all duration-300 group-hover:scale-105 truncate" style={{color: 'rgba(255,255,255,0.9)'}}>
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

          {/* 收藏按钮 */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <FavoriteButton photoId={photo.id.toString()} />
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <button
                onClick={handleReplace}
                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:rotate-180"
                title="替换照片"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:rotate-90"
                title="删除照片"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

             {showProfile && starInfo && createPortal(
               <StarProfile
                 star={starInfo}
                 isAdmin={isAdmin}
                 onEdit={handleEditStar}
                 onReassociate={handleReassociate}
                 onClose={() => {
                   setShowProfile(false)
                   setStarInfo(null)
                 }}
               />,
               document.body
             )}

             {showEditModal && starInfo && createPortal(
               <StarEditModal
                 isOpen={showEditModal}
                 onClose={() => setShowEditModal(false)}
                 star={starInfo}
                 onSave={handleSaveEdit}
               />,
               document.body
             )}

             {showSearchModal && createPortal(
               <StarSearchModal
                 isOpen={showSearchModal}
                 onClose={() => setShowSearchModal(false)}
                 photoFilename={photo.filename}
                 onAssociate={handleAssociate}
               />,
               document.body
             )}
    </>
  )
}