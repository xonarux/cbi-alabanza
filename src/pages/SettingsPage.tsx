import { useEffect, useState } from 'react'
import { RotateCcw, Save, Settings } from 'lucide-react'
import { run } from '../lib/data'
import { supabase } from '../lib/supabase'
import { buildWhatsApp, DEFAULT_LINE, DEFAULT_TEMPLATE, PLACEHOLDERS } from '../lib/whatsapp'
import { nextSaturdayISO } from '../lib/utils'
import type { Song } from '../lib/types'
import { Field, PageHeader, Spinner } from '../components/ui'

const SAMPLE: Song[] = [
  { id: '1', category: 'alabanza', title: 'Alaba', artist: 'Elevation Worship', original_key: 'G', voice: 'Hombre', variant_key: null, genre: null, youtube_url: 'https://www.youtube.com/watch?v=UhwE_NDKR4Y', spotify_url: null, lyrics_url: null, lyrics: null, chords_url: null, track_url: 'https://drive.google.com/…' },
  { id: '2', category: 'adoracion', title: '10000 razones', artist: 'David Scarpeta', original_key: 'G', voice: 'Hombre', variant_key: null, genre: null, youtube_url: 'https://www.youtube.com/watch?v=buhPIURovhw', spotify_url: null, lyrics_url: null, lyrics: null, chords_url: null, track_url: null },
]

export default function SettingsPage() {
  const [tpl, setTpl] = useState<string | null>(null)
  const [line, setLine] = useState('')

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .then(({ data }) => {
        const get = (k: string) => (data as { key: string; value: string }[] | null)?.find((x) => x.key === k)?.value
        setTpl(get('whatsapp_template') ?? DEFAULT_TEMPLATE)
        setLine(get('whatsapp_song_line') ?? DEFAULT_LINE)
      })
  }, [])

  if (tpl === null) return <Spinner />
  const preview = buildWhatsApp(
    { id: 'x', date: nextSaturdayISO(), title: 'Servicio dominical', notes: 'Ensayo sábado 3:30 pm' },
    SAMPLE.map((s, i) => ({ id: s.id, setlist_id: 'x', song_id: s.id, position: i, key: i === 1 ? 'F#' : null, lead: i === 0 ? 'Laura' : null, song: s })),
    tpl,
    line,
  )
  const save = () =>
    run(
      supabase.from('settings').upsert([
        { key: 'whatsapp_template', value: tpl },
        { key: 'whatsapp_song_line', value: line },
      ]),
      'Plantilla guardada',
    )

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Plantilla del mensaje de WhatsApp para el repertorio" icon={<Settings />} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass space-y-4 p-5">
          <Field label="Mensaje general">
            <textarea className="input min-h-56 font-mono text-xs" value={tpl} onChange={(e) => setTpl(e.target.value)} />
          </Field>
          <p className="text-xs text-mist/60">Variables: {PLACEHOLDERS.general.join(' ')}</p>
          <Field label="Formato de cada canción">
            <textarea className="input min-h-24 font-mono text-xs" value={line} onChange={(e) => setLine(e.target.value)} />
          </Field>
          <p className="text-xs text-mist/60">Variables: {PLACEHOLDERS.line.join(' ')}</p>
          <div className="flex justify-end gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                setTpl(DEFAULT_TEMPLATE)
                setLine(DEFAULT_LINE)
              }}
            >
              <RotateCcw size={16} /> Restablecer
            </button>
            <button className="btn-primary" onClick={save}>
              <Save size={16} /> Guardar
            </button>
          </div>
        </div>
        <div className="glass p-5">
          <span className="label">Vista previa</span>
          <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] p-4 text-sm whitespace-pre-wrap break-words text-white shadow-lg">{preview}</div>
        </div>
      </div>
    </>
  )
}
