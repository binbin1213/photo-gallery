import { useState, useEffect } from 'react'
import AdminLoginModal from './AdminLoginModal'
import { useAdmin } from '../contexts/AdminContext'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { isAdmin, setIsAdmin } = useAdmin()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(false)
    } else {
      setShowLoginModal(true)
      setIsLoading(false)
    }
  }, [isAdmin])

  const handleLoginSuccess = () => {
    setIsAdmin(true)
    setShowLoginModal(false)
  }

  const handleLoginClose = () => {
    // 如果用户关闭登录模态框，重定向到主页
    setShowLoginModal(false)
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-600">
        <div className="text-white text-xl">验证管理员身份中...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-600">
        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={handleLoginClose}
          onSuccess={handleLoginSuccess}
        />
        {!showLoginModal && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-white text-xl">需要管理员权限访问此页面</div>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}
