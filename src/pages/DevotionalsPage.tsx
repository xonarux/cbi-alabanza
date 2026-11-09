import { useState, type FormEvent } from 'react'
import { BookHeart, MessageSquareText, Pencil, Plus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useMembers, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Devotional, Member } from '../lib/types'
import { fmt, nextSaturdayISO } from '../lib/utils'
import { DeleteButton, Field, FormActions, MemberSelect, Modal, PageHeader, Spinner } from '../components/ui'
import { PastToggle, ScheduleList } from '../components/Schedule'

export default function DevotionalsPage() {
  const { isAdmin, profile } = useAuth()
  const myMemberId = profile?.member_id ?? null
  const isMine = (dv: Devotional) => !!myMemberId && dv.member_id === myMemberId
  const [mine, setMine] = useState<Devotional | null>(null)
  const { data, loading, reload } = useTable<Devotional>('devotionals', 'date')
  const members = useMembers()
  const [edit, setEdit] = useState<Partial<Devotional> | null>(null)
  const [past, setPast] = useState(false)

  if (loading || members.loading) return <Spinner />
  return (
    <>
      <PageHeader
        title="Devocionales"
        subtitle="Sábados 3:00 pm · máximo 30 minutos"
        icon={<BookHeart />}
        actions={
          <>
            <PastToggle value={past} onChange={setPast} />
            {isAdmin && (
              <button className="btn-primary" onClick={() => setEdit({ date: nextSaturdayISO() })}>
                <Plus size={16} /> Programar
              </button>
            )}
          </>
        }
      />
      <ScheduleList
        items={data}
        showPast={past}
        empty="No hay devocionales programados."
        render={(dv) => (
          <>
            <div className="truncate font-bold text-white">{members.byId.get(dv.member_id ?? '')?.full_name ?? 'Sin asignar'}</div>
            <div className="text-sm text-mist/70">{dv.topic ? <span className="font-semibold text-gold-light">{dv.topic}</span> : 'Tema por definir'}</div>
            {dv.notes && (
              <div className="mt-1 flex gap-1.5 whitespace-pre-line break-words text-xs text-mist/60">
                <MessageSquareText size={13} className="mt-0.5 shrink-0" />
                <span>{dv.notes}</span>
              </div>
            )}
            {isMine(dv) && !isAdmin && (
              <button className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline" onClick={() => setMine(dv)}>
                <Pencil size={12} /> {dv.topic || dv.notes ? 'Editar tema y comentarios' : 'Agregar tema y comentarios'}
              </button>
            )}
          </>
        )}
        actions={
          isAdmin
            ? (dv) => (
                <>
                  <button className="btn-icon" onClick={() => setEdit(dv)} aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                  <DeleteButton onConfirm={() => run(supabase.from('devotionals').delete().eq('id', dv.id), 'Devocional eliminado').then(reload)} />
                </>
              )
            : undefined
        }
      />
      {mine && <MyDevotionalForm draft={mine} onClose={() => setMine(null)} onSaved={reload} />}
      {edit && <DevotionalForm draft={edit} members={members.active} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  )
}

function DevotionalForm({ draft, members, onClose, onSaved }: { draft: Partial<Devotional>; members: Member[]; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(draft.date ?? '')
  const [memberId, setMemberId] = useState(draft.member_id ?? '')
  const [topic, setTopic] = useState(draft.topic ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = { date, member_id: memberId || null, topic: topic || null, notes: notes || null }
    const ok = await run(draft.id ? supabase.from('devotionals').update(row).eq('id', draft.id) : supabase.from('devotionals').insert(row), 'Devocional guardado')
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? 'Editar devocional' : 'Programar devocional'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Fecha">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Encargado">
          <MemberSelect members={members} value={memberId} onChange={setMemberId} required />
        </Field>
        <Field label="Lección o tema">
          <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Opcional" />
        </Field>
        <Field label="Comentarios">
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </Field>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

/** Formulario para el encargado del devocional: solo tema y comentarios */
function MyDevotionalForm({ draft, onClose, onSaved }: { draft: Devotional; onClose: () => void; onSaved: () => void }) {
  const [topic, setTopic] = useState(draft.topic ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const ok = await run(supabase.rpc('update_my_devotional', { p_id: draft.id, p_topic: topic, p_notes: notes }), 'Devocional actualizado')
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title="Mi devocional">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-mist/70">{fmt(draft.date)}</p>
        <Field label="Lección o tema">
          <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: La fe que mueve montañas" autoFocus />
        </Field>
        <Field label="Comentarios">
          <textarea className="input min-h-28" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cita bíblica, qué traer, algo que el equipo deba saber…" />
        </Field>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}
