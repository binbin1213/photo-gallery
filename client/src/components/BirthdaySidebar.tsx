import { useState, useEffect } from 'react'
import { Calendar, Heart, Star, Gift, Cake, Sparkles } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

interface Star {
  _id: string
  englishName: string
  chineseName?: string
  birthDate?: string
  age?: number
  photoFilename?: string
}

interface BirthdaySidebarProps {
  // 移除photos参数，直接从数据库获取
}

interface BirthdayPerson {
  star: Star
  birthDate: string
  birthMonth: number
  birthDay: number
  age: number
}

// 生日祝福语库
const birthdayBlessings = [
  "🎂 生日快乐！愿你永远年轻帅气！",
  "✨ 新的一岁，新的开始，愿你前程似锦！",
  "🌟 生日快乐！愿你的每一天都充满阳光！",
  "💫 祝你生日快乐，事业蒸蒸日上！",
  "🎉 生日快乐！愿你的笑容永远灿烂！",
  "💖 新的一岁，愿你收获更多美好！",
  "🌈 生日快乐！愿你的生活如彩虹般绚丽！",
  "🎁 祝你生日快乐，身体健康，万事如意！",
  "🌸 生日快乐！愿你如花般美丽绽放！",
  "🔥 新的一岁，愿你更加闪耀夺目！",
  "💎 生日快乐！愿你如钻石般璀璨！",
  "🌺 祝你生日快乐，愿你的未来更加精彩！"
]

export default function BirthdaySidebar({}: BirthdaySidebarProps) {
  const [birthdayPeople, setBirthdayPeople] = useState<BirthdayPerson[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [blessingIndex, setBlessingIndex] = useState(0)

  // 获取当月生日的艺人
  useEffect(() => {
    const fetchBirthdayStars = async () => {
      try {
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        
        // 从数据库获取所有艺人信息
        const response = await fetch(`${API_BASE_URL}/api/stars`)
        if (!response.ok) {
          throw new Error('Failed to fetch stars')
        }
        
        const stars: Star[] = await response.json()
        const birthdayMap = new Map<string, BirthdayPerson>()
        
        stars.forEach(star => {
          if (star.birthDate && star._id) {
            try {
              const birthDate = new Date(star.birthDate)
              const birthMonth = birthDate.getMonth() + 1
              const birthDay = birthDate.getDate()
              
              if (birthMonth === currentMonth) {
                const age = currentDate.getFullYear() - birthDate.getFullYear()
                const key = `${star._id}-${birthMonth}-${birthDay}`
                
                // 使用Map避免重复
                if (!birthdayMap.has(key)) {
                  birthdayMap.set(key, {
                    star,
                    birthDate: star.birthDate,
                    birthMonth,
                    birthDay,
                    age
                  })
                }
              }
            } catch (error) {
              console.warn('Invalid birth date:', star.birthDate)
            }
          }
        })
        
        // 转换为数组并按生日日期排序
        const birthdayList = Array.from(birthdayMap.values()).sort((a, b) => a.birthDay - b.birthDay)
        
        setBirthdayPeople(birthdayList)
        setCurrentMonth(currentMonth)
      } catch (error) {
        console.error('Error fetching birthday stars:', error)
      }
    }
    
    fetchBirthdayStars()
  }, [])

  // 随机选择祝福语
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * birthdayBlessings.length)
    setBlessingIndex(randomIndex)
  }, [birthdayPeople])

  // 获取月份名称
  const getMonthName = (month: number) => {
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ]
    return monthNames[month - 1]
  }

  // 获取生日状态
  const getBirthdayStatus = (birthDay: number) => {
    const today = new Date().getDate()
    if (birthDay === today) {
      return { text: '今天生日', color: 'text-red-400', bgColor: 'bg-red-500/20' }
    } else if (birthDay > today) {
      return { text: `${birthDay - today}天后`, color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
    } else {
      return { text: '已过', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
    }
  }

  if (birthdayPeople.length === 0) {
    return (
      <div className="w-80 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">
            {getMonthName(currentMonth)}寿星
          </h3>
        </div>
        
        <div className="text-center py-8">
          <Cake className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">本月暂无生日艺人</p>
          <p className="text-gray-500 text-sm mt-2">期待下个月的寿星们！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">
          {getMonthName(currentMonth)}寿星
        </h3>
        <div className="ml-auto bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-sm">
          {birthdayPeople.length}人
        </div>
      </div>

      {/* 祝福语 */}
      <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-4 mb-6 border border-pink-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <span className="text-pink-300 text-sm font-medium">生日祝福</span>
        </div>
        <p className="text-white text-sm leading-relaxed">
          {birthdayBlessings[blessingIndex]}
        </p>
      </div>

      {/* 生日艺人列表 */}
      <div className="space-y-4">
        {birthdayPeople.map((person, index) => {
          const status = getBirthdayStatus(person.birthDay)
          
          return (
            <div
              key={`${person.star._id}-${person.birthDay}`}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* 艺人照片 */}
                <div className="relative">
                  <img
                    src={person.star.photoFilename ? `${API_BASE_URL}/api/thumbnails/${person.star.photoFilename}/small` : undefined}
                    alt={person.star.englishName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20 group-hover:border-blue-400/50 transition-colors"
                    onError={(e) => {
                      // 如果图片加载失败，显示默认头像
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="64" height="64" rx="32" fill="#374151"/>
                          <path d="M32 32C36.4183 32 40 28.4183 40 24C40 19.5817 36.4183 16 32 16C27.5817 16 24 19.5817 24 24C24 28.4183 27.5817 32 32 32Z" fill="#9CA3AF"/>
                          <path d="M32 36C24.268 36 18 42.268 18 50H46C46 42.268 39.732 36 32 36Z" fill="#9CA3AF"/>
                        </svg>
                      `)}`;
                    }}
                  />
                  {/* 生日装饰 */}
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Cake className="w-3 h-3 text-yellow-800" />
                    </div>
                  </div>
                </div>

                {/* 艺人信息 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate">
                    {person.star.chineseName && !person.star.chineseName.startsWith('照片_') 
                      ? person.star.chineseName 
                      : person.star.englishName}
                  </h4>
                  {person.star.chineseName && !person.star.chineseName.startsWith('照片_') && (
                    <p className="text-white/70 text-sm truncate">
                      {person.star.englishName}
                    </p>
                  )}
                  
                  {/* 生日信息 */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300 text-xs">
                        {person.birthMonth}月{person.birthDay}日
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300 text-xs">
                        {person.age}岁
                      </span>
                    </div>
                  </div>
                </div>

                {/* 生日状态 */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                  {status.text}
                </div>
              </div>

              {/* 特殊效果 - 今天生日 */}
              {person.birthDay === new Date().getDate() && (
                <div className="mt-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-sm font-medium">
                    今天是{person.star.chineseName && !person.star.chineseName.startsWith('照片_') 
                      ? person.star.chineseName 
                      : person.star.englishName}的生日！
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部装饰 */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Gift className="w-4 h-4" />
          <span className="text-sm">愿所有寿星都快乐！</span>
          <Gift className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
