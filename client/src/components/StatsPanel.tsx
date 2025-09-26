import { useState, useEffect } from 'react'
import { Users, School, Calendar, TrendingUp } from 'lucide-react'

interface StatsPanelProps {
  totalPhotos: number
}

export default function StatsPanel({ totalPhotos }: StatsPanelProps) {
  const [stats, setStats] = useState({
    totalStars: 0,
    totalUniversities: 0,
    averageAge: 0,
    newestAdditions: 0
  })

  useEffect(() => {
    // 从API获取真实统计数据
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalStars: data.totalStars || totalPhotos,
            totalUniversities: data.totalUniversities || 0,
            averageAge: data.averageAge || 0,
            newestAdditions: data.newestAdditions || 0
          })
        } else {
          // API失败时使用基本数据
          setStats({
            totalStars: totalPhotos,
            totalUniversities: 0,
            averageAge: 0,
            newestAdditions: 0
          })
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        // 出错时使用基本数据
        setStats({
          totalStars: totalPhotos,
          totalUniversities: 0,
          averageAge: 0,
          newestAdditions: 0
        })
      }
    }

    fetchStats()
  }, [totalPhotos])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 sm:p-4 border border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-3 h-3 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs sm:text-sm">总明星数</p>
            <p className="text-white text-sm sm:text-xl font-bold">{stats.totalStars}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 sm:p-4 border border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
            <School className="w-3 h-3 sm:w-5 sm:h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs sm:text-sm">学校数量</p>
            <p className="text-white text-sm sm:text-xl font-bold">{stats.totalUniversities}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 sm:p-4 border border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
            <Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs sm:text-sm">平均年龄</p>
            <p className="text-white text-sm sm:text-xl font-bold">{stats.averageAge}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 sm:p-4 border border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-orange-500/20 rounded-lg">
            <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs sm:text-sm">本月新增</p>
            <p className="text-white text-sm sm:text-xl font-bold">{stats.newestAdditions}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
