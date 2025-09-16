
import PhotoCard from './PhotoCard'
import { Photo } from '../types/photo'

interface PhotoGridProps {
  photos: Photo[]
  isAdmin?: boolean
  onReplace?: (photo: Photo) => void
}

export default function PhotoGrid({ photos, isAdmin = false, onReplace }: PhotoGridProps) {
  return (
    <div className="photo-grid-container">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isAdmin={isAdmin}
          onReplace={onReplace}
        />
      ))}
    </div>
  )
}