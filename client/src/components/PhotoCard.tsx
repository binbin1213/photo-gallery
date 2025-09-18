import { useState } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, X } from 'lucide-react'

import { Photo } from '../types/photo'
import StarProfile from './StarProfile'
import StarEditModal from './StarEditModal'
import StarSearchModal from './StarSearchModal'
import FavoriteButton from './FavoriteButton'
import { SmartThumbnail } from './SmartImage'
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
                 // 默认数据，只有管理员可以关联
                 if (isAdmin) {
                   setShowSearchModal(true)
                 } else {
                   alert('只有管理员可以关联艺人信息')
                 }
               } else {
                 // 真实数据，直接显示资料
                 setStarInfo(star)
                 setShowProfile(true)
               }
      } else if (response.status === 404) {
        // 未找到关联的明星信息，只有管理员可以关联
        if (isAdmin) {
          setShowSearchModal(true)
        } else {
          alert('只有管理员可以关联艺人信息')
        }
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
    if (isAdmin) {
      setShowProfile(false)
      setShowSearchModal(true)
    } else {
      alert('只有管理员可以重新关联艺人信息')
    }
  }

  return (
    <>
      <div
        className="bg-gray-100 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out photo-card-fixed-height group"
        onClick={handlePhotoClick}
        data-photo-id={photo.id}
      >
        <div className="relative w-full h-full">
          <SmartThumbnail
            filename={photo.filename}
            alt={photo.chineseName}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
            fallbackToOriginal={true}
            onError={() => console.error('图片加载失败:', photo.filename)}
          />
          
          {/* Name Text - 直接显示在照片上，无背景 */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 sm:gap-2 text-center">
            <span className="font-bold text-xs sm:text-sm transition-all duration-300 group-hover:scale-105 truncate text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
              {photo.chineseName}
            </span>
            <span className="text-xs flex-shrink-0 text-white/80" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>•</span>
            <span className="font-medium text-xs sm:text-sm italic transition-all duration-300 group-hover:scale-105 truncate text-white/90" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
              {photo.englishName}
            </span>
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