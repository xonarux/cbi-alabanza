import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import RecoveryModal from './components/RecoveryModal'
import { AuthProvider } from './lib/auth'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <RecoveryModal />
        <Toaster theme="dark" position="top-center" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
