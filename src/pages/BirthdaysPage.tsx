import { useEffect, useState, type FormEvent } from 'react'
import { Cake, Check, Gift, Pencil, Plus, Shield, ShieldOff, UserCheck, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useMembers } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Member, Profile } from '../lib/types'
import { cx, MONTHS } from '../lib/utils'
import { Avatar, DeleteButton, Empty, Field, FormActions, MemberSelect, Modal, PageHeader, Spinner, Tabs } from '../components/ui'

type Tab = 'cumple' | 'registro' | 'cuentas'

function daysUntil(m: Member) {
  if (!m.birth_day || !m.birth_month) return Infinity
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), m.birth_month - 1, m.birth_day)
  if (next < today) next = new Date(now.getFullYear() + 1, m.birth_month - 1, m.birth_day)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

export default function BirthdaysPage() {
  const { isAdmin } = useAuth()
  const members = useMembers()
  const [tab, setTab] = useState<Tab>('cumple')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const loadProfiles = () => supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles((data as Profile[]) ?? []))
  useEffect(() => {
    if (isAdmin) loadProfiles()
  }, [isAdmin])

  if (members.loading) return <Spinner />
  const pending = profiles.filter((p) => p.status === 'pending').length

  return (
    <>
      <PageHeader title={tab === 'cumple' ? 'Cumpleaños' : 'Miembros'} subtitle="Celebramos la vida de cada miembro del ministerio" icon={<Cake />} />
      {isAdmin && (
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'cumple', label: 'Cumpleaños', icon: <Cake size={16} /> },
            { id: 'registro', label: 'Registro', icon: <Users size={16} />, count: members.data.length },
            { id: 'cuentas', label: 'Cuentas', icon: <UserCheck size={16} />, count: pending || undefined },
          ]}
        />
      )}
      {tab === 'cumple' && <BirthdayView members={members.active} />}
      {tab === 'registro' && isAdmin && <Registry members={members.data} reload={members.reload} />}
      {tab === 'cuentas' && isAdmin && <Accounts profiles={profiles} members={members.data} reload={loadProfiles} reloadMembers={members.reload} />}
    </>
  )
}

