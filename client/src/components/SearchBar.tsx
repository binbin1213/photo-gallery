import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = "搜索..." }: SearchBarProps) {
  const handleClear = () => {
    onChange('')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-3 h-3 sm:w-4 sm:h-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 sm:pl-10 pr-8 sm:pr-9 py-1.5 sm:py-2 bg-white/20 border border-white/30 rounded-lg text-sm sm:text-base text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm transition-all duration-300"
      />
      {value?.trim() && (
        <button
          type="button"
          aria-label="清除搜索"
          onClick={handleClear}
          className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 rounded-md hover:bg-white/20 transition-colors"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
        </button>
      )}
    </div>
  )
}