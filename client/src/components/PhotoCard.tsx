import { useState } from 'react'

import { Photo } from '../types/photo'
import PhotoPreview from './PhotoPreview'

interface PhotoCardProps {
  photo: Photo
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <>
      <div
        className="bg-white rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 photo-card-fixed-height"
        onClick={() => setShowPreview(true)}
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
        </div>
      </div>

      {showPreview && (
        <PhotoPreview
          photo={photo}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}