import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  photoId: string
  className?: string
}

export default function FavoriteButton({ photoId, className = '' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    // 从localStorage读取收藏状态
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(photoId))
  }, [photoId])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发父元素的点击事件
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    let newFavorites
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== photoId)
    } else {
      newFavorites = [...favorites, photoId]
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
  }

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
        isFavorite 
          ? 'bg-red-500 text-white shadow-lg' 
          : 'bg-white/20 text-white/80 hover:bg-white/30'
      } ${className}`}
      title={isFavorite ? '取消收藏' : '添加收藏'}
    >
      <Heart 
        className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} 
      />
    </button>
  )
}
