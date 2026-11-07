import { useState, type FormEvent } from 'react'
import { BookOpen, ChevronDown, Compass, Eye, Gem, Pencil, Plus, ScrollText } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { InfoSection } from '../lib/types'
import { cx } from '../lib/utils'
import { DeleteButton, Field, FormActions, Modal, PageHeader, Spinner } from '../components/ui'

type Draft = Partial<InfoSection> & { kind: InfoSection['kind'] }

export default function InfoPage() {
  const { isAdmin } = useAuth()
  const { data, loading, reload } = useTable<InfoSection>('info_sections', 'position')
  const [edit, setEdit] = useState<Draft | null>(null)
  const [openRule, setOpenRule] = useState<string | null>(null)

  const by = (k: InfoSection['kind']) => data.filter((s) => s.kind === k)
  const editBtn = (s: InfoSection) =>
    isAdmin && (
      <button className="btn-icon" onClick={() => setEdit(s)} title="Editar" aria-label="Editar">
        <Pencil size={16} />
      </button>
    )

  if (loading) return <Spinner />

  const hero = (s: InfoSection | undefined, icon: React.ReactNode) =>
    s && (
      <div className="glass relative overflow-hidden p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gold">
            {icon}
            <h2 className="text-lg font-extrabold uppercase tracking-widest">{s.title}</h2>
          </div>
          {editBtn(s)}
        </div>
        <p className="leading-relaxed text-mist">{s.body}</p>
      </div>
    )

  const valores = by('valores')[0]
  return (
    <>
      <PageHeader title="Información general" subtitle="Quiénes somos y cómo servimos" icon={<BookOpen />} />

      <div className="grid gap-5 lg:grid-cols-2">
        {hero(by('mision')[0], <Compass size={20} />)}
        {hero(by('vision')[0], <Eye size={20} />)}
      </div>

      {valores && (
        <section className="glass mt-5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gold">
              <Gem size={20} />
              <h2 className="text-lg font-extrabold uppercase tracking-widest">{valores.title}</h2>
            </div>
            {editBtn(valores)}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {valores.body
              .split('\n')
              .filter(Boolean)
              .map((v) => (
                <div key={v} className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent px-4 py-3 text-center font-semibold text-gold-light">
                  {v}
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gold">
            <ScrollText size={20} />
            <h2 className="text-lg font-extrabold uppercase tracking-widest">Reglas</h2>
          </div>
          {isAdmin && (
            <button className="btn-ghost" onClick={() => setEdit({ kind: 'reglas', title: '', body: '', position: data.length })}>
              <Plus size={16} /> Agregar regla
            </button>
          )}
        </div>
        <div className="space-y-2">
          {by('reglas').map((r) => (
            <div key={r.id} className="glass overflow-hidden">
              <div className="flex items-center">
                <button className="flex flex-1 items-center justify-between gap-3 px-5 py-4 text-left" onClick={() => setOpenRule(openRule === r.id ? null : r.id)}>
                  <span className="font-bold tracking-wide text-white">{r.title}</span>
                  <ChevronDown size={18} className={cx('shrink-0 text-mist transition', openRule === r.id && 'rotate-180')} />
                </button>
                {isAdmin && (
                  <div className="flex pr-3">
                    {editBtn(r)}
                    <DeleteButton onConfirm={() => run(supabase.from('info_sections').delete().eq('id', r.id), 'Regla eliminada').then(reload)} />
                  </div>
                )}
              </div>
              {openRule === r.id && <p className="whitespace-pre-line border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-mist">{r.body}</p>}
            </div>
          ))}
        </div>
      </section>

      {edit && <EditModal draft={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  )
}

function EditModal({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(draft.title ?? '')
  const [body, setBody] = useState(draft.body ?? '')
  const [saving, setSaving] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = { kind: draft.kind, title, body, position: draft.position ?? 0, updated_at: new Date().toISOString() }
    const ok = await run(draft.id ? supabase.from('info_sections').update(row).eq('id', draft.id) : supabase.from('info_sections').insert(row), 'Guardado')
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? `Editar: ${draft.title}` : 'Nueva regla'} wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Título">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label={draft.kind === 'valores' ? 'Valores (uno por línea)' : 'Contenido'}>
          <textarea className="input min-h-48" value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}
