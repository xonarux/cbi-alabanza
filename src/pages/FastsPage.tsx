import { useState, type FormEvent } from 'react'
import { Clock, Flame, Hourglass, Pencil, Plus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Fast, FastType } from '../lib/types'
import { cx, todayISO } from '../lib/utils'
import { DeleteButton, Field, FormActions, Modal, PageHeader, Spinner } from '../components/ui'
import { PastToggle, ScheduleList } from '../components/Schedule'

const TYPES: FastType[] = ['ayuno', 'vigilia', 'ayuno y vigilia']
const typeStyle: Record<FastType, string> = {
  ayuno: 'bg-amber-400/15 text-amber-200 border-amber-300/30',
  vigilia: 'bg-indigo-400/15 text-indigo-200 border-indigo-300/30',
  'ayuno y vigilia': 'bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-300/30',
}

export default function FastsPage() {
  const { isAdmin } = useAuth()
  const { data, loading, reload } = useTable<Fast>('fasts', 'date')
  const [edit, setEdit] = useState<Partial<Fast> | null>(null)
  const [past, setPast] = useState(false)

  if (loading) return <Spinner />
  return (
    <>
      <PageHeader
        title="Ayunos y vigilias"
        subtitle="Tiempos de consagración del ministerio"
        icon={<Flame />}
        actions={
          <>
            <PastToggle value={past} onChange={setPast} />
            {isAdmin && (
              <button className="btn-primary" onClick={() => setEdit({ date: todayISO(), type: 'ayuno' })}>
                <Plus size={16} /> Programar
              </button>
            )}
          </>
        }
      />
      {isAdmin && <p className="mb-4 text-xs text-mist/60">Al programar un nuevo evento, todos los miembros recibirán un aviso en la app.</p>}
      <ScheduleList
        items={data}
        showPast={past}
        empty="No hay ayunos ni vigilias programados."
        render={(f) => (
          <>
            <span className={cx('inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize', typeStyle[f.type])}>{f.type}</span>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist">
              {f.time && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {f.time}
                </span>
              )}
              {f.duration && (
                <span className="flex items-center gap-1">
                  <Hourglass size={14} /> {f.duration}
                </span>
              )}
            </div>
            {f.notes && <div className="mt-1 text-xs text-mist/60">{f.notes}</div>}
          </>
        )}
        actions={
          isAdmin
            ? (f) => (
                <>
                  <button className="btn-icon" onClick={() => setEdit(f)} aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                  <DeleteButton onConfirm={() => run(supabase.from('fasts').delete().eq('id', f.id), 'Evento eliminado').then(reload)} />
                </>
              )
            : undefined
        }
      />
      {edit && <FastForm draft={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  )
}

function FastForm({ draft, onClose, onSaved }: { draft: Partial<Fast>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ date: draft.date ?? '', type: draft.type ?? 'ayuno', time: draft.time ?? '', duration: draft.duration ?? '', notes: draft.notes ?? '' })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = { ...f, time: f.time || null, duration: f.duration || null, notes: f.notes || null }
    const ok = await run(
      draft.id ? supabase.from('fasts').update(row).eq('id', draft.id) : supabase.from('fasts').insert(row),
      draft.id ? 'Evento actualizado' : 'Evento programado y notificado',
    )
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? 'Editar evento' : 'Programar ayuno o vigilia'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Tipo">
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setF({ ...f, type: t })}
                className={cx('rounded-xl border px-2 py-2 text-xs font-bold capitalize transition', f.type === t ? typeStyle[t] : 'border-white/10 text-mist hover:bg-white/5')}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Fecha (tentativa)">
          <input type="date" className="input" value={f.date} onChange={set('date')} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora">
            <input className="input" value={f.time} onChange={set('time')} placeholder="Ej: 6:00 pm" />
          </Field>
          <Field label="Tiempo / duración">
            <input className="input" value={f.duration} onChange={set('duration')} placeholder="Ej: 6 am – 12 m" />
          </Field>
        </div>
        <Field label="Notas">
          <textarea className="input" value={f.notes} onChange={set('notes')} placeholder="Motivo, lugar, indicaciones…" />
        </Field>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}
