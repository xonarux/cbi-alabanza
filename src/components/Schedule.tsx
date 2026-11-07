import type { ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { cx, d, groupBy, isPast, isToday, monthKey, monthLabel } from '../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Empty } from './ui'

/** Lista agrupada por mes de elementos con fecha. Resalta el próximo. */
export function ScheduleList<T extends { id: string; date: string }>({
  items,
  render,
  actions,
  showPast,
  empty = 'No hay fechas programadas.',
}: {
  items: T[]
  render: (it: T) => ReactNode
  actions?: (it: T) => ReactNode
  showPast: boolean
  empty?: string
}) {
  const visible = items.filter((i) => showPast || !isPast(i.date))
  const nextId = items.find((i) => !isPast(i.date))?.id
  if (!visible.length) return <Empty icon={<CalendarDays size={36} />}>{empty}</Empty>

  return (
    <div className="space-y-6">
      {groupBy(visible, (i) => monthKey(i.date)).map(([mk, list]) => (
        <section key={mk}>
          <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.2em] text-mist/60">{monthLabel(mk)}</h3>
          <div className="space-y-2">
            {list.map((it) => {
              const next = it.id === nextId
              const past = isPast(it.date)
              return (
                <div
                  key={it.id}
                  className={cx(
                    'glass flex items-center gap-4 p-3 pr-2 transition',
                    next && 'ring-1 ring-gold/50 bg-gold/[0.06]',
                    past && 'opacity-50',
                  )}
                >
                  <div className={cx('flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl', next ? 'bg-gold text-ink' : 'bg-white/5 text-white')}>
                    <span className="text-[10px] font-bold uppercase">{format(d(it.date), 'EEE', { locale: es })}</span>
                    <span className="text-xl font-extrabold leading-none">{format(d(it.date), 'd')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {render(it)}
                    {next && <span className="mt-1 inline-block text-[11px] font-bold uppercase tracking-wider text-gold">{isToday(it.date) ? '● Hoy' : '● Próximo'}</span>}
                  </div>
                  {actions && <div className="flex shrink-0">{actions(it)}</div>}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function PastToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-mist">
      <input type="checkbox" className="accent-[#e3bf8d]" checked={value} onChange={(e) => onChange(e.target.checked)} />
      Mostrar fechas pasadas
    </label>
  )
}
