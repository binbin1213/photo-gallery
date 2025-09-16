
import PhotoCard from './PhotoCard'
import { Photo } from '../types/photo'

interface PhotoGridProps {
  photos: Photo[]
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="photo-grid-container">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
        />
      ))}
    </div>
  )
}