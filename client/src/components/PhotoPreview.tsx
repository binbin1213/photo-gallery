import { useEffect } from 'react'
import { Photo } from '../types/photo'
import './PhotoPreview.css'

interface PhotoPreviewProps {
  photo: Photo
  onClose: () => void
}

export default function PhotoPreview({ photo, onClose }: PhotoPreviewProps) {
  // 获取点击位置并设置预览窗口位置
  useEffect(() => {
    const photoElement = document.querySelector(`[data-photo-id="${photo.id}"]`);
    if (photoElement) {
      const rect = photoElement.getBoundingClientRect();
      const overlay = document.querySelector('.photo-overlay') as HTMLElement;
      if (overlay) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        overlay.style.alignItems = 'flex-start';
        overlay.style.paddingTop = `${rect.top + scrollTop}px`;
      }
    }
  }, [photo.id]);

  // ESC键关闭
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [onClose])

  return (
    <>
      {/* 背景遮罩 - 包含预览框 */}
      <div
        className="photo-overlay show"
        onClick={onClose}
      >
        {/* 预览框 - 作为遮罩层的子元素居中显示 */}
        <div 
          className="photo-preview show"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            className="photo-preview-close"
            onClick={onClose}
          >
            ×
          </button>

          {/* 图片 */}
          <img
            src={`/uploads/photos/${photo.filename}`}
            alt={photo.chineseName}
          />

          {/* 信息 */}
          <div className="photo-preview-info">
            <div className="chinese-name">{photo.chineseName}</div>
            <div className="english-name">{photo.englishName}</div>
          </div>
        </div>
      </div>
    </>
  )
}