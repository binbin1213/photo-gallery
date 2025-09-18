import { useState, useEffect } from 'react'
import { UploadCloud, X, FileSpreadsheet, Check, AlertCircle, Download, Trash2 } from 'lucide-react'

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

interface TableImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TableImportModal({ isOpen, onClose }: TableImportModalProps) {
  const [availablePhotos, setAvailablePhotos] = useState<PhotoFile[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)
  const [updateMode, setUpdateMode] = useState<'smart' | 'clear'>('smart')
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewData, setPreviewData] = useState<StarData[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // 格式化生日为中文格式
  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  // 加载可用照片列表
  const loadAvailablePhotos = async () => {
    setIsLoadingPhotos(true)
    try {
      const response = await fetch('/api/photos/files')
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

  // 处理Excel/CSV文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      alert('请上传CSV或Excel文件')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/table', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('API 响应结果:', result)

      if (result.success) {
        console.log('解析的数据:', result.data)
        setPreviewData(result.data)
        setShowPreview(true)
      } else {
        throw new Error(result.error || '文件解析失败')
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      alert('文件上传失败：' + (error as Error).message)
    }
  }

  // 智能匹配照片
  const findMatchingPhoto = (starData: StarData, index: number): string | null => {
    if (starData.photoFilename) {
      return starData.photoFilename
    }

    const availableUnusedPhotos = availablePhotos.filter(photo => !photo.isUsed)
    
    // 1. 精确匹配
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

    // 3. 按顺序分配
    return availableUnusedPhotos[index]?.filename || null
  }

  // 生成照片记录
  const handleGeneratePhotoRecords = async () => {
    if (!confirm('确定要为所有照片生成基本记录吗？这将为photos文件夹中的每张照片创建一个卡片。')) {
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/stars/generate-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        alert(`生成成功：${result.message}`)
        // 生成成功后，关闭模态框让用户看到照片卡片
        onClose()
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (error) {
      console.error('生成照片记录失败:', error)
      alert('生成失败：' + (error as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  // 清理重复数据
  const handleCleanupDuplicates = async () => {
    if (!confirm('确定要清理重复数据吗？这将删除所有没有照片的记录，只保留有照片的记录。')) {
      return
    }

    setIsCleaningUp(true)
    try {
      const response = await fetch('/api/stars/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        alert(`清理成功：${result.message}`)
        // 清理成功后，可以重新导入数据
        setShowPreview(false)
        setPreviewData([])
      } else {
        throw new Error(result.error || '清理失败')
      }
    } catch (error) {
      console.error('清理重复数据失败:', error)
      alert('清理失败：' + (error as Error).message)
    } finally {
      setIsCleaningUp(false)
    }
  }

  // 处理导入
  const handleImport = async () => {
    if (previewData.length === 0) {
      alert('没有可导入的数据')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      // 为每个明星数据匹配照片
      const enhancedData = previewData.map((starData, index) => {
        const matchedPhoto = findMatchingPhoto(starData, index)
        
        return {
          ...starData,
          photoFilename: matchedPhoto || `unmatched_${index + 1}.jpg`,
          birthDate: starData.birthDate ? new Date(starData.birthDate).toISOString() : new Date('1990-01-01').toISOString(),
          birthMonth: starData.birthMonth || 1,
          height: starData.height || 175,
          representativeWorks: Array.isArray(starData.representativeWorks) ? starData.representativeWorks : []
        }
      })

      // 发送到后端
      const response = await fetch('/api/stars/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          stars: enhancedData,
          updateMode: updateMode 
        })
      })

      const result = await response.json()

      if (result.success) {
        setImportResult({
          success: true,
          message: result.message,
          count: result.results?.length || 0
        })
        setPreviewData([])
        setShowPreview(false)
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

  // 下载模板文件
  const downloadTemplate = () => {
    const templateData = [
      {
        '姓名(英)': 'Bright Vachirawit',
        '姓名(中)': '瓦奇拉维特·奇瓦雷',
        '昵称': 'Bright',
        '生日': '1997-12-27',
        '身高(cm)': 183,
        '毕业(就读)院校': '朱拉隆功大学',
        '所学专业': '国际商务管理',
        '代表作': '《2gether》、《F4 Thailand》',
        '照片文件名': 'bright_001.jpg'
      }
    ]

    const csvContent = [
      Object.keys(templateData[0]).join(','),
      ...templateData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '明星数据模板.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/80 border border-white/20 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">表格数据导入</h2>
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
            <FileSpreadsheet className="w-5 h-5" />
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
                  {previewData.length}
                </div>
                <div className="text-white/70">待导入</div>
              </div>
            </div>
          )}
        </div>

        {!showPreview ? (
          /* 文件上传区域 */
          <div className="space-y-6">
            <div>
              <label htmlFor="file-upload" className="block text-gray-200 font-medium mb-2">
                上传表格文件
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <UploadCloud className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="mb-2 text-sm text-gray-300">
                    <span className="font-semibold">点击上传</span> Excel或CSV文件
                  </p>
                  <p className="text-xs text-gray-400">支持 .xlsx, .xls, .csv 格式</p>
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载模板文件
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePhotoRecords}
                  className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      恢复照片卡片
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCleanupDuplicates}
                  className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      清理中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      清理重复数据
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 预览区域 */
          <div className="space-y-6">
            {/* 更新模式选择 */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">导入模式</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="updateMode"
                    value="smart"
                    checked={updateMode === 'smart'}
                    onChange={(e) => setUpdateMode(e.target.value as 'smart' | 'clear')}
                    className="w-4 h-4 text-green-500"
                  />
                  <div>
                    <span className="text-white font-medium">智能更新模式</span>
                    <p className="text-gray-400 text-xs">根据姓名或照片文件名匹配现有记录并更新，保留原有照片</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="updateMode"
                    value="clear"
                    checked={updateMode === 'clear'}
                    onChange={(e) => setUpdateMode(e.target.value as 'smart' | 'clear')}
                    className="w-4 h-4 text-red-500"
                  />
                  <div>
                    <span className="text-white font-medium">清空重建模式</span>
                    <p className="text-gray-400 text-xs">清空所有现有数据，重新导入（⚠️ 会丢失现有照片关联）</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">数据预览 ({previewData.length} 条记录)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  重新上传
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      导入中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      确认导入
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-3 py-2 text-left">英文名</th>
                    <th className="px-3 py-2 text-left">中文名</th>
                    <th className="px-3 py-2 text-left">昵称</th>
                    <th className="px-3 py-2 text-left">生日</th>
                    <th className="px-3 py-2 text-left">身高</th>
                    <th className="px-3 py-2 text-left">大学</th>
                    <th className="px-3 py-2 text-left">专业</th>
                    <th className="px-3 py-2 text-left">匹配照片</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((star, index) => {
                    console.log('渲染数据行:', index, star)
                    const matchedPhoto = findMatchingPhoto(star, index)
                    return (
                      <tr key={index} className="border-b border-white/10">
                        <td className="px-3 py-2">{star.englishName}</td>
                        <td className="px-3 py-2">{star.chineseName}</td>
                        <td className="px-3 py-2">{star.nickname || '-'}</td>
                        <td className="px-3 py-2">{formatBirthDate(star.birthDate)}</td>
                        <td className="px-3 py-2">{star.height || '-'}cm</td>
                        <td className="px-3 py-2">{star.university || '-'}</td>
                        <td className="px-3 py-2">{star.major || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            matchedPhoto ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {matchedPhoto || '未匹配'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-white/60 text-sm mt-2">
                  显示前10条记录，共{previewData.length}条
                </p>
              )}
            </div>
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <div className={`mt-6 p-4 rounded-lg ${
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
            <li>• 支持Excel (.xlsx, .xls) 和CSV文件格式</li>
            <li>• 表格列名必须包含：姓名(英)、姓名(中)、生日、身高等字段</li>
            <li>• 可在表格中添加"照片文件名"列来指定特定照片</li>
            <li>• 系统会自动为未指定照片的明星匹配可用照片</li>
            <li>• 建议先下载模板文件，按格式填写数据</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
