import { API_BASE_URL } from "../config/api"
import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface DataImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DataImportModal({ isOpen, onClose }: DataImportModalProps) {
  const [importData, setImportData] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  // 处理数据导入
  const handleImport = async () => {
    if (!importData.trim()) {
      alert('请先输入或上传数据')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      // 解析 JSON 数据
      const data = JSON.parse(importData)
      
      if (!Array.isArray(data)) {
        throw new Error('数据格式错误：请提供数组格式的数据')
      }

      // 验证数据格式
      const validatedData = data.map((item, index) => {
        if (!item.englishName || !item.chineseName || !item.birthDate || !item.height || !item.photoFilename) {
          throw new Error(`第 ${index + 1} 条数据缺少必要字段：englishName, chineseName, birthDate, height, photoFilename`)
        }

        // 转换生日格式
        const birthDate = new Date(item.birthDate)
        if (isNaN(birthDate.getTime())) {
          throw new Error(`第 ${index + 1} 条数据的生日格式错误`)
        }

        return {
          ...item,
          birthDate: birthDate.toISOString(),
          birthMonth: birthDate.getMonth() + 1,
          representativeWorks: Array.isArray(item.representativeWorks) ? item.representativeWorks : []
        }
      })

      // 发送到后端
      const response = await fetch('${API_BASE_URL}/stars/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stars: validatedData })
      })

      const result = await response.json()

      if (result.success) {
        setImportResult({
          success: true,
          message: result.message,
          count: result.count
        })
        setImportData('')
      } else {
        throw new Error(result.error || '导入失败')
      }
    } catch (error) {
      console.error('导入错误:', error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : '导入失败'
      })
    } finally {
      setIsImporting(false)
    }
  }

  // 生成示例数据
  const generateSampleData = () => {
    const sampleData = [
      {
        englishName: "Book",
        chineseName: "林夏",
        thaiName: "บุ๊ค : กษิดิ์เดช ปลูกผล",
        nickname: "小新",
        birthDate: "1996-10-25",
        height: 181,
        weight: 65,
        university: "朱拉隆功大学",
        major: "计算机工程",
        degree: "本科",
        representativeWorks: ["《隔世相逢》", "《唐人街探爱》"],
        photoFilename: "book-photo.jpg",
        description: "泰国知名演员，以出色的演技和帅气的外表深受观众喜爱。"
      }
    ]
    
    setImportData(JSON.stringify(sampleData, null, 2))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              数据导入
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              importResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.message}
                </p>
                {importResult.count && (
                  <p className="text-sm text-green-600 mt-1">
                    成功导入 {importResult.count} 条记录
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 数据格式说明 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">数据格式说明</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• 支持 JSON 格式的数组数据</p>
              <p>• 必填字段：englishName, chineseName, birthDate, height, photoFilename</p>
              <p>• 可选字段：thaiName, nickname, weight, university, major, degree, representativeWorks, description</p>
              <p>• 生日格式：YYYY-MM-DD</p>
              <p>• 身高单位：厘米，体重单位：公斤</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mb-4 flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
              <FileText className="w-4 h-4" />
              选择文件
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={generateSampleData}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              生成示例数据
            </button>
          </div>

          {/* 数据输入区域 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              明星数据 (JSON 格式)
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="请粘贴或输入 JSON 格式的明星数据..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !importData.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  导入中...
                </>
              ) : (
                '开始导入'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
