import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminContextType {
  isAdmin: boolean
  setIsAdmin: (isAdmin: boolean) => void
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

interface AdminProviderProps {
  children: ReactNode
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdminState] = useState(false)

  useEffect(() => {
    // 检查本地存储中的管理员状态
    const checkAdminStatus = () => {
      const adminSession = localStorage.getItem('adminAuthenticated')
      const sessionTimestamp = localStorage.getItem('adminSessionTimestamp')
      
      if (adminSession === 'true' && sessionTimestamp) {
        const now = Date.now()
        const sessionTime = parseInt(sessionTimestamp)
        const sessionDuration = 24 * 60 * 60 * 1000 // 24小时

        if (now - sessionTime < sessionDuration) {
          setIsAdminState(true)
        } else {
          // 会话已过期，清除状态
          localStorage.removeItem('adminAuthenticated')
          localStorage.removeItem('adminSessionTimestamp')
          setIsAdminState(false)
        }
      } else {
        setIsAdminState(false)
      }
    }

    checkAdminStatus()
    
    // 每分钟检查一次会话状态
    const interval = setInterval(checkAdminStatus, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const setIsAdmin = (adminStatus: boolean) => {
    setIsAdminState(adminStatus)
    if (adminStatus) {
      localStorage.setItem('adminAuthenticated', 'true')
      localStorage.setItem('adminSessionTimestamp', Date.now().toString())
    } else {
      localStorage.removeItem('adminAuthenticated')
      localStorage.removeItem('adminSessionTimestamp')
    }
  }

  const logout = () => {
    setIsAdmin(false)
    window.location.href = '/'
  }

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin, logout }}>
      {children}
    </AdminContext.Provider>
  )
}
