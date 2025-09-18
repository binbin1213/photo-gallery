/// <reference types="react" />
import { useState, useRef, useEffect } from 'react'
import { useThumbnail } from '../hooks/useThumbnail'

interface SmartImageProps {
  filename: string
  alt: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  lazy?: boolean
  fallbackToOriginal?: boolean
  onLoad?: () => void
  onError?: () => void
  onClick?: () => void
  style?: React.CSSProperties
}

/**
 * 智能图片组件
 * 自动选择最佳的缩略图格式和尺寸
 * 支持懒加载、格式降级、网络优化
 */
export default function SmartImage({
  filename,
  alt,
  size = 'small',
  className = '',
  lazy = true,
  fallbackToOriginal = true,
  onLoad,
  onError,
  onClick,
  style
}: SmartImageProps) {
  const [isVisible, setIsVisible] = useState(!lazy)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    src,
    loading,
    error
  } = useThumbnail({
    filename,
    size,
    fallbackToOriginal,
    lazy: false // 我们自己处理懒加载
  })

  // 懒加载逻辑
  useEffect(() => {
    if (!lazy || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // 提前50px开始加载
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, isVisible])

  const handleImageLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  const handleImageError = () => {
    onError?.()
  }

  // 占位符尺寸已内置在CSS中，不需要JavaScript计算

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-800 ${className}`}
      style={{
        aspectRatio: '1',
        ...style
      }}
      onClick={onClick}
    >
      {/* 占位符 */}
      {(!isVisible || loading) && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse"
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <div className="text-gray-600 text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-50"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs">
              {loading ? '加载中...' : '等待加载'}
            </div>
          </div>
        </div>
      )}

      {/* 实际图片 */}
      {isVisible && src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-400">
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs">加载失败</div>
          </div>
        </div>
      )}

      {/* 优化标识在生产环境中不显示 */}

      {/* 加载进度条 */}
      {loading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      )}
    </div>
  )
}

/**
 * 预览模式的智能图片组件
 * 用于弹窗等需要更高质量图片的场景
 */
export function SmartImagePreview({
  filename,
  alt,
  className = '',
  onLoad,
  onError,
  onClick,
  style
}: Omit<SmartImageProps, 'size' | 'lazy'>) {
  return (
    <SmartImage
      filename={filename}
      alt={alt}
      size="medium"
      lazy={false}
      className={className}
      onLoad={onLoad}
      onError={onError}
      onClick={onClick}
      style={style}
    />
  )
}

/**
 * 缩略图网格组件
 * 针对网格布局优化的智能图片
 */
export function SmartThumbnail({
  filename,
  alt,
  className = '',
  onLoad,
  onError,
  onClick,
  style
}: Omit<SmartImageProps, 'size' | 'lazy'>) {
  return (
    <SmartImage
      filename={filename}
      alt={alt}
      size="small"
      lazy={true}
      className={`rounded-lg ${className}`}
      onLoad={onLoad}
      onError={onError}
      onClick={onClick}
      style={style}
    />
  )
}
