import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

interface Star {
  _id: string
  englishName: string
  chineseName: string
  thaiName?: string
  nickname?: string
  birthDate: string
  height: number
  weight?: number
  university?: string
  major?: string
  degree?: string
  representativeWorks?: string[]
  photoFilename: string
  description?: string
  tags?: string[]
}

interface StarEditModalProps {
  isOpen: boolean
  onClose: () => void
  star: Star | null
  onSave: (updatedStar: Star) => void
}

export default function StarEditModal({ isOpen, onClose, star, onSave }: StarEditModalProps) {
  const [formData, setFormData] = useState<Partial<Star>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // 当star变化时，初始化表单数据
  useEffect(() => {
    if (star) {
      setFormData({
        englishName: star.englishName || '',
        chineseName: star.chineseName || '',
        thaiName: star.thaiName || '',
        nickname: star.nickname || '',
        birthDate: star.birthDate ? new Date(star.birthDate).toISOString().split('T')[0] : '',
        height: star.height || 175,
        weight: star.weight || undefined,
        university: star.university || '',
        major: star.major || '',
        degree: star.degree || '',
        representativeWorks: star.representativeWorks || [],
        description: star.description || '',
        tags: star.tags || []
      })
    }
  }, [star])

  const handleInputChange = (field: keyof Star, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleWorksChange = (value: string) => {
    const works = value.split(/[、，,]/).map(work => work.trim()).filter(work => work)
    setFormData(prev => ({
      ...prev,
      representativeWorks: works
    }))
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(/[、，,]/).map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const handleSave = async () => {
    if (!star) return

    // 验证必填字段
    if (!formData.englishName?.trim() || !formData.chineseName?.trim()) {
      setError('英文名和中文名不能为空')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // 准备更新数据
      const updateData = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : star.birthDate,
        birthMonth: formData.birthDate ? new Date(formData.birthDate).getMonth() + 1 : star.birthMonth || 1,
        height: formData.height || 175,
        weight: formData.weight || null
      }

      // 发送更新请求
      const response = await fetch(`http://192.168.1.98:5551/api/stars/${star._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        // 更新成功，调用父组件的保存回调
        onSave(result.star)
        onClose()
      } else {
        throw new Error(result.error || '更新失败')
      }
    } catch (error) {
      console.error('更新明星信息失败:', error)
      setError('更新失败：' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !star) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">编辑明星信息</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英文名 *
              </label>
              <input
                type="text"
                value={formData.englishName || ''}
                onChange={(e) => handleInputChange('englishName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="English Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                中文名 *
              </label>
              <input
                type="text"
                value={formData.chineseName || ''}
                onChange={(e) => handleInputChange('chineseName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="中文名"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                泰文名
              </label>
              <input
                type="text"
                value={formData.thaiName || ''}
                onChange={(e) => handleInputChange('thaiName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Thai Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                昵称
              </label>
              <input
                type="text"
                value={formData.nickname || ''}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nickname"
              />
            </div>
          </div>

          {/* 个人信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生日
              </label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                身高 (cm)
              </label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 175)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="175"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                体重 (kg)
              </label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="70"
              />
            </div>
          </div>

          {/* 教育信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                大学
              </label>
              <input
                type="text"
                value={formData.university || ''}
                onChange={(e) => handleInputChange('university', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="University"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专业
              </label>
              <input
                type="text"
                value={formData.major || ''}
                onChange={(e) => handleInputChange('major', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Major"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学位
            </label>
            <input
              type="text"
              value={formData.degree || ''}
              onChange={(e) => handleInputChange('degree', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Degree (e.g., 本科, 硕士)"
            />
          </div>

          {/* 代表作 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              代表作
            </label>
            <input
              type="text"
              value={formData.representativeWorks?.join('、') || ''}
              onChange={(e) => handleWorksChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="用顿号分隔多个作品，如：2gether、F4 Thailand"
            />
            <p className="text-xs text-gray-500 mt-1">用顿号（、）或逗号（，）分隔多个作品</p>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <input
              type="text"
              value={formData.tags?.join('、') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="用顿号分隔多个标签，如：演员、歌手、模特"
            />
            <p className="text-xs text-gray-500 mt-1">用顿号（、）或逗号（，）分隔多个标签</p>
          </div>

          {/* 个人描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              个人描述
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="个人简介..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
