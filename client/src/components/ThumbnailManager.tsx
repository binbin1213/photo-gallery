/// <reference types="react" />
import { useState } from 'react'
import { Image, Zap, Activity, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { useThumbnailGeneration } from '../hooks/useThumbnail'

/**
 * 缩略图管理组件
 * 用于管理员界面，管理缩略图的生成和状态
 */
export default function ThumbnailManager() {
  const { generating, clearing, status, generateThumbnails, clearThumbnails, getStatus } = useThumbnailGeneration()
  const [showDetails, setShowDetails] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const getCoverageColor = (coverage: string) => {
    const percent = parseFloat(coverage)
    if (percent >= 0.9) return 'text-green-400'
    if (percent >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getCoverageStatus = (coverage: string) => {
    const percent = parseFloat(coverage)
    if (percent >= 0.9) return { icon: CheckCircle, text: '优秀', color: 'text-green-400' }
    if (percent >= 0.6) return { icon: Activity, text: '良好', color: 'text-yellow-400' }
    return { icon: AlertCircle, text: '需要优化', color: 'text-red-400' }
  }

  const handleClearThumbnails = async () => {
    try {
      await clearThumbnails()
      setShowClearConfirm(false)
    } catch (error) {
      alert('清除缩略图失败，请查看控制台了解详情')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">缩略图管理</h2>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? '收起' : '详情'}
        </button>
      </div>

      {/* 状态概览 */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">总照片数</p>
                <p className="text-2xl font-bold text-white">{status.totalPhotos}</p>
              </div>
              <Image className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">缩略图文件</p>
                <p className="text-2xl font-bold text-white">{status.thumbnailFiles}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">覆盖率</p>
                <p className={`text-2xl font-bold ${getCoverageColor(status.coverage)}`}>
                  {(parseFloat(status.coverage) * 100).toFixed(0)}%
                </p>
              </div>
              {(() => {
                const statusInfo = getCoverageStatus(status.coverage)
                const IconComponent = statusInfo.icon
                return <IconComponent className={`w-8 h-8 ${statusInfo.color}`} />
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 详细信息 */}
      {showDetails && status && (
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">系统详情</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">照片目录:</p>
              <p className="text-white font-mono break-all">{status.photosDir}</p>
            </div>
            <div>
              <p className="text-gray-400">缩略图目录:</p>
              <p className="text-white font-mono break-all">{status.thumbnailsDir}</p>
            </div>
          </div>
        </div>
      )}

      {/* 状态指示器 */}
      {status && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">缩略图覆盖率:</span>
            {(() => {
              const statusInfo = getCoverageStatus(status.coverage)
              return (
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              )
            })()}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                parseFloat(status.coverage) >= 0.9
                  ? 'bg-green-500'
                  : parseFloat(status.coverage) >= 0.6
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(parseFloat(status.coverage) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 生成状态 */}
      {generating && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-400 font-medium">正在生成缩略图...</p>
              <p className="text-gray-400 text-sm">
                系统会智能跳过已存在的缩略图，这可能需要几分钟时间
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 清除状态 */}
      {clearing && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-medium">正在清除缩略图...</p>
              <p className="text-gray-400 text-sm">
                正在删除所有缩略图文件和数据库记录
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={generateThumbnails}
          disabled={generating || clearing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            generating || clearing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
          }`}
        >
          <Zap className="w-4 h-4" />
          {generating ? '生成中...' : '生成缩略图'}
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={generating || clearing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            generating || clearing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {clearing ? '清除中...' : '清除缩略图'}
        </button>

        <button
          onClick={getStatus}
          disabled={generating || clearing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            generating || clearing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 hover:bg-gray-700 text-white hover:scale-105'
          }`}
        >
          <Activity className="w-4 h-4" />
          刷新状态
        </button>
      </div>

      {/* 确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">确认清除缩略图</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              此操作将删除所有缩略图文件和数据库记录。这是不可逆的操作，但不会影响原始照片。
              您确定要继续吗？
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearThumbnails}
                disabled={clearing}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {clearing ? '清除中...' : '确认清除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
        <h4 className="text-white font-medium mb-2">关于缩略图优化</h4>
        <div className="text-gray-400 text-sm space-y-1">
          <p>• <strong>智能生成</strong>：系统会自动为每张照片生成多种尺寸和格式的缩略图，智能跳过已存在的文件</p>
          <p>• <strong>智能选择</strong>：根据用户设备和网络状况自动选择最佳格式</p>
          <p>• <strong>性能提升</strong>：缩略图通常比原图小90%以上，大幅提升加载速度</p>
          <p>• <strong>格式支持</strong>：WebP（最佳压缩）、JPEG（通用）、PNG（透明）</p>
          <p>• <strong>清除功能</strong>：可以完全清除所有缩略图文件和数据库记录，不影响原始照片</p>
        </div>
      </div>
    </div>
  )
}
