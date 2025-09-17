import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import PhotoGallery from './pages/PhotoGallery'
import AdminPanel from './pages/AdminPanel'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename="/">
        <div className="min-h-screen" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
        }}>
          <Routes>
            <Route path="/" element={<PhotoGallery />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                zIndex: 999999,
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px',
              },
            }}
            containerStyle={{
              zIndex: 999999,
              top: 60,
              right: 20,
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App