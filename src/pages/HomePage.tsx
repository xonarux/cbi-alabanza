import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookHeart, Cake, CalendarHeart, Flame, Moon, Music } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useMembers } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Devotional, Fast, Rest, Setlist } from '../lib/types'
import { cx, fmt, isToday, MONTHS, todayISO } from '../lib/utils'
import { verseOfDay } from '../lib/verses'
import { Logo } from '../components/ui'

interface HomeData {
  devotional?: Devotional
  rests: Rest[]
  fast?: Fast
  setlist?: Setlist & { count: number }
}

export default function HomePage() {
  const { profile } = useAuth()
  const members = useMembers()
  const [h, setH] = useState<HomeData | null>(null)

  useEffect(() => {
    const today = todayISO()
    Promise.all([
      supabase.from('devotionals').select('*').gte('date', today).order('date').limit(1),
      supabase.from('rests').select('*').gte('date', today).order('date').limit(20),
      supabase.from('fasts').select('*').gte('date', today).order('date').limit(1),
      supabase.from('setlists').select('*, setlist_songs(count)').gte('date', today).order('date').limit(1),
    ]).then(([dv, rs, fs, sl]) => {
      const rests = (rs.data as Rest[]) ?? []
      const firstDate = rests[0]?.date
      const s = sl.data?.[0] as (Setlist & { setlist_songs: { count: number }[] }) | undefined
      setH({
        devotional: dv.data?.[0] as Devotional | undefined,
        rests: rests.filter((r) => r.date === firstDate),
        fast: fs.data?.[0] as Fast | undefined,
        setlist: s ? { ...s, count: s.setlist_songs?.[0]?.count ?? 0 } : undefined,
      })
    })
  }, [])

  const name = (id?: string | null) => members.byId.get(id ?? '')?.full_name ?? 'Sin asignar'
  const month = new Date().getMonth() + 1
  const bdays = members.active.filter((m) => m.birth_month === month).sort((a, b) => (a.birth_day ?? 0) - (b.birth_day ?? 0))
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const mine = (id?: string | null) => !!id && id === profile?.member_id
  const verse = verseOfDay()

  return (
    <>
      <section className="glass relative mb-6 overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet/60 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <Logo className="absolute right-6 top-6 hidden h-24 w-24 opacity-20 sm:block" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-mist/70">{greet}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {profile?.full_name?.split(' ')[0]}, <span className="text-gradient">aquí hay un lugar para ti</span>
          </h1>
          <p className="mt-2 max-w-xl text-mist/80">
            “{verse.text}” <span className="whitespace-nowrap">— {verse.ref} <span className="text-xs text-mist/50">NTV</span></span>
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile to="/canciones?tab=finde" icon={<CalendarHeart />} label="Este fin de semana" loading={!h}>
          {h?.setlist ? (
            <>
              <Big>{h.setlist.count} canciones</Big>
              <Small>{fmt(h.setlist.date)}</Small>
            </>
          ) : (
            <Small>Repertorio aún no publicado</Small>
          )}
        </Tile>
        <Tile to="/devocionales" icon={<BookHeart />} label="Próximo devocional" loading={!h} highlight={mine(h?.devotional?.member_id)}>
          {h?.devotional ? (
            <>
              <Big>{mine(h.devotional.member_id) ? '¡Te toca a ti!' : name(h.devotional.member_id)}</Big>
              <Small>
                {isToday(h.devotional.date) ? 'Hoy' : fmt(h.devotional.date)} · 3:00 pm
              </Small>
            </>
          ) : (
            <Small>Sin programar</Small>
          )}
        </Tile>
        <Tile to="/descansos" icon={<Moon />} label="Próximo descanso" loading={!h} highlight={h?.rests.some((r) => mine(r.member_id))}>
          {h?.rests.length ? (
            <>
              <Big>{h.rests.map((r) => (mine(r.member_id) ? 'Tú' : name(r.member_id).split(' ')[0])).join(', ')}</Big>
              <Small>{fmt(h.rests[0].date)}</Small>
            </>
          ) : (
            <Small>Sin programar</Small>
          )}
        </Tile>
        <Tile to="/ayunos" icon={<Flame />} label="Ayuno / vigilia" loading={!h}>
          {h?.fast ? (
            <>
              <Big className="capitalize">{h.fast.type}</Big>
              <Small>
                {fmt(h.fast.date)}
                {h.fast.time && ` · ${h.fast.time}`}
              </Small>
            </>
          ) : (
            <Small>Ninguno programado</Small>
          )}
        </Tile>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link to="/cumpleanos" className="glass group p-5 transition hover:border-gold/30 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white">
              <Cake className="text-gold" size={20} /> Cumpleaños de {MONTHS[month - 1].toLowerCase()}
            </div>
            <ArrowRight size={18} className="text-mist transition group-hover:translate-x-1 group-hover:text-gold" />
          </div>
          {bdays.length ? (
            <div className="flex flex-wrap gap-2">
              {bdays.map((m) => {
                const today = m.birth_day === new Date().getDate()
                return (
                  <span key={m.id} className={cx('rounded-full border px-3 py-1.5 text-sm', today ? 'border-gold bg-gold/20 font-bold text-gold' : 'border-white/10 bg-white/5 text-white')}>
                    {today && '🎉 '}
                    <b className="text-gold">{m.birth_day}</b> · {m.full_name}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-mist/60">No hay cumpleaños este mes.</p>
          )}
        </Link>
        <Link to="/canciones" className="glass group flex flex-col justify-between bg-gradient-to-br from-gold/15 to-transparent p-5 transition hover:border-gold/30">
          <Music className="text-gold" size={28} />
          <div>
            <div className="mt-6 text-lg font-extrabold text-white">Cancionero</div>
            <div className="flex items-center gap-1 text-sm text-mist">
              Alabanzas y adoraciones <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>
    </>
  )
}

function Tile({ to, icon, label, children, loading, highlight }: { to: string; icon: ReactNode; label: string; children: ReactNode; loading?: boolean; highlight?: boolean }) {
  return (
    <Link to={to} className={cx('glass group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-gold/30', highlight && 'ring-1 ring-gold/60')}>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">{icon}</div>
        <ArrowRight size={16} className="text-mist/40 transition group-hover:translate-x-1 group-hover:text-gold" />
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-mist/60">{label}</div>
      {loading ? <div className="h-10 animate-pulse rounded-lg bg-white/5" /> : <div>{children}</div>}
    </Link>
  )
}
const Big = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cx('truncate text-lg font-extrabold text-white', className)}>{children}</div>
const Small = ({ children }: { children: ReactNode }) => <div className="truncate text-sm text-mist/70">{children}</div>
