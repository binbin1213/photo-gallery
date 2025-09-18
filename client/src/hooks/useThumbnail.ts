/// <reference types="react" />
import { useState, useEffect } from 'react'

/**
 * 智能缩略图Hook
 * 根据浏览器支持和网络状况选择最佳图片格式和尺寸
 */

// 检测浏览器支持的图片格式
const detectSupportedFormats = async (): Promise<string[]> => {
  const formats = ['webp', 'jpeg', 'png']
  const supported: string[] = []
  
  for (const format of formats) {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const dataUrl = canvas.toDataURL(`image/${format}`)
      
      if (dataUrl.startsWith(`data:image/${format}`)) {
        supported.push(format)
      }
    } catch (error) {
      // 格式不支持
    }
  }
  
  return supported.length > 0 ? supported : ['jpeg'] // 默认支持jpeg
}

// 检测网络状况
const getNetworkQuality = (): 'high' | 'medium' | 'low' => {
  // @ts-ignore - 实验性API
  if (navigator.connection) {
    // @ts-ignore
    const connection = navigator.connection
    const effectiveType = connection.effectiveType
    
    if (effectiveType === '4g' || connection.downlink > 2) {
      return 'high'
    } else if (effectiveType === '3g' || connection.downlink > 0.5) {
      return 'medium'
    }
  }
  
  return 'medium' // 默认中等质量
}

// 根据网络质量选择尺寸
const getSizeByNetwork = (requestedSize: 'small' | 'medium' | 'large'): 'small' | 'medium' => {
  const networkQuality = getNetworkQuality()
  
  if (requestedSize === 'large') {
    return networkQuality === 'high' ? 'medium' : 'small'
  }
  
  if (requestedSize === 'medium') {
    return networkQuality === 'low' ? 'small' : 'medium'
  }
  
  return 'small'
}

interface ThumbnailOptions {
  filename: string
  size?: 'small' | 'medium' | 'large'
  fallbackToOriginal?: boolean
  lazy?: boolean
}

interface ThumbnailResult {
  src: string
  loading: boolean
  error: boolean
  format: string
  actualSize: 'small' | 'medium' | 'original'
  networkOptimized: boolean
}

