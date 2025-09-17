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
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)'
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