import { X, Calendar, Ruler, User, GraduationCap, Film, Edit, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { API_BASE_URL } from '../config/api'

interface Star {
  _id: string
  englishName: string
  chineseName: string
  thaiName?: string
  nickname?: string
  birthDate: string
  height: number
  age?: number
  calculatedAge?: number
  university?: string
  major?: string
  degree?: string
  representativeWorks?: string[]
  photoFilename: string
  description?: string
  // TMDB相关字段
  source?: 'tmdb' | 'local'
  tmdbId?: number
  popularity?: number
  department?: string
  placeOfBirth?: string
  biography?: string
  profileImage?: string
  knownFor?: string[]
}

interface CastMember {
  id: number
  name: string
  character: string
  order: number
  profileImage?: string
  adult: boolean
  gender: number
  knownForDepartment: string
  popularity: number
}

interface CastListData {
  id: number
  cast: CastMember[]
  crew: any[]
  castCount: number
  crewCount: number
}

interface StarProfileProps {
  star: Star
  onClose: () => void
  isAdmin?: boolean
  onEdit?: (star: Star) => void
  onReassociate?: () => void
}

export default function StarProfile({ star, onClose, isAdmin = false, onEdit, onReassociate }: StarProfileProps) {
  const [castListData, setCastListData] = useState<CastListData | null>(null)
  const [isLoadingCast, setIsLoadingCast] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null)
  
  // 调试信息
  console.log('🔍 StarProfile接收到的数据:', star)
  console.log('🔍 数据来源:', star.source)
  console.log('🔍 出生地:', star.placeOfBirth)
  console.log('🔍 个人简介:', star.biography)
  console.log('🔍 性别:', star.gender)

  // 格式化生日
  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  // 根据生日即时计算年龄（后端缺失时兜底）
  const calcAgeFromBirthDate = (dateString?: string) => {
    if (!dateString) return undefined
    const today = new Date()
    const birth = new Date(dateString)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // 获取电影演员列表
  const fetchCastList = async (movieTitle: string) => {
    setIsLoadingCast(true)
    setSelectedMovie(movieTitle)
    
    try {
      // 首先搜索电影获取TMDB ID
      const searchResponse = await fetch(`${API_BASE_URL}/api/tmdb/search/movie?query=${encodeURIComponent(movieTitle)}&limit=1`)
      const searchResult = await searchResponse.json()
      
      if (searchResult.results && searchResult.results.length > 0) {
        const movie = searchResult.results[0]
        
        // 获取演员列表
        const castResponse = await fetch(`${API_BASE_URL}/api/tmdb/movie/${movie.id}/cast`)
        const castResult = await castResponse.json()
        
        if (castResult.cast) {
          setCastListData(castResult)
        } else {
          alert('获取演员列表失败')
        }
      } else {
        alert('未找到该电影的信息')
      }
    } catch (error) {
      console.error('获取演员列表失败:', error)
      alert('获取演员列表失败：' + (error as Error).message)
    } finally {
      setIsLoadingCast(false)
    }
  }

  // 关闭演员列表
  const closeCastList = () => {
    setCastListData(null)
    setSelectedMovie(null)
  }

  // 格式化身高
  const formatHeight = (height: number) => {
    return `${height} cm`
  }

  // 格式化年龄
  const formatAge = (age?: number) => {
    return typeof age === 'number' && !Number.isNaN(age) ? `${age} 岁` : 'N/A'
  }

  const displayAge = star.calculatedAge ?? star.age ?? calcAgeFromBirthDate(star.birthDate)

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in-0 duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full h-[94vh] max-h-[97vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
               {/* 关闭按钮和编辑按钮 */}
               <div className="absolute top-4 right-4 z-10 flex gap-2">
                 {onReassociate && (
                   <button
                     onClick={onReassociate}
                     className="w-8 h-8 bg-green-500/90 hover:bg-green-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                     title="重新关联艺人"
                   >
                     <Search className="w-4 h-4 text-white" />
                   </button>
                 )}
                 {isAdmin && onEdit && (
                   <button
                     onClick={() => onEdit(star)}
                     className="w-8 h-8 bg-blue-500/90 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                     title="编辑信息"
                   >
                     <Edit className="w-4 h-4 text-white" />
                   </button>
                 )}
                 <button
                   onClick={onClose}
                   className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:rotate-90"
                 >
                   <X className="w-5 h-5 text-gray-600" />
                 </button>
               </div>

        {/* 照片区域 */}
        <div className="relative h-[60vh] bg-gray-100">
          <img
            src={`/uploads/photos/${star.photoFilename}`}
            alt={star.chineseName}
            className="w-full h-full object-cover"
          />
          
          {/* 渐变遮罩和姓名覆盖层 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {star.englishName}
            </h1>
            <div className="flex items-baseline justify-center gap-3 text-lg leading-tight">
              <span className="text-white font-semibold text-base">
                {star.chineseName}
              </span>
              {star.thaiName && (
                <>
                  <span className="text-white/60 text-sm">•</span>
                  <span className="text-white/90 font-medium text-base">
                    {star.thaiName}
                  </span>
                </>
              )}
              {star.nickname && (
                <>
                  <span className="text-white/60 text-sm">•</span>
                  <span className="text-white/80 italic text-base">
                    "{star.nickname}"
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">

          {/* 基本信息 */}
          <div className="space-y-4">
            {/* 数据来源标识 */}
            {star.source === 'tmdb' && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  TMDB数据
                </div>
                {star.popularity && (
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    热度: {Math.round(star.popularity)}
                  </div>
                )}
              </div>
            )}

            {/* 根据数据来源显示不同模板 */}
            {star.source === 'tmdb' ? (
              // TMDB模板
              <>
                {/* 生日 */}
                {star.birthDate && star.birthDate !== 'undefined' && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">出生日期</p>
                      <p className="text-sm text-gray-700">
                        {formatBirthDate(star.birthDate)}
                      </p>
                    </div>
                  </div>
                )}

                {/* 出生地 */}
                {star.placeOfBirth && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">出生地</p>
                      <p className="text-sm text-gray-700">
                        {star.placeOfBirth}
                      </p>
                    </div>
                  </div>
                )}

                {/* 职业部门 */}
                {star.department && (
                  <div className="flex items-center space-x-3">
                    <Film className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">职业</p>
                      <p className="text-sm text-gray-700">
                        {star.department}
                      </p>
                    </div>
                  </div>
                )}

                {/* 年龄 */}
                {displayAge && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">年龄</p>
                      <p className="text-sm text-gray-700">
                        {formatAge(displayAge)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 本地数据库模板
              <>
                {/* 生日 */}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">出生日期</p>
                    <p className="text-sm text-gray-700">
                      {formatBirthDate(star.birthDate)}
                    </p>
                  </div>
                </div>

                {/* 身高年龄 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Ruler className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">身高</p>
                      <p className="text-sm text-gray-700">
                        {formatHeight(star.height)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">年龄</p>
                      <p className="text-sm text-gray-700">
                        {formatAge(displayAge)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 教育信息 */}
            {(star.university || star.major) && (
              <div className="flex items-start space-x-3">
                <GraduationCap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">教育背景</p>
                  <p className="text-sm text-gray-700">
                    {star.university && star.major 
                      ? `${star.university} ${star.major}${star.degree ? ` (${star.degree})` : ''}`
                      : star.university || star.major
                    }
                  </p>
                </div>
              </div>
            )}

            {/* 代表作 */}
            {star.representativeWorks && star.representativeWorks.length > 0 && (
              <div className="flex items-start space-x-3">
                <Film className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">代表作</p>
                  <div className="flex flex-wrap gap-2">
                    {star.representativeWorks.map((work, index) => {
                      const cleanWork = work.replace(/《+|》+/g, '')
                      return (
                        <button
                          key={index}
                          onClick={() => fetchCastList(cleanWork)}
                          disabled={isLoadingCast}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          《{cleanWork}》
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">点击作品名称查看演员列表</p>
                </div>
              </div>
            )}

            {/* 个人描述 */}
            {(star.description || star.biography) && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">个人简介</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {star.biography || star.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 演员列表模态框 */}
      {castListData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">演员列表</h2>
                <p className="text-gray-600 mt-1">《{selectedMovie}》的演员阵容</p>
              </div>
              <button
                onClick={closeCastList}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Cast List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingCast ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">加载演员列表中...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      主要演员 ({castListData.castCount} 人)
                    </span>
                  </div>
                  
                  <div className="grid gap-4">
                    {castListData.cast.slice(0, 20).map((actor) => (
                      <div
                        key={actor.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {actor.profileImage ? (
                            <img
                              src={actor.profileImage}
                              alt={actor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {actor.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              饰演：{actor.character}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>热度: {Math.round(actor.popularity)}</span>
                              <span>部门: {actor.knownForDepartment}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {castListData.castCount > 20 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      显示前20位演员，共{castListData.castCount}位演员
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
