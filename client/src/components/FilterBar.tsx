import { useState } from 'react'
import { Filter, SortAsc, SortDesc } from 'lucide-react'

interface FilterBarProps {
  onSortChange: (sort: string, order: 'asc' | 'desc') => void
  onFilterChange?: (filters: any) => void
}

export default function FilterBar({ onSortChange, onFilterChange }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSortChange = (newSort: string) => {
    const newOrder = newSort === sortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(newSort)
    setSortOrder(newOrder)
    onSortChange(newSort, newOrder)
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* 排序按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSortChange('chineseName')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            sortBy === 'chineseName' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          按姓名
          {sortBy === 'chineseName' && (
            sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={() => handleSortChange('createdAt')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            sortBy === 'createdAt' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          按时间
          {sortBy === 'createdAt' && (
            sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 筛选按钮 */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        筛选
      </button>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-600/50 z-10">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-white/80 mb-2">按学校筛选</label>
              <select 
                className="w-full px-3 py-2 rounded bg-white/10 text-white border border-white/20"
                onChange={(e) => onFilterChange?.({ university: e.target.value })}
              >
                <option value="">全部学校</option>
                <option value="朱拉隆功大学">朱拉隆功大学</option>
                <option value="玛希隆大学">玛希隆大学</option>
                {/* 更多学校选项 */}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/80 mb-2">按年龄筛选</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="最小年龄" 
                  className="flex-1 px-3 py-2 rounded bg-white/10 text-white border border-white/20"
                  onChange={(e) => onFilterChange?.({ minAge: e.target.value })}
                />
                <input 
                  type="number" 
                  placeholder="最大年龄" 
                  className="flex-1 px-3 py-2 rounded bg-white/10 text-white border border-white/20"
                  onChange={(e) => onFilterChange?.({ maxAge: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
