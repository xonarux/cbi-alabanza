import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarHeart, Hand, Music, Pencil, Plus, Search, Sparkles } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { run, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { Song, SongCategory } from '../lib/types'
import { DeleteButton, Empty, Field, FormActions, Modal, PageHeader, Spinner, Tabs } from '../components/ui'
import SongCard from '../components/SongCard'
import { LyricsEditor } from '../components/Lyrics'
import WeekendSetlist from '../components/WeekendSetlist'

type Tab = SongCategory | 'finde'
const VOICES = ['Hombre', 'Mujer', 'Mixto']

export default function SongsPage() {
  const { isAdmin } = useAuth()
  const songs = useTable<Song>('songs', 'title')
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'alabanza'
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true })
  const [q, setQ] = useState('')
  const [voice, setVoice] = useState('')
  const [edit, setEdit] = useState<Partial<Song> | null>(null)

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const list = useMemo(() => {
    const nq = norm(q)
    return songs.data
      .filter((s) => s.category === tab)
      .filter((s) => !voice || s.voice === voice)
      .filter((s) => !nq || norm(`${s.title} ${s.artist ?? ''} ${s.original_key ?? ''}`).includes(nq))
      .sort((a, b) => a.title.localeCompare(b.title, 'es'))
  }, [songs.data, tab, voice, q])

  const count = (c: SongCategory) => songs.data.filter((s) => s.category === c).length

  if (songs.loading) return <Spinner />
  return (
    <>
      <PageHeader
        title="Canciones"
        subtitle="Escúchala en YouTube o Spotify, o abre su letra y acordes"
        icon={<Music />}
        actions={
          isAdmin &&
          tab !== 'finde' && (
            <button className="btn-primary" onClick={() => setEdit({ category: tab })}>
              <Plus size={16} /> Nueva canción
            </button>
          )
        }
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'alabanza', label: 'Alabanzas', icon: <Sparkles size={16} />, count: count('alabanza') },
          { id: 'adoracion', label: 'Adoraciones', icon: <Hand size={16} />, count: count('adoracion') },
          { id: 'finde', label: 'Este fin de semana', icon: <CalendarHeart size={16} /> },
        ]}
      />

      {tab === 'finde' ? (
        <WeekendSetlist songs={songs.data} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/50" />
              <input className="input pl-10" placeholder="Buscar por nombre, intérprete o tono…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input sm:w-44" value={voice} onChange={(e) => setVoice(e.target.value)}>
              <option value="">Todas las voces</option>
              {VOICES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          {list.length === 0 ? (
            <Empty icon={<Music size={36} />}>No se encontraron canciones.</Empty>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {list.map((s) => (
                <SongCard
                  key={s.id}
                  song={s}
                  actions={
                    isAdmin && (
                      <>
                        <button className="btn-icon" onClick={() => setEdit(s)} aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <DeleteButton
                          label={`¿Eliminar "${s.title}" del cancionero?`}
                          onConfirm={() => run(supabase.from('songs').delete().eq('id', s.id), 'Canción eliminada').then(songs.reload)}
                        />
                      </>
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
      {edit && <SongForm draft={edit} onClose={() => setEdit(null)} onSaved={songs.reload} />}
    </>
  )
}

export function SongForm({ draft, onClose, onSaved }: { draft: Partial<Song>; onClose: () => void; onSaved: (s?: Song) => void }) {
  const [f, setF] = useState({
    category: draft.category ?? 'alabanza',
    title: draft.title ?? '',
    artist: draft.artist ?? '',
    original_key: draft.original_key ?? '',
    voice: draft.voice ?? '',
    variant_key: draft.variant_key ?? '',
    genre: draft.genre ?? '',
    youtube_url: draft.youtube_url ?? '',
    spotify_url: draft.spotify_url ?? '',
    lyrics_url: draft.lyrics_url ?? '',
    lyrics: draft.lyrics ?? '',
    chords_url: draft.chords_url ?? '',
    track_url: draft.track_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const row = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : v.trim()])) as Partial<Song>
    const ok = await run(draft.id ? supabase.from('songs').update(row).eq('id', draft.id) : supabase.from('songs').insert(row), 'Canción guardada')
    setSaving(false)
    if (ok) {
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? 'Editar canción' : 'Nueva canción'} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría">
          <select className="input" value={f.category} onChange={set('category')}>
            <option value="alabanza">Alabanza</option>
            <option value="adoracion">Adoración</option>
          </select>
        </Field>
        <Field label="Canción">
          <input className="input" value={f.title} onChange={set('title')} required />
        </Field>
        <Field label={f.category === 'alabanza' ? 'Intérprete' : 'Autor'}>
          <input className="input" value={f.artist} onChange={set('artist')} />
        </Field>
        <Field label="Tono original">
          <input className="input" value={f.original_key} onChange={set('original_key')} placeholder="Ej: Bb, C#m" />
        </Field>
        <Field label="Para">
          <select className="input" value={f.voice} onChange={set('voice')}>
            <option value="">—</option>
            {VOICES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Tono variante">
          <input className="input" value={f.variant_key} onChange={set('variant_key')} placeholder="Ej: C hombre" />
        </Field>
        {f.category === 'adoracion' && (
          <Field label="Género">
            <input className="input" value={f.genre} onChange={set('genre')} />
          </Field>
        )}
        <Field label="Enlace de YouTube" className="sm:col-span-2">
          <input className="input" type="url" value={f.youtube_url} onChange={set('youtube_url')} placeholder="https://www.youtube.com/watch?v=…" />
        </Field>
        <Field label="Enlace de Spotify" className="sm:col-span-2">
          <input className="input" type="url" value={f.spotify_url} onChange={set('spotify_url')} placeholder="https://open.spotify.com/track/…" />
        </Field>
        <Field label="Enlace de la letra">
          <input className="input" type="url" value={f.lyrics_url} onChange={set('lyrics_url')} placeholder="Opcional" />
        </Field>
        <Field label="Enlace de los acordes">
          <input className="input" type="url" value={f.chords_url} onChange={set('chords_url')} placeholder="Ej: lacuerda.net, cifraclub…" />
        </Field>
        <p className="-mt-2 text-xs text-mist/60 sm:col-span-2">Si dejas un enlace vacío, el botón buscará la canción automáticamente.</p>
        <Field label="Enlace de la pista (Drive)" className="sm:col-span-2">
          <input className="input" type="url" value={f.track_url} onChange={set('track_url')} placeholder="Opcional" />
        </Field>
        <div className="sm:col-span-2">
          <span className="label">Letra</span>
          <LyricsEditor value={f.lyrics} onChange={(v) => setF({ ...f, lyrics: v })} />
        </div>
        <div className="sm:col-span-2">
          <FormActions onCancel={onClose} saving={saving} />
        </div>
      </form>
    </Modal>
  )
}
