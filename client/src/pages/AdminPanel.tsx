import { useState } from 'react'
import { ArrowLeft, Upload, Download, Database, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import BatchEditModal from '../components/BatchEditModal'
import DataImportModal from '../components/DataImportModal'

export default function AdminPanel() {
  const [isUploading, setIsUploading] = useState(false)
  const [showBatchEdit, setShowBatchEdit] = useState(false)
  const [showDataImport, setShowDataImport] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // 导出数据功能
  const handleExportData = async () => {
    try {
      const response = await fetch('http://192.168.1.98:5551/api/photos')
      const data = await response.json()
      
      const exportData = data.photos.map((photo: any) => ({
        id: photo.id,
        filename: photo.filename,
        chineseName: photo.chineseName,
        englishName: photo.englishName,
        tags: photo.tags
      }))
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `photo-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('数据导出成功！')
    } catch (error) {
      alert('导出失败：' + error)
    }
  }


  // 批量编辑功能
  const handleBatchEdit = () => {
    setShowBatchEdit(true)
  }

  // 数据导入功能
  const handleDataImport = () => {
    setShowDataImport(true)
  }

  // 批量生成明星记录功能
  const handleGenerateRecords = async () => {
    if (confirm('确定要为所有照片生成明星记录吗？这将为每张照片创建基本的明星信息，您可以稍后完善详细信息。')) {
      try {
        const response = await fetch('http://192.168.1.98:5551/api/stars/generate-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const result = await response.json()

        if (result.success) {
          alert(`批量生成完成！\n成功创建: ${result.stats.created} 条记录\n跳过已存在: ${result.stats.skipped} 条记录\n失败: ${result.stats.failed} 条记录\n总计: ${result.stats.total} 张照片`)
          window.location.reload() // 刷新页面以显示新数据
        } else {
          alert('批量生成失败：' + result.error)
        }
      } catch (error) {
        console.error('批量生成错误:', error)
        alert('批量生成失败：' + error)
      }
    }
  }

  // 文件上传功能
  const handleFileUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setIsUploading(true)
        
        try {
          const formData = new FormData()
          Array.from(files).forEach(file => {
            formData.append('photos', file)
          })
          
          const response = await fetch('http://192.168.1.98:5551/api/upload-multiple', {
            method: 'POST',
            body: formData
          })
          
          const result = await response.json()
          
          if (result.success) {
            alert(`成功上传 ${result.count} 个文件！`)
            // 刷新页面以显示新上传的图片
            window.location.reload()
          } else {
            alert('上传失败：' + result.error)
          }
        } catch (error) {
          console.error('上传错误:', error)
          alert('上传失败：' + error)
        } finally {
          setIsUploading(false)
        }
      }
    }
    input.click()
  }

  // 拖拽上传处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length === 0) {
      alert('请拖拽图片文件')
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('photos', file)
      })
      
      const response = await fetch('http://192.168.1.98:5551/api/upload-multiple', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`成功上传 ${result.count} 个文件！`)
        window.location.reload()
      } else {
        alert('上传失败：' + result.error)
      }
    } catch (error) {
      console.error('上传错误:', error)
      alert('上传失败：' + error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-3xl font-bold text-white">
                管理面板
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              上传照片
            </h2>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-500/20' 
                  : 'border-white/30 hover:border-white/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="text-white/70 mb-4">
                {isDragOver ? '松开鼠标上传文件' : '拖拽照片到这里或点击选择'}
              </p>
              <button 
                onClick={handleFileUpload}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? '上传中...' : '选择文件'}
              </button>
              <p className="text-white/50 text-sm mt-2">
                支持 JPG、PNG、GIF 格式，单个文件最大 10MB
              </p>
            </div>
          </div>

                 {/* Export Section */}
                 <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                   <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                     <Download className="w-5 h-5" />
                     数据管理
                   </h2>
                   <div className="space-y-3">
                     <button
                       onClick={handleGenerateRecords}
                       className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                     >
                       <Users className="w-4 h-4" />
                       批量生成明星记录
                     </button>
                     <button
                       onClick={handleExportData}
                       className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                     >
                       导出所有数据
                     </button>
                     <button
                       onClick={handleDataImport}
                       className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                     >
                       <Database className="w-4 h-4" />
                       导入明星数据
                     </button>
                     <button
                       onClick={handleBatchEdit}
                       className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                     >
                       批量编辑姓名
                     </button>
                   </div>
                 </div>
        </div>
      </main>

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={showBatchEdit}
        onClose={() => setShowBatchEdit(false)}
      />

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showDataImport}
        onClose={() => setShowDataImport(false)}
      />
    </div>
  )
}