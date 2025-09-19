import { useState, useEffect } from 'react'
import { X, Search, User, Calendar, Ruler, GraduationCap, Film, Globe, Database } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

interface StarSearchResult {
  _id: string
  englishName: string
  chineseName: string
  nickname?: string
  birthDate?: string
  height?: number
  university?: string
  major?: string
  representativeWorks?: string[]
  photoFilename?: string
  matchScore?: number
}

interface TMDBPersonResult {
  id: number
  name: string
  chineseName: string
  englishName: string
  birthday?: string
  placeOfBirth?: string
  biography?: string
  profileImage?: string
  knownFor?: string[]
  popularity: number
  department?: string
  gender: number
  adult: boolean
  source: 'tmdb'
}

interface StarSearchModalProps {
  isOpen: boolean
  onClose: () => void
  photoFilename: string
  onAssociate: (star: StarSearchResult) => void
}

export default function StarSearchModal({ isOpen, onClose, photoFilename, onAssociate }: StarSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StarSearchResult[]>([])
  const [tmdbResults, setTmdbResults] = useState<TMDBPersonResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAssociating, setIsAssociating] = useState(false)
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'local' | 'tmdb'>('local')

  // 搜索本地艺人
  const searchStars = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`${API_BASE_URL}/stars/search?q=${encodeURIComponent(query)}&limit=20`)
      const result = await response.json()

      if (result.success) {
        setSearchResults(result.stars)
      } else {
        console.error('搜索失败:', result.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error('搜索艺人失败:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 搜索TMDB艺人
  const searchTMDBStars = async (query: string) => {
    if (!query.trim()) {
      setTmdbResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`${API_BASE_URL}/tmdb/search/person?query=${encodeURIComponent(query)}&limit=20`)
      const result = await response.json()

      if (result.results) {
        setTmdbResults(result.results)
      } else {
        console.error('TMDB搜索失败:', result.error)
        setTmdbResults([])
      }
    } catch (error) {
      console.error('TMDB搜索失败:', error)
      setTmdbResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchMode === 'local') {
        searchStars(searchQuery)
      } else {
        searchTMDBStars(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchMode])

  // 关联照片和本地艺人
  const handleAssociate = async (star: StarSearchResult) => {
    setIsAssociating(true)
    setSelectedStarId(star._id)

    try {
      const response = await fetch(`${API_BASE_URL}/stars/associate-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          starId: star._id,
          photoFilename: photoFilename
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        onAssociate(result.star)
        onClose()
      } else {
        alert('关联失败：' + result.error)
      }
    } catch (error) {
      console.error('关联失败:', error)
      alert('关联失败：' + (error as Error).message)
    } finally {
      setIsAssociating(false)
      setSelectedStarId(null)
    }
  }

  // 从TMDB创建新艺人并关联
  const handleCreateFromTMDB = async (tmdbPerson: TMDBPersonResult) => {
    setIsAssociating(true)
    setSelectedStarId(tmdbPerson.id.toString())

    try {
      // 首先创建新艺人
      const createResponse = await fetch(`${API_BASE_URL}/stars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          englishName: tmdbPerson.englishName,
          chineseName: tmdbPerson.chineseName,
          birthDate: tmdbPerson.birthday ? new Date(tmdbPerson.birthday).toISOString() : undefined,
          description: tmdbPerson.biography,
          representativeWorks: tmdbPerson.knownFor || [],
          tags: tmdbPerson.department ? [tmdbPerson.department] : [],
          tmdbId: tmdbPerson.id,
          tmdbData: tmdbPerson,
          // TMDB相关字段
          source: 'tmdb',
          popularity: tmdbPerson.popularity,
          department: tmdbPerson.department,
          placeOfBirth: tmdbPerson.placeOfBirth,
          biography: tmdbPerson.biography,
          knownFor: tmdbPerson.knownFor
        })
      })

      const createResult = await createResponse.json()

      if (createResult.success) {
        // 创建成功后关联照片
        const associateResponse = await fetch(`${API_BASE_URL}/stars/associate-photo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            starId: createResult.star._id,
            photoFilename: photoFilename
          })
        })

        const associateResult = await associateResponse.json()

        if (associateResult.success) {
          alert('成功从TMDB创建艺人并关联照片！')
          onAssociate(associateResult.star)
          onClose()
        } else {
          alert('艺人创建成功，但关联照片失败：' + associateResult.error)
        }
      } else {
        alert('创建艺人失败：' + createResult.error)
      }
    } catch (error) {
      console.error('创建艺人失败:', error)
      alert('创建艺人失败：' + (error as Error).message)
    } finally {
      setIsAssociating(false)
      setSelectedStarId(null)
    }
  }

  // 格式化生日
  const formatBirthDate = (dateString?: string) => {
    if (!dateString) return '未知'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return '未知'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">选择艺人关联</h2>
            <p className="text-gray-600 mt-1">为照片 <span className="font-mono text-blue-600">{photoFilename}</span> 选择对应的艺人</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          {/* 搜索模式切换 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">搜索来源：</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSearchMode('local')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  searchMode === 'local'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Database className="w-4 h-4" />
                本地数据库
              </button>
              <button
                onClick={() => setSearchMode('tmdb')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  searchMode === 'tmdb'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                TMDB
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchMode === 'local' ? "搜索本地艺人姓名或昵称..." : "搜索TMDB艺人姓名..."}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="p-6">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">搜索中...</span>
            </div>
          ) : searchQuery.trim() === '' ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">请输入艺人姓名开始搜索</p>
              <p className="text-sm mt-2">
                {searchMode === 'local' ? '支持中文名、英文名或昵称搜索' : '搜索TMDB数据库中的艺人信息'}
              </p>
            </div>
          ) : (searchMode === 'local' ? searchResults.length === 0 : tmdbResults.length === 0) ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">未找到匹配的艺人</p>
              <p className="text-sm mt-2">请尝试其他关键词</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                搜索结果 ({searchMode === 'local' ? searchResults.length : tmdbResults.length} 个)
                {searchMode === 'tmdb' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    TMDB
                  </span>
                )}
              </h3>
              
              <div className="grid gap-4">
                {searchMode === 'local' ? (
                  // 本地搜索结果
                  searchResults.map((star) => (
                    <div
                      key={star._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {star.chineseName}
                              </h4>
                              {star.englishName && (
                                <span className="text-gray-600 italic">({star.englishName})</span>
                              )}
                            </div>
                            {star.nickname && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {star.nickname}
                              </span>
                            )}
                            {star.photoFilename && !star.photoFilename.startsWith('placeholder_') && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                有照片
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatBirthDate(star.birthDate)}</span>
                            </div>
                            
                            {star.height && (
                              <div className="flex items-center gap-1">
                                <Ruler className="w-4 h-4" />
                                <span>{star.height}cm</span>
                              </div>
                            )}
                            
                            {star.university && (
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                <span>{star.university}</span>
                              </div>
                            )}
                            
                            {star.representativeWorks && star.representativeWorks.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Film className="w-4 h-4" />
                                <span>{star.representativeWorks.slice(0, 2).join('、')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleAssociate(star)}
                          disabled={isAssociating && selectedStarId === star._id}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2 ml-4"
                        >
                          {isAssociating && selectedStarId === star._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              关联中...
                            </>
                          ) : (
                            '选择关联'
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // TMDB搜索结果
                  tmdbResults.map((person) => (
                    <div
                      key={person.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {person.chineseName}
                              </h4>
                              {person.englishName && person.englishName !== person.chineseName && (
                                <span className="text-gray-600 italic">({person.englishName})</span>
                              )}
                            </div>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              TMDB
                            </span>
                            {person.popularity && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                热度: {Math.round(person.popularity)}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatBirthDate(person.birthday)}</span>
                            </div>
                            
                            {person.placeOfBirth && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{person.placeOfBirth}</span>
                              </div>
                            )}
                            
                            {person.department && (
                              <div className="flex items-center gap-1">
                                <Film className="w-4 h-4" />
                                <span>{person.department}</span>
                              </div>
                            )}
                            
                            {person.knownFor && person.knownFor.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Film className="w-4 h-4" />
                                <span>{person.knownFor.slice(0, 2).join('、')}</span>
                              </div>
                            )}
                          </div>
                          
                          {person.biography && (
                            <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {person.biography}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleCreateFromTMDB(person)}
                          disabled={isAssociating && selectedStarId === person.id.toString()}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-2 ml-4"
                        >
                          {isAssociating && selectedStarId === person.id.toString() ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              创建中...
                            </>
                          ) : (
                            '创建并关联'
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
