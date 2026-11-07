import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { errMsg, MONTHS } from '../lib/utils'
import { Field, Logo } from '../components/ui'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim(), birth_day: day, birth_month: month }, emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) toast.success('Revisa tu correo para confirmar la cuenta.')
        else toast.success('¡Registro exitoso! Un administrador debe aprobar tu acceso.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        toast.success('Te enviamos un correo para restablecer la contraseña.')
        setMode('login')
      }
    } catch (err) {
      const m = errMsg(err)
      toast.error(m === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-4 h-20 w-20 drop-shadow-[0_0_25px_rgba(227,191,141,0.35)]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Ministerio de <span className="text-gradient">Alabanza</span>
          </h1>
          <p className="mt-1 text-sm text-mist/70">CBI Valledupar</p>
        </div>

        <form onSubmit={submit} className="glass space-y-4 p-6">
          {mode !== 'reset' && (
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${mode === m ? 'bg-gold text-ink' : 'text-mist hover:text-white'}`}
                >
                  {m === 'login' ? 'Ingresar' : 'Registrarme'}
                </button>
              ))}
            </div>
          )}

          {mode === 'register' && (
            <>
              <Field label="Nombre completo">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: María Pérez" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Día de cumpleaños">
                  <input className="input" type="number" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} required />
                </Field>
                <Field label="Mes">
                  <select className="input" value={month} onChange={(e) => setMonth(e.target.value)} required>
                    <option value="">—</option>
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          <Field label="Correo electrónico">
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          {mode !== 'reset' && (
            <Field label="Contraseña">
              <input
                className="input"
                type="password"
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'register' ? <UserPlus size={18} /> : <LogIn size={18} />}
            {mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>

          <button type="button" className="w-full text-center text-xs text-mist/70 hover:text-gold" onClick={() => setMode(mode === 'reset' ? 'login' : 'reset')}>
            {mode === 'reset' ? 'Volver a ingresar' : '¿Olvidaste tu contraseña?'}
          </button>
        </form>
      </div>
    </div>
  )
}
