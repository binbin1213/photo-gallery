import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Photo {
  id: number
  filename: string
  chineseName: string
  englishName: string
}

interface BatchEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export default function BatchEditModal({ isOpen, onClose, onSave }: BatchEditModalProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPhotos()
    }
  }, [isOpen])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('http://192.168.1.98:5551/api/photos')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (!data.photos || !Array.isArray(data.photos)) {
        throw new Error('返回的数据格式不正确')
      }
      setPhotos(data.photos)
      setLoading(false)
    } catch (error: any) {
      const message = error instanceof Error ? error.message : '未知错误'
      toast.error(`加载照片失败: ${message}`)
      setLoading(false)
      onClose()
    }
  }

  const handleSave = async () => {
    try {
      const form = document.getElementById('batch-edit-form')
      if (!form) return

      const formData = new FormData(form as HTMLFormElement)
      const updates: {[key: string]: {chineseName: string, englishName: string}} = {}

      formData.forEach((value, key) => {
        const [id, type] = key.split('-')
        if (!updates[id]) {
          updates[id] = { chineseName: '', englishName: '' }
        }
        if (type === 'chinese') {
          updates[id].chineseName = value as string
        } else if (type === 'english') {
          updates[id].englishName = value as string
        }
      })

      // 转换数据结构以匹配后端 API
      const photos = Object.entries(updates).map(([id, data]) => ({
        id: parseInt(id),
        chineseName: data.chineseName,
        englishName: data.englishName
      }))

      console.log('准备发送的数据：', { photos });

      const response = await fetch('http://192.168.1.98:5551/api/photos/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photos })
      })

      if (!response.ok) {
        throw new Error('更新失败')
      }

      toast.success('更新成功')
      onSave?.()
      onClose()
    } catch (error) {
      toast.error('保存失败：' + error)
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
        <div className="ml-2 text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        {previewImage && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100000] cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <img 
              src={previewImage} 
              alt="预览图"
              className="max-h-[90vh] max-w-[90vw] object-contain" 
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">批量编辑照片信息</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form id="batch-edit-form" className="space-y-6">
          <div className="grid grid-cols-[100px_1fr_1fr] gap-4 px-4 py-3 bg-gray-800 text-white rounded-t-lg font-medium">
            <div>照片预览</div>
            <div>中文名称</div>
            <div>英文名称</div>
          </div>
          
          <div className="space-y-2">
            {photos.map(photo => (
              <div key={photo.id} className="grid grid-cols-[100px_1fr_1fr] gap-4 items-center p-4 hover:bg-gray-50 border-b bg-white">
                <div 
                  className="relative cursor-zoom-in"
                  onClick={() => setPreviewImage(`/uploads/photos/${photo.filename}`)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const preview = document.createElement('div')
                    preview.className = 'fixed z-[99999] bg-white p-2 rounded shadow-lg'
                    preview.innerHTML = `<img src="/uploads/photos/${photo.filename}" class="w-48 h-48 object-cover rounded" />`
                    preview.style.left = `${rect.right + 10}px`
                    preview.style.top = `${rect.top}px`
                    preview.id = `preview-${photo.id}`
                    document.body.appendChild(preview)
                  }}
                  onMouseLeave={() => {
                    const preview = document.getElementById(`preview-${photo.id}`)
                    if (preview) {
                      document.body.removeChild(preview)
                    }
                  }}
                >
                  <img 
                    src={`/uploads/photos/${photo.filename}`} 
                    alt={photo.chineseName || '照片'}
                    className="w-20 h-20 object-cover rounded hover:ring-2 hover:ring-blue-500 shadow-sm" 
                  />
                </div>
                
                <input
                  type="text"
                  name={`${photo.id}-chinese`}
                  defaultValue={photo.chineseName}
                  placeholder="请输入中文名称"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-gray-50 text-gray-800"
                />
                
                <input
                  type="text"
                  name={`${photo.id}-english`}
                  defaultValue={photo.englishName}
                  placeholder="请输入英文名称"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-gray-50 text-gray-800"
                />
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t flex justify-end gap-4 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 font-medium"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 font-medium shadow-sm"
            >
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
