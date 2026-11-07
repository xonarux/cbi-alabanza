import { Clock, LogOut, RefreshCw, XCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/ui'

export default function PendingPage() {
  const { profile, refreshProfile, signOut } = useAuth()
  const rejected = profile?.status === 'rejected'
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 text-center">
        <Logo className="mx-auto mb-5 h-16 w-16" />
        {rejected ? <XCircle className="mx-auto mb-3 text-red-300" size={36} /> : <Clock className="mx-auto mb-3 text-gold" size={36} />}
        <h1 className="text-xl font-bold text-white">{rejected ? 'Acceso no aprobado' : `¡Hola, ${profile?.full_name ?? ''}!`}</h1>
        <p className="mt-2 text-sm text-mist/80">
          {rejected
            ? 'Tu solicitud no fue aprobada. Habla con el líder de alabanza si crees que es un error.'
            : 'Tu cuenta fue creada. Un administrador del ministerio debe aprobar tu acceso antes de que puedas ver la información.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-ghost" onClick={refreshProfile}>
            <RefreshCw size={16} /> Verificar
          </button>
          <button className="btn-ghost" onClick={signOut}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>
    </div>
  )
}
