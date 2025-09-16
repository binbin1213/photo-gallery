import { useState } from 'react'
import { ArrowLeft, Upload, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import BatchEditModal from '../components/BatchEditModal'

export default function AdminPanel() {
  const [isUploading, setIsUploading] = useState(false)
  const [showBatchEdit, setShowBatchEdit] = useState(false)

  // 导出数据功能
  const handleExportData = async () => {
    try {
      const response = await fetch('/api/photos')
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

  // 导入数据功能
  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            console.log('导入的数据:', data)
            alert('数据导入成功！（注：这是演示功能）')
          } catch (error) {
            alert('文件格式错误！')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 批量编辑功能
  const handleBatchEdit = () => {
    setShowBatchEdit(true)
  }

  // 文件上传功能
  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setIsUploading(true)
        // 模拟上传过程
        setTimeout(() => {
          setIsUploading(false)
          alert(`成功选择了 ${files.length} 个文件！（注：这是演示功能）`)
        }, 2000)
      }
    }
    input.click()
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
            <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
              <p className="text-white/70 mb-4">拖拽照片到这里或点击选择</p>
              <button 
                onClick={handleFileUpload}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={isUploading}
              >
                {isUploading ? '上传中...' : '选择文件'}
              </button>
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
                onClick={handleExportData}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                导出所有数据
              </button>
              <button 
                onClick={handleImportData}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                导入数据
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
    </div>
  )
}