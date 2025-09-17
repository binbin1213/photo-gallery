import { useState, useEffect } from 'react'
import { UploadCloud, X, Image, Check, AlertCircle } from 'lucide-react'

interface PhotoFile {
  filename: string
  isUsed: boolean
  starInfo: {
    englishName: string
    chineseName: string
  } | null
}

interface StarData {
  englishName: string
  chineseName: string
  thaiName?: string
  nickname?: string
  birthDate: string
  birthMonth?: number
  height: number
  weight?: number
  university?: string
  major?: string
  degree?: string
  representativeWorks?: string[]
  photoFilename?: string
  description?: string
  tags?: string[]
}

interface EnhancedDataImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function EnhancedDataImportModal({ isOpen, onClose }: EnhancedDataImportModalProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [availablePhotos, setAvailablePhotos] = useState<PhotoFile[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)

  // 加载可用照片列表
  const loadAvailablePhotos = async () => {
    setIsLoadingPhotos(true)
    try {
      const response = await fetch('http://192.168.1.98:5551/api/photos/files')
      const data = await response.json()
      
      if (data.success) {
        setAvailablePhotos(data.photos)
      } else {
        console.error('加载照片列表失败:', data.error)
      }
    } catch (error) {
      console.error('加载照片列表失败:', error)
    } finally {
      setIsLoadingPhotos(false)
    }
  }

  // 组件打开时加载照片列表
  useEffect(() => {
    if (isOpen) {
      loadAvailablePhotos()
    }
  }, [isOpen])

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          JSON.parse(content) // Validate JSON
          setJsonInput(content)
        } catch (error) {
          alert('文件内容不是有效的 JSON 格式')
          setJsonInput('')
        }
      }
      reader.readAsText(file)
    }
  }

  // 智能匹配照片
  const findMatchingPhoto = (starData: StarData): string | null => {
    if (starData.photoFilename) {
      // 如果已经指定了照片文件名，直接使用
      return starData.photoFilename
    }

    // 尝试根据姓名匹配
    const availableUnusedPhotos = availablePhotos.filter(photo => !photo.isUsed)
    
    // 1. 精确匹配文件名
    const exactMatch = availableUnusedPhotos.find(photo => 
      photo.filename.toLowerCase().includes(starData.englishName.toLowerCase()) ||
      photo.filename.toLowerCase().includes(starData.chineseName.toLowerCase())
    )
    if (exactMatch) return exactMatch.filename

    // 2. 部分匹配
    const partialMatch = availableUnusedPhotos.find(photo => 
      starData.englishName.toLowerCase().includes(photo.filename.split('.')[0].toLowerCase()) ||
      starData.chineseName.toLowerCase().includes(photo.filename.split('.')[0].toLowerCase())
    )
    if (partialMatch) return partialMatch.filename

    // 3. 返回第一个可用照片
    return availableUnusedPhotos[0]?.filename || null
  }

  // 处理导入
  const handleImport = async () => {
    if (!jsonInput.trim()) {
      alert('请输入或上传 JSON 数据')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) {
        throw new Error('JSON 数据必须是一个数组')
      }

      // 为每个明星数据匹配照片
      const enhancedData = data.map((starData: StarData, index: number) => {
        const matchedPhoto = findMatchingPhoto(starData)
        
        return {
          ...starData,
          photoFilename: matchedPhoto || `unmatched_${index + 1}.jpg`, // 如果没有匹配到，使用占位符
          birthDate: starData.birthDate ? new Date(starData.birthDate).toISOString() : new Date('1990-01-01').toISOString(),
          birthMonth: starData.birthMonth || 1,
          height: starData.height || 175,
          representativeWorks: Array.isArray(starData.representativeWorks) ? starData.representativeWorks : []
        }
      })

      // 发送到后端
      const response = await fetch('http://192.168.1.98:5551/api/stars/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enhancedData)
      })

      const result = await response.json()

      if (result.success) {
        setImportResult({
          success: true,
          message: result.message,
          count: result.results?.length || 0
        })
        setJsonInput('')
        // 重新加载照片列表
        loadAvailablePhotos()
      } else {
        throw new Error(result.error || '导入失败')
      }
    } catch (error) {
      console.error('导入错误:', error)
      setImportResult({
        success: false,
        message: '导入失败：' + (error as Error).message
      })
    } finally {
      setIsImporting(false)
    }
  }

  // 预览匹配结果
  const previewMatching = () => {
    if (!jsonInput.trim()) return

    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) return

      const preview = data.map((starData: StarData) => {
        const matchedPhoto = findMatchingPhoto(starData)
        return {
          name: `${starData.englishName} / ${starData.chineseName}`,
          photo: matchedPhoto || '未匹配到照片',
          status: matchedPhoto ? 'success' : 'warning'
        }
      })

      const successCount = preview.filter(p => p.status === 'success').length
      const warningCount = preview.filter(p => p.status === 'warning').length

      alert(`照片匹配预览：\n✅ 成功匹配：${successCount} 个\n⚠️ 未匹配：${warningCount} 个\n\n详细匹配结果：\n${preview.map(p => `${p.name} -> ${p.photo}`).join('\n')}`)
    } catch (error) {
      alert('JSON 格式错误，无法预览')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/80 border border-white/20 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">智能导入明星数据</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 照片状态概览 */}
        <div className="mb-6 p-4 bg-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Image className="w-5 h-5" />
            照片匹配状态
          </h3>
          {isLoadingPhotos ? (
            <p className="text-white/70">加载照片列表中...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{availablePhotos.length}</div>
                <div className="text-white/70">总照片数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {availablePhotos.filter(p => !p.isUsed).length}
                </div>
                <div className="text-white/70">可用照片</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {availablePhotos.filter(p => p.isUsed).length}
                </div>
                <div className="text-white/70">已使用</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {availablePhotos.filter(p => p.isUsed).length}
                </div>
                <div className="text-white/70">明星记录</div>
              </div>
            </div>
          )}
        </div>

        {/* 导入区域 */}
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-gray-200 font-medium mb-2">
            上传 JSON 文件
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
            >
              <UploadCloud className="w-8 h-8 text-gray-300 mb-2" />
              <p className="mb-2 text-sm text-gray-300">
                <span className="font-semibold">点击上传</span> 或拖拽文件
              </p>
              <p className="text-xs text-gray-400">JSON 文件</p>
              <input id="file-upload" type="file" className="hidden" accept=".json" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="json-input" className="block text-gray-200 font-medium mb-2">
            或直接粘贴 JSON 数据
          </label>
          <textarea
            id="json-input"
            rows={10}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-mono text-sm"
            placeholder={`[
  {
    "englishName": "Bright Vachirawit",
    "chineseName": "瓦奇拉维特·奇瓦雷",
    "thaiName": "ไบร์ท วชิรวิชญ์",
    "nickname": "Bright",
    "birthDate": "1997-12-27",
    "height": 183,
    "university": "朱拉隆功大学",
    "major": "国际商务管理",
    "representativeWorks": ["2gether", "F4 Thailand"],
    "description": "泰国知名演员"
  }
]`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          ></textarea>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={previewMatching}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            disabled={!jsonInput.trim()}
          >
            <Image className="w-4 h-4" />
            预览照片匹配
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              disabled={isImporting || !jsonInput.trim()}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  导入中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  开始导入
                </>
              )}
            </button>
          </div>
        </div>

        {/* 导入结果 */}
        {importResult && (
          <div className={`p-4 rounded-lg ${
            importResult.success 
              ? 'bg-green-500/20 border border-green-500/50' 
              : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={`font-semibold ${
                importResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {importResult.success ? '导入成功' : '导入失败'}
              </span>
            </div>
            <p className="text-white/80">{importResult.message}</p>
            {importResult.count && (
              <p className="text-white/60 text-sm mt-1">
                共处理 {importResult.count} 条记录
              </p>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-blue-400 font-semibold mb-2">使用说明：</h4>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• 系统会自动为每个明星匹配可用的照片</li>
            <li>• 匹配规则：优先精确匹配，其次部分匹配，最后使用第一个可用照片</li>
            <li>• 如果需要在JSON中指定特定照片，请添加 "photoFilename": "照片名.jpg" 字段</li>
            <li>• 建议在导入前使用"预览照片匹配"功能检查匹配结果</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
