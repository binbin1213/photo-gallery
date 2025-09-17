import { X, Calendar, Ruler, Weight, GraduationCap, Film } from 'lucide-react'

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
}

interface StarProfileProps {
  star: Star
  onClose: () => void
}

export default function StarProfile({ star, onClose }: StarProfileProps) {
  // 格式化生日
  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  // 格式化身高
  const formatHeight = (height: number) => {
    return `${height} cm`
  }

  // 格式化体重
  const formatWeight = (weight?: number) => {
    return weight ? `${weight} kg` : 'N/A'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in-0 duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full h-[92vh] max-h-[96vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:rotate-90"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* 照片区域 */}
        <div className="relative h-[50vh] bg-gray-100">
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

            {/* 身高体重 */}
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
                <Weight className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">体重</p>
                  <p className="text-sm text-gray-700">
                    {formatWeight(star.weight)}
                  </p>
                </div>
              </div>
            </div>

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
                  <p className="text-sm text-gray-700">
                    《{star.representativeWorks.join('》、《')}》
                  </p>
                </div>
              </div>
            )}

            {/* 个人描述 */}
            {star.description && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">个人简介</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {star.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
