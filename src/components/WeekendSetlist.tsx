import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, CalendarHeart, Copy, History, ListPlus, Pencil, Plus, Search, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Setlist, SetlistSong, Song } from '../lib/types'
import { cx, fmt, isPast, nextSaturdayISO } from '../lib/utils'
import { buildWhatsApp, DEFAULT_LINE, DEFAULT_TEMPLATE } from '../lib/whatsapp'
import { DeleteButton, Empty, Field, FormActions, Modal, Spinner } from './ui'
import { SongInfo, SongThumb } from './SongCard'

type Item = SetlistSong & { song: Song }

/** Escoge el repertorio vigente: el próximo (fecha >= hoy) o el más reciente */
const pickCurrent = (lists: Setlist[]) => lists.filter((s) => !isPast(s.date)).sort((a, b) => a.date.localeCompare(b.date))[0] ?? lists[0]

export default function WeekendSetlist({ songs }: { songs: Song[] }) {
  const { isAdmin } = useAuth()
  const [lists, setLists] = useState<Setlist[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [items, setItems] = useState<SetlistSong[]>([])
  const [loading, setLoading] = useState(true)
  const [editList, setEditList] = useState<Partial<Setlist> | null>(null)
  const [picker, setPicker] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs])
  const current = lists.find((l) => l.id === currentId) ?? null
  const full: Item[] = items
    .map((i) => ({ ...i, song: songById.get(i.song_id)! }))
    .filter((i) => i.song)
    .sort((a, b) => a.position - b.position)

  const loadLists = useCallback(async (selectId?: string) => {
    const { data } = await supabase.from('setlists').select('*').order('date', { ascending: false })
    const l = (data as Setlist[]) ?? []
    setLists(l)
    setCurrentId((prev) => selectId ?? (prev && l.some((x) => x.id === prev) ? prev : pickCurrent(l)?.id ?? null))
    setLoading(false)
  }, [])

  const loadItems = useCallback(async () => {
    if (!currentId) return setItems([])
    const { data } = await supabase.from('setlist_songs').select('*').eq('setlist_id', currentId).order('position')
    setItems((data as SetlistSong[]) ?? [])
  }, [currentId])

  useEffect(() => {
    loadLists()
  }, [loadLists])
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const move = async (idx: number, dir: -1 | 1) => {
    const a = full[idx]
    const b = full[idx + dir]
    if (!a || !b) return
    await Promise.all([
      supabase.from('setlist_songs').update({ position: b.position }).eq('id', a.id),
      supabase.from('setlist_songs').update({ position: a.position }).eq('id', b.id),
    ])
    loadItems()
  }

  const addSongs = async (ids: string[]) => {
    if (!current) return
    const start = full.length ? Math.max(...full.map((i) => i.position)) + 1 : 0
    const rows = ids.map((song_id, i) => ({ setlist_id: current.id, song_id, position: start + i, key: songById.get(song_id)?.original_key ?? null }))
    if (await run(supabase.from('setlist_songs').insert(rows), `${ids.length} canción(es) agregada(s)`)) loadItems()
  }

  const copy = async () => {
    if (!current) return
    const { data } = await supabase.from('settings').select('*').in('key', ['whatsapp_template', 'whatsapp_song_line'])
    const get = (k: string) => (data as { key: string; value: string }[] | null)?.find((x) => x.key === k)?.value
    const text = buildWhatsApp(current, full, get('whatsapp_template') ?? DEFAULT_TEMPLATE, get('whatsapp_song_line') ?? DEFAULT_LINE)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Texto copiado. ¡Pégalo en WhatsApp!')
    } catch {
      /* el navegador bloqueó el portapapeles; se muestra para copiar manualmente */
    }
    setPreview(text)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <CalendarHeart />
          </div>
          {current ? (
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-gold">{isPast(current.date) ? 'Último repertorio' : 'Repertorio'}</div>
              <div className="truncate text-lg font-extrabold capitalize text-white">{fmt(current.date)}</div>
              {current.title && <div className="truncate text-sm text-mist/70">{current.title}</div>}
            </div>
          ) : (
            <div className="text-mist">Aún no hay repertorios.</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {lists.length > 1 && (
            <div className="relative">
              <History size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist/60" />
              <select className="input w-auto pl-9" value={currentId ?? ''} onChange={(e) => setCurrentId(e.target.value)} aria-label="Historial">
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {fmt(l.date, 'd MMM yyyy')} {l.title ? `· ${l.title}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {current && full.length > 0 && (
            <button className="btn-primary" onClick={copy}>
              <Copy size={16} /> Copiar para WhatsApp
            </button>
          )}
          {isAdmin && current && (
            <>
              <button className="btn-icon" onClick={() => setEditList(current)} title="Editar repertorio" aria-label="Editar repertorio">
                <Pencil size={16} />
              </button>
              <DeleteButton
                label="¿Eliminar este repertorio completo?"
                onConfirm={() => run(supabase.from('setlists').delete().eq('id', current.id), 'Repertorio eliminado').then(() => loadLists(undefined))}
              />
            </>
          )}
          {isAdmin && (
            <button className="btn-ghost" onClick={() => setEditList({ date: nextSaturdayISO() })}>
              <Plus size={16} /> Nuevo
            </button>
          )}
        </div>
      </div>

      {current?.notes && <div className="glass whitespace-pre-line p-4 text-sm text-mist">{current.notes}</div>}

      {current &&
        (full.length === 0 ? (
          <Empty icon={<ListPlus size={36} />}>{isAdmin ? 'Agrega las canciones de este fin de semana.' : 'El repertorio aún no tiene canciones.'}</Empty>
        ) : (
          <div className="space-y-2">
            {full.map((it, i) => (
              <SetlistRow key={it.id} item={it} index={i} total={full.length} isAdmin={isAdmin} onMove={move} onChanged={loadItems} />
            ))}
          </div>
        ))}

      {isAdmin && current && (
        <button className="btn-ghost w-full border-dashed py-4" onClick={() => setPicker(true)}>
          <ListPlus size={18} /> Agregar canciones
        </button>
      )}

      {editList && (
        <SetlistForm
          draft={editList}
          onClose={() => setEditList(null)}
          onSaved={(id) => {
            loadLists(id)
          }}
        />
      )}
      {picker && <SongPicker songs={songs} exclude={new Set(full.map((i) => i.song_id))} onClose={() => setPicker(false)} onPick={addSongs} />}
      <Modal open={preview !== null} onClose={() => setPreview(null)} title="Texto para WhatsApp" wide>
        <textarea readOnly className="input min-h-80 font-mono text-xs" value={preview ?? ''} onFocus={(e) => e.target.select()} />
        <div className="mt-4 flex justify-end gap-2">
          <a className="btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(preview ?? '')}`} target="_blank" rel="noopener">
            Abrir WhatsApp
          </a>
          <button
            className="btn-primary"
            onClick={() => navigator.clipboard.writeText(preview ?? '').then(() => toast.success('Copiado'), () => toast.error('Selecciona el texto y cópialo manualmente'))}
          >
            <Copy size={16} /> Copiar
          </button>
        </div>
      </Modal>
    </div>
  )
}

function SetlistRow({ item, index, total, isAdmin, onMove, onChanged }: { item: Item; index: number; total: number; isAdmin: boolean; onMove: (i: number, d: -1 | 1) => void; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [key, setKey] = useState(item.key ?? '')
  const [lead, setLead] = useState(item.lead ?? '')
  const save = async () => {
    if (await run(supabase.from('setlist_songs').update({ key: key || null, lead: lead || null }).eq('id', item.id))) {
      setEditing(false)
      onChanged()
    }
  }
  return (
    <div className="glass group p-2.5">
      <div className="flex items-center gap-3">
        <div className="w-6 text-center text-lg font-extrabold text-gold/70">{index + 1}</div>
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => item.song.youtube_url && window.open(item.song.youtube_url, '_blank', 'noopener')}>
          <SongThumb song={item.song} className="hidden h-14 w-20 sm:block" />
          <div className="min-w-0 flex-1">
            <SongInfo song={item.song} keyOverride={item.key} />
            {item.lead && <div className="mt-1 text-xs text-gold-light">🎤 Dirige: {item.lead}</div>}
          </div>
        </button>
        {item.song.track_url && (
          <a href={item.song.track_url} target="_blank" rel="noopener" className="btn-icon text-gold" title="Pista">
            🎧
          </a>
        )}
        {isAdmin && (
          <div className="flex shrink-0 items-center">
            <div className="flex flex-col">
              <button className="btn-icon h-6" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Subir">
                <ArrowUp size={14} />
              </button>
              <button className="btn-icon h-6" disabled={index === total - 1} onClick={() => onMove(index, 1)} aria-label="Bajar">
                <ArrowDown size={14} />
              </button>
            </div>
            <button className="btn-icon" onClick={() => setEditing(!editing)} aria-label="Editar tono">
              <Pencil size={16} />
            </button>
            <button className="btn-icon hover:!text-red-300" onClick={() => run(supabase.from('setlist_songs').delete().eq('id', item.id)).then(onChanged)} aria-label="Quitar">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      {editing && (
        <div className="mt-3 grid gap-2 border-t border-white/5 pt-3 sm:grid-cols-[1fr_2fr_auto]">
          <input className="input" placeholder="Tono" value={key} onChange={(e) => setKey(e.target.value)} />
          <input className="input" placeholder="¿Quién dirige?" value={lead} onChange={(e) => setLead(e.target.value)} />
          <button className="btn-primary" onClick={save}>
            Guardar
          </button>
        </div>
      )}
    </div>
  )
}

function SetlistForm({ draft, onClose, onSaved }: { draft: Partial<Setlist>; onClose: () => void; onSaved: (id: string) => void }) {
  const [date, setDate] = useState(draft.date ?? '')
  const [title, setTitle] = useState(draft.title ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [saving, setSaving] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = { date, title: title || null, notes: notes || null }
    const res = draft.id
      ? await supabase.from('setlists').update(row).eq('id', draft.id).select().single()
      : await supabase.from('setlists').insert(row).select().single()
    setSaving(false)
    if (res.error) return toast.error(res.error.message)
    toast.success('Repertorio guardado')
    onSaved((res.data as Setlist).id)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? 'Editar repertorio' : 'Nuevo repertorio'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Fecha">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Título">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Servicio dominical / Santa Cena" />
        </Field>
        <Field label="Notas">
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indicaciones para el equipo (opcional)" />
        </Field>
        <FormActions onCancel={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

function SongPicker({ songs, exclude, onClose, onPick }: { songs: Song[]; exclude: Set<string>; onClose: () => void; onPick: (ids: string[]) => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const list = songs
    .filter((s) => !exclude.has(s.id))
    .filter((s) => !q || norm(`${s.title} ${s.artist ?? ''}`).includes(norm(q)))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'))
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  return (
    <Modal open onClose={onClose} title="Agregar canciones" wide>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/50" />
        <input autoFocus className="input pl-10" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
        {list.map((s) => {
          const i = sel.indexOf(s.id)
          return (
            <button key={s.id} onClick={() => toggle(s.id)} className={cx('flex w-full items-center gap-3 rounded-xl p-2 text-left transition', i >= 0 ? 'bg-gold/15 ring-1 ring-gold/40' : 'hover:bg-white/5')}>
              <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', i >= 0 ? 'bg-gold text-ink' : 'border border-white/20')}>
                {i >= 0 ? i + 1 : ''}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{s.title}</div>
                <div className="truncate text-xs text-mist/60">
                  {s.category === 'alabanza' ? 'Alabanza' : 'Adoración'} · {s.artist} {s.original_key && `· ${s.original_key}`}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn-primary"
          disabled={!sel.length}
          onClick={() => {
            onPick(sel)
            onClose()
          }}
        >
          Agregar {sel.length || ''}
        </button>
      </div>
    </Modal>
  )
}
