import { format, isSameDay, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const d = (s: string) => parseISO(s)
export const fmt = (s: string, f = "EEEE d 'de' MMMM") => format(parseISO(s), f, { locale: es })
export const fmtShort = (s: string) => format(parseISO(s), "EEE d MMM", { locale: es })
export const todayISO = () => format(new Date(), 'yyyy-MM-dd')
export const isToday = (s: string) => isSameDay(parseISO(s), new Date())
export const isPast = (s: string) => parseISO(s) < startOfDay(new Date())
export const monthKey = (s: string) => format(parseISO(s), 'yyyy-MM')
export const monthLabel = (key: string) => format(parseISO(key + '-01'), "MMMM yyyy", { locale: es })

export function groupBy<T>(items: T[], key: (t: T) => string): [string, T[]][] {
  const m = new Map<string, T[]>()
  for (const it of items) {
    const k = key(it)
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(it)
  }
  return [...m.entries()]
}

/** Próximo sábado (o hoy si es sábado) */
export function nextSaturdayISO() {
  const now = new Date()
  const diff = (6 - now.getDay() + 7) % 7
  const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
  return format(sat, 'yyyy-MM-dd')
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const initials = (name?: string | null) =>
  (name ?? '?')
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(w) && !/^(pr|pra)\.?$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

export function youtubeId(url?: string | null) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

export const errMsg = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Error inesperado')
