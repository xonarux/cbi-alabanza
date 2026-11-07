import { useState, type FormEvent } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, ExternalLink, Lightbulb, ListPlus, Plus, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Proposal } from '../lib/types'
import { cx, youtubeId } from '../lib/utils'
import { DeleteButton, Empty, Field, FormActions, Modal, PageHeader, Spinner, Tabs } from '../components/ui'
import { SongForm } from './SongsPage'

type Filter = 'pendiente' | 'aprobada' | 'descartada'
const badge: Record<Filter, string> = {
  pendiente: 'bg-amber-400/15 text-amber-200 border-amber-300/30',
  aprobada: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/30',
  descartada: 'bg-red-400/10 text-red-300 border-red-300/20',
}

export default function ProposalsPage() {
  const { isAdmin, profile } = useAuth()
  const { data, loading, reload } = useTable<Proposal>('proposals', 'created_at', false)
  const [filter, setFilter] = useState<Filter>('pendiente')
  const [adding, setAdding] = useState(false)
  const [toSong, setToSong] = useState<Proposal | null>(null)

  const setStatus = (p: Proposal, status: Filter) => run(supabase.from('proposals').update({ status }).eq('id', p.id), status === 'aprobada' ? 'Propuesta aprobada' : 'Propuesta descartada').then(reload)

  if (loading) return <Spinner />
  const list = data.filter((p) => p.status === filter)
  return (
    <>
      <PageHeader
        title="Propuestas a montar"
        subtitle="Sugiere canciones nuevas al líder de alabanza"
        icon={<Lightbulb />}
        actions={
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Proponer canción
          </button>
        }
      />
      <Tabs<Filter>
        value={filter}
        onChange={setFilter}
        tabs={(['pendiente', 'aprobada', 'descartada'] as Filter[]).map((f) => ({
          id: f,
          label: f === 'pendiente' ? 'Pendientes' : f === 'aprobada' ? 'Aprobadas' : 'Descartadas',
          count: data.filter((p) => p.status === f).length,
        }))}
      />
      {list.length === 0 ? (
        <Empty icon={<Lightbulb size={36} />}>No hay propuestas aquí.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const yt = youtubeId(p.link)
            return (
              <div key={p.id} className="glass flex gap-3 p-3">
                {yt && (
                  <a href={p.link!} target="_blank" rel="noopener" className="shrink-0">
                    <img src={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`} alt="" className="h-20 w-32 rounded-lg object-cover" loading="lazy" />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{p.title}</div>
                      <div className="truncate text-sm text-mist/70">{p.artist || '—'}</div>
                    </div>
                    <span className={cx('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', badge[p.status])}>{p.status}</span>
                  </div>
                  {p.notes && <p className="mt-1 text-xs text-mist/70">{p.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="mr-auto text-[11px] text-mist/50">
                      {p.proposer_name ?? 'Anónimo'} · {formatDistanceToNow(parseISO(p.created_at), { locale: es, addSuffix: true })}
                    </span>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener" className="btn-icon" title="Abrir enlace">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    {isAdmin && p.status !== 'aprobada' && (
                      <button className="btn-icon hover:!text-emerald-300" onClick={() => setStatus(p, 'aprobada')} title="Aprobar">
                        <Check size={16} />
                      </button>
                    )}
                    {isAdmin && p.status !== 'descartada' && (
                      <button className="btn-icon hover:!text-red-300" onClick={() => setStatus(p, 'descartada')} title="Descartar">
                        <X size={16} />
                      </button>
                    )}
                    {isAdmin && (
                      <button className="btn-icon text-gold" onClick={() => setToSong(p)} title="Agregar al cancionero">
                        <ListPlus size={16} />
                      </button>
                    )}
                    {(isAdmin || (p.proposed_by === profile?.id && p.status === 'pendiente')) && (
                      <DeleteButton onConfirm={() => run(supabase.from('proposals').delete().eq('id', p.id), 'Propuesta eliminada').then(reload)} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {adding && <ProposalForm onClose={() => setAdding(false)} onSaved={reload} />}
      {toSong && (
        <SongForm
          draft={{ title: toSong.title, artist: toSong.artist, youtube_url: toSong.link, category: 'alabanza' }}
          onClose={() => setToSong(null)}
          onSaved={() => {
            if (toSong.status !== 'aprobada') setStatus(toSong, 'aprobada')
          }}
        />
      )}
    </>
  )
}

function ProposalForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth()
  const [f, setF] = useState({ title: '', artist: '', link: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const ok = await run(
      supabase.from('proposals').insert({ title: f.title.trim(), artist: f.artist.trim() || null, link: f.link.trim() || null, notes: f.notes.trim() || null, proposed_by: profile!.id }),
      '¡Gracias! Tu propuesta fue enviada',
    )
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title="Proponer canción">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Canción">
          <input className="input" value={f.title} onChange={set('title')} required />
        </Field>
        <Field label="Intérprete">
          <input className="input" value={f.artist} onChange={set('artist')} required />
        </Field>
        <Field label="Enlace (YouTube, Spotify…)">
          <input className="input" type="url" value={f.link} onChange={set('link')} placeholder="https://…" required />
        </Field>
        <Field label="¿Por qué la propones?">
          <textarea className="input" value={f.notes} onChange={set('notes')} placeholder="Opcional" />
        </Field>
        <FormActions onCancel={onClose} saving={saving} label="Enviar" />
      </form>
    </Modal>
  )
}
