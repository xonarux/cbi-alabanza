import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BookHeart, BookOpen, Cake, Flame, Home, Lightbulb, LogOut, Menu, Moon, Music, Settings, Shield, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Fast } from '../lib/types'
import { cx, fmt } from '../lib/utils'
import { Avatar, Logo } from './ui'
import BirthdayAlert from './BirthdayAlert'

const NAV = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/canciones', label: 'Canciones', icon: Music },
  { to: '/devocionales', label: 'Devocionales', icon: BookHeart },
  { to: '/ayunos', label: 'Ayunos y vigilias', icon: Flame, badge: true },
  { to: '/descansos', label: 'Descansos', icon: Moon },
  { to: '/propuestas', label: 'Propuestas', icon: Lightbulb },
  { to: '/cumpleanos', label: 'Cumpleaños', icon: Cake },
  { to: '/info', label: 'Información', icon: BookOpen },
]
const MOBILE = ['/', '/canciones', '/devocionales', '/ayunos']

export default function Layout() {
  const { profile, isAdmin, signOut } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const [unseen, setUnseen] = useState(0)
  const loc = useLocation()
  const nav = useNavigate()

  // Avisos de ayunos y vigilias nuevos
  useEffect(() => {
    if (!profile) return
    supabase
      .from('fasts')
      .select('id,type,date', { count: 'exact' })
      .gt('created_at', profile.fasts_seen_at)
      .then(({ data, count }) => {
        const n = count ?? 0
        setUnseen(n)
        if (n > 0 && loc.pathname !== '/ayunos') {
          const f = data?.[0] as Fast | undefined
          toast(n === 1 && f ? `🔥 Nuevo ${f.type} programado: ${fmt(f.date)}` : `🔥 Hay ${n} ayunos/vigilias nuevos`, {
            duration: 10000,
            action: { label: 'Ver', onClick: () => nav('/ayunos') },
          })
        }
      })
    const ch = supabase
      .channel('fasts-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fasts' }, (payload) => {
        const f = payload.new as Fast
        setUnseen((u) => u + 1)
        toast(`🔥 Nuevo ${f.type}: ${fmt(f.date)}${f.time ? ' · ' + f.time : ''}`, {
          duration: 12000,
          action: { label: 'Ver', onClick: () => nav('/ayunos') },
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  useEffect(() => {
    if (loc.pathname === '/ayunos' && unseen > 0) {
      supabase.rpc('mark_fasts_seen').then(() => setUnseen(0))
    }
    setDrawer(false)
  }, [loc.pathname, unseen])

  const items = [...NAV, ...(isAdmin ? [{ to: '/ajustes', label: 'Ajustes', icon: Settings }] : [])]

  const link = (it: (typeof items)[number], compact = false) => (
    <NavLink
      key={it.to}
      to={it.to}
      end={it.to === '/'}
      className={({ isActive }) =>
        cx(
          'relative flex items-center gap-3 rounded-xl font-semibold transition',
          compact ? 'flex-1 flex-col gap-1 px-1 py-2 text-[11px]' : 'px-3 py-2.5 text-sm',
          isActive ? (compact ? 'text-gold' : 'bg-gold/10 text-gold ring-1 ring-gold/20') : 'text-mist/80 hover:bg-white/5 hover:text-white',
        )
      }
    >
      <span className="relative">
        <it.icon size={compact ? 22 : 18} />
        {'badge' in it && it.badge && unseen > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unseen}</span>
        )}
      </span>
      <span className={compact ? 'truncate' : ''}>{compact ? it.label.split(' ')[0] : it.label}</span>
    </NavLink>
  )

  const userBox = (
    <div className="glass flex items-center gap-3 p-3">
      <Avatar name={profile?.full_name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">{profile?.full_name}</div>
        <div className="flex items-center gap-1 text-xs text-mist/70">
          {isAdmin ? (
            <>
              <Shield size={12} className="text-gold" /> Administrador
            </>
          ) : (
            'Miembro'
          )}
        </div>
      </div>
      <button className="btn-icon" onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión">
        <LogOut size={18} />
      </button>
    </div>
  )

  const brand = (
    <div className="flex items-center gap-3">
      <Logo className="h-10 w-10" />
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-wide text-white">CBI ALABANZA</div>
        <div className="text-xs text-mist/60">Valledupar</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <BirthdayAlert />

      {/* Barra lateral escritorio */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-6 border-r border-white/5 bg-ink/40 p-5 backdrop-blur-xl lg:flex">
        {brand}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">{items.map((it) => link(it))}</nav>
        {userBox}
      </aside>

      {/* Encabezado móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        {brand}
        <button className="btn-icon" onClick={() => setDrawer(true)} aria-label="Menú">
          <Menu />
        </button>
      </header>

      {/* Menú lateral móvil */}
      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col gap-5 bg-night p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              {brand}
              <button className="btn-icon" onClick={() => setDrawer(false)} aria-label="Cerrar">
                <X />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">{items.map((it) => link(it))}</nav>
            {userBox}
          </div>
        </div>
      )}

      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <Outlet />
      </main>

      {/* Navegación inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-ink/85 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 backdrop-blur-xl lg:hidden">
        {items.filter((i) => MOBILE.includes(i.to)).map((it) => link(it, true))}
        <button onClick={() => setDrawer(true)} className="flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold text-mist/80">
          <Menu size={22} />
          Más
        </button>
      </nav>
    </div>
  )
}
