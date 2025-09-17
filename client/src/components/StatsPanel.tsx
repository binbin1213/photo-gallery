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
    // 这里可以调用API获取统计数据
    // 暂时使用模拟数据
    setStats({
      totalStars: totalPhotos,
      totalUniversities: 15,
      averageAge: 23,
      newestAdditions: 5
    })
  }, [totalPhotos])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">总明星数</p>
            <p className="text-white text-xl font-bold">{stats.totalStars}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <School className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">学校数量</p>
            <p className="text-white text-xl font-bold">{stats.totalUniversities}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">平均年龄</p>
            <p className="text-white text-xl font-bold">{stats.averageAge}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">本月新增</p>
            <p className="text-white text-xl font-bold">{stats.newestAdditions}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
