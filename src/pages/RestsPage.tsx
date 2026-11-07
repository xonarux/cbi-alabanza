import { useState, type FormEvent } from 'react'
import { Moon, Pencil, Plus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useMembers, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Member, Rest } from '../lib/types'
import { nextSaturdayISO } from '../lib/utils'
import { Avatar, DeleteButton, Field, FormActions, MemberSelect, Modal, PageHeader, Spinner } from '../components/ui'
import { PastToggle, ScheduleList } from '../components/Schedule'

export default function RestsPage() {
  const { isAdmin, profile } = useAuth()
  const { data, loading, reload } = useTable<Rest>('rests', 'date')
  const members = useMembers()
  const [edit, setEdit] = useState<Partial<Rest> | null>(null)
  const [past, setPast] = useState(false)
  const [mine, setMine] = useState(false)

  if (loading || members.loading) return <Spinner />
  const items = mine && profile?.member_id ? data.filter((r) => r.member_id === profile.member_id) : data

  return (
    <>
      <PageHeader
        title="Descansos"
        subtitle="Fines de semana en los que no se ministra"
        icon={<Moon />}
        actions={
          <>
            {profile?.member_id && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-mist">
                <input type="checkbox" className="accent-[#e3bf8d]" checked={mine} onChange={(e) => setMine(e.target.checked)} />
                Solo los míos
              </label>
            )}
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
        items={items}
        showPast={past}
        empty="No hay descansos programados."
        render={(r) => {
          const m = members.byId.get(r.member_id ?? '')
          return (
            <div className="flex items-center gap-3">
              <Avatar name={m?.full_name} className="h-8 w-8 text-xs" />
              <div className="min-w-0">
                <div className="truncate font-bold text-white">
                  {m?.full_name ?? 'Sin asignar'}
                  {m && m.id === profile?.member_id && <span className="ml-2 text-xs text-gold">(tú)</span>}
                </div>
                {r.notes && <div className="truncate text-xs text-mist/60">{r.notes}</div>}
              </div>
            </div>
          )
        }}
        actions={
          isAdmin
            ? (r) => (
                <>
                  <button className="btn-icon" onClick={() => setEdit(r)} aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                  <DeleteButton onConfirm={() => run(supabase.from('rests').delete().eq('id', r.id), 'Descanso eliminado').then(reload)} />
                </>
              )
            : undefined
        }
      />
      {edit && <RestForm draft={edit} members={members.active} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  )
}

function RestForm({ draft, members, onClose, onSaved }: { draft: Partial<Rest>; members: Member[]; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(draft.date ?? '')
  const [memberId, setMemberId] = useState(draft.member_id ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [saving, setSaving] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = { date, member_id: memberId, notes: notes || null }
    const ok = await run(draft.id ? supabase.from('rests').update(row).eq('id', draft.id) : supabase.from('rests').insert(row), 'Descanso guardado')
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? 'Editar descanso' : 'Programar descanso'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Fecha">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Miembro">
          <MemberSelect members={members} value={memberId} onChange={setMemberId} required />
        </Field>
        <Field label="Notas">
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </Field>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}