function BirthdayView({ members }: { members: Member[] }) {
  const upcoming = [...members].filter((m) => m.birth_month).sort((a, b) => daysUntil(a) - daysUntil(b)).slice(0, 3)
  const thisMonth = new Date().getMonth() + 1
  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {upcoming.map((m) => {
          const n = daysUntil(m)
          return (
            <div key={m.id} className={cx('glass relative overflow-hidden p-4', n === 0 && 'ring-2 ring-gold')}>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/10 blur-2xl" />
              <div className="flex items-center gap-3">
                <Avatar name={m.full_name} />
                <div className="min-w-0">
                  <div className="truncate font-bold text-white">{m.full_name}</div>
                  <div className="text-sm text-mist/70">
                    {m.birth_day} de {MONTHS[m.birth_month! - 1].toLowerCase()}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-gold">
                <Gift size={16} /> {n === 0 ? '¡Hoy es su cumpleaños! 🎉' : n === 1 ? 'Mañana' : `En ${n} días`}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((name, i) => {
          const list = members.filter((m) => m.birth_month === i + 1).sort((a, b) => (a.birth_day ?? 0) - (b.birth_day ?? 0))
          return (
            <div key={name} className={cx('glass p-4', i + 1 === thisMonth && 'ring-1 ring-gold/40')}>
              <h3 className={cx('mb-3 text-sm font-extrabold uppercase tracking-widest', i + 1 === thisMonth ? 'text-gold' : 'text-mist/70')}>{name}</h3>
              {list.length === 0 ? (
                <p className="text-xs text-mist/40">—</p>
              ) : (
                <ul className="space-y-2">
                  {list.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-gold">{m.birth_day}</span>
                      <span className="truncate text-sm text-white">{m.full_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Registry({ members, reload }: { members: Member[]; reload: () => void }) {
  const [edit, setEdit] = useState<Partial<Member> | null>(null)
  return (
    <>
      <div className="mb-3 flex justify-end">
        <button className="btn-primary" onClick={() => setEdit({ active: true })}>
          <Plus size={16} /> Nuevo miembro
        </button>
      </div>
      <div className="glass divide-y divide-white/5">
        {members.map((m) => (
          <div key={m.id} className={cx('flex items-center gap-3 p-3', !m.active && 'opacity-50')}>
            <Avatar name={m.full_name} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">
                {m.full_name} {!m.active && <span className="chip ml-1">Inactivo</span>}
              </div>
              <div className="truncate text-xs text-mist/60">
                {m.birth_day && m.birth_month ? `🎂 ${m.birth_day} de ${MONTHS[m.birth_month - 1]}` : 'Sin cumpleaños'}
                {m.role_in_ministry && ` · ${m.role_in_ministry}`}
                {m.phone && ` · ${m.phone}`}
              </div>
            </div>
            <button className="btn-icon" onClick={() => setEdit(m)} aria-label="Editar">
              <Pencil size={16} />
            </button>
            <DeleteButton
              label={`¿Eliminar a ${m.full_name}? Se borrarán también sus descansos asignados. Considera marcarlo como inactivo.`}
              onConfirm={() => run(supabase.from('members').delete().eq('id', m.id), 'Miembro eliminado').then(reload)}
            />
          </div>
        ))}
      </div>
      {edit && <MemberForm draft={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  )
}

function MemberForm({ draft, onClose, onSaved }: { draft: Partial<Member>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    full_name: draft.full_name ?? '',
    birth_day: draft.birth_day?.toString() ?? '',
    birth_month: draft.birth_month?.toString() ?? '',
    phone: draft.phone ?? '',
    role_in_ministry: draft.role_in_ministry ?? '',
    active: draft.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = {
      full_name: f.full_name.trim(),
      birth_day: f.birth_day ? Number(f.birth_day) : null,
      birth_month: f.birth_month ? Number(f.birth_month) : null,
      phone: f.phone || null,
      role_in_ministry: f.role_in_ministry || null,
      active: f.active,
    }
    const ok = await run(draft.id ? supabase.from('members').update(row).eq('id', draft.id) : supabase.from('members').insert(row), 'Miembro guardado')
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? 'Editar miembro' : 'Nuevo miembro'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo">
          <input className="input" value={f.full_name} onChange={set('full_name')} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Día de cumpleaños">
            <input className="input" type="number" min={1} max={31} value={f.birth_day} onChange={set('birth_day')} />
          </Field>
          <Field label="Mes">
            <select className="input" value={f.birth_month} onChange={set('birth_month')}>
              <option value="">—</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <input className="input" value={f.phone} onChange={set('phone')} />
          </Field>
          <Field label="Servicio">
            <input className="input" value={f.role_in_ministry} onChange={set('role_in_ministry')} placeholder="Voz, guitarra…" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" className="accent-[#e3bf8d]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Miembro activo
        </label>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

function Accounts({ profiles, members, reload, reloadMembers }: { profiles: Profile[]; members: Member[]; reload: () => void; reloadMembers: () => void }) {
  const { profile: me } = useAuth()
  const [approving, setApproving] = useState<Profile | null>(null)
  const linked = new Map(members.map((m) => [m.id, m]))
  if (!profiles.length) return <Empty icon={<UserCheck size={36} />}>No hay cuentas registradas.</Empty>
  const sorted = [...profiles].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0))
  return (
    <>
      <div className="glass divide-y divide-white/5">
        {sorted.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
            <Avatar name={p.full_name} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-white">
                {p.full_name}
                {p.role === 'admin' && (
                  <span className="chip border-gold/30 text-gold">
                    <Shield size={11} /> Admin
                  </span>
                )}
                {p.status === 'pending' && <span className="chip border-amber-300/30 text-amber-200">Pendiente</span>}
                {p.status === 'rejected' && <span className="chip border-red-300/30 text-red-300">Rechazado</span>}
              </div>
              <div className="truncate text-xs text-mist/60">
                {p.email} · {p.member_id ? `Vinculado a ${linked.get(p.member_id)?.full_name ?? '—'}` : 'Sin vincular'}
              </div>
            </div>
            <div className="flex gap-1">
              {p.status !== 'approved' && (
                <button className="btn-ghost px-3 py-1.5" onClick={() => setApproving(p)}>
                  <Check size={14} /> Aprobar
                </button>
              )}
              {p.status === 'approved' && (
                <button className="btn-icon" onClick={() => setApproving(p)} title="Vincular miembro">
                  <Pencil size={16} />
                </button>
              )}
              {p.id !== me?.id && p.status === 'approved' && (
                <button
                  className="btn-icon"
                  title={p.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  onClick={() => run(supabase.from('profiles').update({ role: p.role === 'admin' ? 'member' : 'admin' }).eq('id', p.id), 'Rol actualizado').then(reload)}
                >
                  {p.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                </button>
              )}
              {p.id !== me?.id && p.status !== 'rejected' && (
                <button className="btn-icon hover:!text-red-300" title={p.status === 'pending' ? 'Rechazar' : 'Revocar acceso'} onClick={() => run(supabase.from('profiles').update({ status: 'rejected' }).eq('id', p.id), 'Acceso revocado').then(reload)}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {approving && (
        <ApproveModal
          p={approving}
          members={members}
          onClose={() => setApproving(null)}
          onDone={() => {
            reload()
            reloadMembers()
          }}
        />
      )}
    </>
  )
}

function ApproveModal({ p, members, onClose, onDone }: { p: Profile; members: Member[]; onClose: () => void; onDone: () => void }) {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const guess = members.find((m) => norm(m.full_name) === norm(p.full_name ?? '')) ?? members.find((m) => norm(m.full_name).split(' ')[0] === norm(p.full_name ?? '').split(' ')[0])
  const [mode, setMode] = useState<'link' | 'new'>(p.member_id || guess ? 'link' : 'new')
  const [memberId, setMemberId] = useState(p.member_id ?? guess?.id ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    let id = memberId
    if (mode === 'new') {
      const { data, error } = await supabase
        .from('members')
        .insert({ full_name: p.full_name, birth_day: p.birth_day, birth_month: p.birth_month })
        .select()
        .single()
      if (error) {
        setSaving(false)
        return run(Promise.resolve({ error }))
      }
      id = (data as Member).id
    }
    const ok = await run(supabase.from('profiles').update({ status: 'approved', member_id: id || null }).eq('id', p.id), `${p.full_name} aprobado`)
    setSaving(false)
    if (ok) {
      onDone()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={`Aprobar a ${p.full_name}`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-mist">
          {p.email}
          {p.birth_day && p.birth_month && ` · 🎂 ${p.birth_day} de ${MONTHS[p.birth_month - 1]}`}
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
          <button type="button" onClick={() => setMode('link')} className={cx('rounded-lg py-2 text-sm font-semibold', mode === 'link' ? 'bg-gold text-ink' : 'text-mist')}>
            Vincular existente
          </button>
          <button type="button" onClick={() => setMode('new')} className={cx('rounded-lg py-2 text-sm font-semibold', mode === 'new' ? 'bg-gold text-ink' : 'text-mist')}>
            Crear en registro
          </button>
        </div>
        {mode === 'link' ? (
          <Field label="Miembro del registro">
            <MemberSelect members={members} value={memberId} onChange={setMemberId} required />
          </Field>
        ) : (
          <p className="text-sm text-mist/70">Se creará un nuevo miembro con su nombre y cumpleaños.</p>
        )}
        <FormActions onCancel={onClose} saving={saving} label="Aprobar" />
      </form>
    </Modal>
  )
}
