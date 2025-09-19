import { useState, useEffect } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface FilterOptions {
  // 年龄范围
  ageRange: {
    min: number | null
    max: number | null
  }
  // 身高范围
  heightRange: {
    min: number | null
    max: number | null
  }
  // 大学
  universities: string[]
  // 出生月份
  birthMonths: number[]
  // 学位
  degrees: string[]
  // 标签
  tags: string[]
  // 搜索关键词
  searchText: string
}

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterOptions) => void
  onClearFilters: () => void
  currentFilters: FilterOptions
}

export default function FilterPanel({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  onClearFilters, 
  currentFilters 
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters)
  const [expandedSections, setExpandedSections] = useState({
    age: true,
    height: true,
    education: false,
    personal: false,
    search: false
  })

  // 当外部过滤器变化时更新内部状态
  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleAgeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseInt(value)
    setFilters(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [type]: numValue
      }
    }))
  }

  const handleHeightChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseInt(value)
    setFilters(prev => ({
      ...prev,
      heightRange: {
        ...prev.heightRange,
        [type]: numValue
      }
    }))
  }

  const handleUniversityToggle = (university: string) => {
    setFilters(prev => ({
      ...prev,
      universities: prev.universities.includes(university)
        ? prev.universities.filter(u => u !== university)
        : [...prev.universities, university]
    }))
  }

  const handleBirthMonthToggle = (month: number) => {
    setFilters(prev => ({
      ...prev,
      birthMonths: prev.birthMonths.includes(month)
        ? prev.birthMonths.filter(m => m !== month)
        : [...prev.birthMonths, month]
    }))
  }

  const handleDegreeToggle = (degree: string) => {
    setFilters(prev => ({
      ...prev,
      degrees: prev.degrees.includes(degree)
        ? prev.degrees.filter(d => d !== degree)
        : [...prev.degrees, degree]
    }))
  }

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleClear = () => {
    const emptyFilters: FilterOptions = {
      ageRange: { min: null, max: null },
      heightRange: { min: null, max: null },
      universities: [],
      birthMonths: [],
      degrees: [],
      tags: [],
      searchText: ''
    }
    setFilters(emptyFilters)
    onClearFilters()
  }

  // 预设的选项数据
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const commonUniversities = ['孔敬大学', '朱拉隆功大学', '玛希隆大学', '清迈大学', '法政大学', '农业大学', '艺术大学', '其他']
  const commonDegrees = ['本科', '硕士', '博士', '其他']
  const commonTags = ['演员', '歌手', '模特', '主持人', '其他']

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-6 h-6 text-blue-500" />
            筛选条件
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6">
          {/* 年龄范围 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('age')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">年龄范围</span>
              {expandedSections.age ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.age && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最小年龄</label>
                    <input
                      type="number"
                      value={filters.ageRange.min || ''}
                      onChange={(e) => handleAgeChange('min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="18"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最大年龄</label>
                    <input
                      type="number"
                      value={filters.ageRange.max || ''}
                      onChange={(e) => handleAgeChange('max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="35"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[20, 25, 30, 35].map(age => (
                    <button
                      key={age}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        ageRange: { min: age - 5, max: age + 5 }
                      }))}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {age - 5}-{age + 5}岁
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 身高范围 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('height')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">身高范围</span>
              {expandedSections.height ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.height && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最小身高 (cm)</label>
                    <input
                      type="number"
                      value={filters.heightRange.min || ''}
                      onChange={(e) => handleHeightChange('min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="170"
                      min="100"
                      max="250"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最大身高 (cm)</label>
                    <input
                      type="number"
                      value={filters.heightRange.max || ''}
                      onChange={(e) => handleHeightChange('max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="190"
                      min="100"
                      max="250"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[170, 175, 180, 185].map(height => (
                    <button
                      key={height}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        heightRange: { min: height - 5, max: height + 5 }
                      }))}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      {height - 5}-{height + 5}cm
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 教育信息 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('education')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">教育信息</span>
              {expandedSections.education ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.education && (
              <div className="px-4 pb-4 space-y-4">
                {/* 大学 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">大学</label>
                  <div className="grid grid-cols-2 gap-2">
                    {commonUniversities.map(university => (
                      <button
                        key={university}
                        onClick={() => handleUniversityToggle(university)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          filters.universities.includes(university)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {university}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 学位 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学位</label>
                  <div className="flex gap-2">
                    {commonDegrees.map(degree => (
                      <button
                        key={degree}
                        onClick={() => handleDegreeToggle(degree)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          filters.degrees.includes(degree)
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {degree}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 个人信息 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">个人信息</span>
              {expandedSections.personal ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.personal && (
              <div className="px-4 pb-4 space-y-4">
                {/* 出生月份 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">出生月份</label>
                  <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((month, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handleBirthMonthToggle(index + 1)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          filters.birthMonths.includes(index + 1)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <div className="flex gap-2 flex-wrap">
                    {commonTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          filters.tags.includes(tag)
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 搜索 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('search')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">高级搜索</span>
              {expandedSections.search ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.search && (
              <div className="px-4 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">搜索关键词</label>
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="搜索姓名、大学、专业等..."
                />
                <p className="text-xs text-gray-500 mt-1">支持搜索姓名、大学、专业、代表作等字段</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            清除所有筛选
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