export function useThumbnail({
  filename,
  size = 'small',
  fallbackToOriginal = true,
  lazy = true
}: ThumbnailOptions): ThumbnailResult {
  const [src, setSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [format, setFormat] = useState<string>('jpeg')
  const [actualSize, setActualSize] = useState<'small' | 'medium' | 'original'>('small')
  const [networkOptimized, setNetworkOptimized] = useState(false)

  useEffect(() => {
    if (!filename) {
      setLoading(false)
      return
    }

    let mounted = true
    
    const loadThumbnail = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // 检测支持的格式
        const supportedFormats = await detectSupportedFormats()
        const bestFormat = supportedFormats[0] || 'jpeg'
        
        // 根据网络状况优化尺寸
        const optimizedSize = getSizeByNetwork(size)
        const wasOptimized = optimizedSize !== size
        
        // 构建缩略图URL
        const baseName = filename.replace(/\.[^.]+$/, '') // 去掉扩展名
        const thumbnailFilename = `${baseName}_${optimizedSize === 'small' ? '300' : '800'}.${bestFormat}`
        const thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}?size=${optimizedSize}`
        
        // 预加载图片
        const img = new Image()
        
        img.onload = () => {
          if (mounted) {
            setSrc(thumbnailUrl)
            setFormat(bestFormat)
            setActualSize(optimizedSize)
            setNetworkOptimized(wasOptimized)
            setLoading(false)
          }
        }
        
        img.onerror = () => {
          if (!mounted) return
          
          // 缩略图加载失败，尝试降级策略
          if (bestFormat !== 'jpeg') {
            // 尝试JPEG格式
            const jpegFilename = `${baseName}_${optimizedSize === 'small' ? '300' : '800'}.jpeg`
            const jpegUrl = `/uploads/thumbnails/${jpegFilename}?size=${optimizedSize}`
            
            const jpegImg = new Image()
            jpegImg.onload = () => {
              if (mounted) {
                setSrc(jpegUrl)
                setFormat('jpeg')
                setActualSize(optimizedSize)
                setNetworkOptimized(wasOptimized)
                setLoading(false)
              }
            }
            jpegImg.onerror = () => {
              if (mounted) {
                handleFallback()
              }
            }
            jpegImg.src = jpegUrl
          } else {
            handleFallback()
          }
        }
        
        const handleFallback = () => {
          if (fallbackToOriginal) {
            // 回退到原图
            const originalUrl = `/uploads/photos/${filename}`
            setSrc(originalUrl)
            setFormat('original')
            setActualSize('original')
            setNetworkOptimized(false)
            setLoading(false)
          } else {
            setError(true)
            setLoading(false)
          }
        }
        
        // 如果启用懒加载，延迟加载
        if (lazy) {
          // 使用 Intersection Observer 实现懒加载
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  img.src = thumbnailUrl
                  observer.disconnect()
                }
              })
            },
            { threshold: 0.1 }
          )
          
          // 创建一个虚拟元素来观察
          const target = document.createElement('div')
          observer.observe(target)
          
          // 清理函数
          return () => {
            observer.disconnect()
          }
        } else {
          img.src = thumbnailUrl
        }
        
      } catch (err) {
        if (mounted) {
          console.error('缩略图加载失败:', err)
          setError(true)
          setLoading(false)
        }
      }
    }
    
    loadThumbnail()
    
    return () => {
      mounted = false
    }
  }, [filename, size, fallbackToOriginal, lazy])

  return {
    src,
    loading,
    error,
    format,
    actualSize,
    networkOptimized
  }
}

/**
 * 预加载缩略图Hook
 * 用于预加载即将显示的图片
 */
export function usePreloadThumbnails(filenames: string[], size: 'small' | 'medium' = 'small') {
  useEffect(() => {
    if (filenames.length === 0) return
    
    const preloadImages = async () => {
      const supportedFormats = await detectSupportedFormats()
      const bestFormat = supportedFormats[0] || 'jpeg'
      const optimizedSize = getSizeByNetwork(size)
      
      filenames.forEach((filename) => {
        const baseName = filename.replace(/\.[^.]+$/, '')
        const thumbnailFilename = `${baseName}_${optimizedSize === 'small' ? '300' : '800'}.${bestFormat}`
        const thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}?size=${optimizedSize}`
        
        // 创建图片对象进行预加载
        const img = new Image()
        img.src = thumbnailUrl
      })
    }
    
    // 延迟预加载，避免阻塞主要内容
    const timer = setTimeout(preloadImages, 100)
    
    return () => clearTimeout(timer)
  }, [filenames, size])
}

/**
 * 批量生成缩略图Hook
 * 用于管理员界面
 */
export function useThumbnailGeneration() {
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<{
    totalPhotos: number
    thumbnailFiles: number
    coverage: string
    photosDir?: string
    thumbnailsDir?: string
  } | null>(null)

  const generateThumbnails = async () => {
    try {
      setGenerating(true)
      
      const response = await fetch('/api/thumbnails/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('生成缩略图失败')
      }
      
      const result = await response.json()
      console.log('✅ 缩略图生成任务已启动:', result.message)
      
      // 开始轮询状态
      pollStatus()
      
    } catch (error) {
      console.error('❌ 启动缩略图生成失败:', error)
      setGenerating(false)
    }
  }

  const pollStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/thumbnails/status')
        const statusData = await response.json()
        
        setStatus(statusData)
        
        // 如果覆盖率达到90%以上，停止轮询
        if (parseFloat(statusData.coverage) >= 0.90) {
          setGenerating(false)
          clearInterval(interval)
        }
        
      } catch (error) {
        console.error('获取缩略图状态失败:', error)
      }
    }, 2000) // 每2秒查询一次
    
    // 10分钟后停止轮询
    setTimeout(() => {
      clearInterval(interval)
      setGenerating(false)
    }, 600000)
  }

  const getStatus = async () => {
    try {
      const response = await fetch('/api/thumbnails/status')
      const statusData = await response.json()
      setStatus(statusData)
    } catch (error) {
      console.error('获取缩略图状态失败:', error)
    }
  }

  useEffect(() => {
    getStatus()
  }, [])

  return {
    generating,
    status,
    generateThumbnails,
    getStatus
  }
}
