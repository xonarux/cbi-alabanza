import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { supabaseConfigured } from './lib/supabase'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import AuthPage from './pages/AuthPage'
import PendingPage from './pages/PendingPage'
import HomePage from './pages/HomePage'
import InfoPage from './pages/InfoPage'
import DevotionalsPage from './pages/DevotionalsPage'
import FastsPage from './pages/FastsPage'
import RestsPage from './pages/RestsPage'
import SongsPage from './pages/SongsPage'
import ProposalsPage from './pages/ProposalsPage'
import BirthdaysPage from './pages/BirthdaysPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { session, profile, loading, isApproved, isAdmin } = useAuth()

  if (!supabaseConfigured)
    return <div className="p-10 text-center text-mist">Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</div>
  if (loading || (session && !profile)) return <Spinner />
  if (!session) return <AuthPage />
  if (!isApproved) return <PendingPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="info" element={<InfoPage />} />
        <Route path="devocionales" element={<DevotionalsPage />} />
        <Route path="ayunos" element={<FastsPage />} />
        <Route path="descansos" element={<RestsPage />} />
        <Route path="canciones" element={<SongsPage />} />
        <Route path="propuestas" element={<ProposalsPage />} />
        <Route path="cumpleanos" element={<BirthdaysPage />} />
        {isAdmin && <Route path="ajustes" element={<SettingsPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
