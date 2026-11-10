import { useRef, useState, type ReactNode } from 'react'
import { Eye, Minus, Pencil, Plus } from 'lucide-react'
import type { Song } from '../lib/types'
import { cx } from '../lib/utils'
import { Modal } from './ui'

export interface LyricsSection {
  label: string | null
  stanzas: string[][]
  /** La sección vino vacía y se rellenó con la anterior del mismo nombre */
  repeated?: boolean
}

/** Secciones que se pueden insertar desde el editor */
export const SECTION_TAGS = ['Intro', 'Verso', 'Pre-coro', 'Coro', 'Puente', 'Interludio', 'Final']

// Encabezado de sección: "[Coro]", "[Verso 2]" o una línea sola como "Coro:" / "PUENTE"
const BRACKET = /^\s*\[(.+?)\]\s*$/
const BARE = /^\s*((?:intro|verso|estrofa|pre-?\s?coro|coro|puente|interludio|instrumental|final|outro|tag)(?:\s*\d+)?(?:\s*x\s*\d+)?)\s*:?\s*$/i

const tidy = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

/**
 * Convierte el texto plano de la letra en secciones y estrofas.
 * Con keepSpacing se conserva la sangría (necesaria para alinear acordes).
 */
export function parseLyrics(text: string, { keepSpacing = false } = {}): LyricsSection[] {
  const sections: LyricsSection[] = []
  let current: LyricsSection = { label: null, stanzas: [] }
  let stanza: string[] = []

  const closeStanza = () => {
    if (stanza.length) current.stanzas.push(stanza)
    stanza = []
  }
  const closeSection = () => {
    closeStanza()
    if (current.label || current.stanzas.length) sections.push(current)
  }

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const header = line.match(BRACKET)?.[1] ?? line.match(BARE)?.[1]
    if (header) {
      closeSection()
      current = { label: line.match(BRACKET) ? header.trim() : tidy(header.trim()), stanzas: [] }
    } else if (!line.trim()) {
      closeStanza()
    } else {
      stanza.push(keepSpacing ? line : line.trim())
    }
  }
  closeSection()

  // Una sección vacía ([Coro] sin texto) repite la última con el mismo nombre
  const norm = (l: string) => l.toLowerCase().replace(/\s*x\s*\d+$/, '').trim()
  sections.forEach((s, i) => {
    if (s.stanzas.length || !s.label) return
    const prev = sections.slice(0, i).reverse().find((p) => p.label && p.stanzas.length && norm(p.label) === norm(s.label!))
    if (prev) Object.assign(s, { stanzas: prev.stanzas, repeated: true })
  })
  return sections
}

/** Color de la etiqueta según el tipo de sección */
export function tone(label: string) {
  const l = label.toLowerCase()
  if (l.startsWith('pre')) return 'border-violet-300/30 bg-violet-300/10 text-violet-200'
  if (l.startsWith('coro')) return 'border-gold/40 bg-gold/15 text-gold'
  if (l.startsWith('puente')) return 'border-sky-300/30 bg-sky-300/10 text-sky-200'
  return 'border-white/15 bg-white/5 text-mist'
}

export function LyricsView({ text, size = 1 }: { text: string; size?: number }) {
  const sections = parseLyrics(text)
  if (!sections.length) return <p className="text-sm text-mist/60">La letra está vacía.</p>
  return (
    <div className="space-y-5" style={{ fontSize: `${size}rem` }}>
      {sections.map((s, i) => {
        const isChorus = !!s.label && /^coro/i.test(s.label)
        return (
          <section key={i} className={cx(isChorus && 'border-l-2 border-gold/60 pl-3')}>
            {s.label && (
              <div className="mb-2 flex items-center gap-2">
                <span className={cx('inline-block rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider', tone(s.label))}>{s.label}</span>
                {s.repeated && <span className="text-[0.7rem] italic text-mist/50">se repite</span>}
              </div>
            )}
            {s.stanzas.length > 0 && (
              <div className="space-y-3">
                {s.stanzas.map((st, j) => (
                  <p key={j} className={cx('leading-relaxed', isChorus ? 'font-semibold text-white' : 'text-mist')}>
                    {st.map((l, k) => (
                      <span key={k} className="block">
                        {l}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

export function LyricsModal({ song, keyOverride, onClose }: { song: Song; keyOverride?: string | null; onClose: () => void }) {
  const [size, setSize] = useState(() => Number(localStorage.getItem('lyrics-size')) || 1)
  const change = (d: number) => {
    const v = Math.min(1.6, Math.max(0.8, Math.round((size + d) * 10) / 10))
    setSize(v)
    localStorage.setItem('lyrics-size', String(v))
  }
  const key = keyOverride || song.original_key
  return (
    <Modal open onClose={onClose} title={song.title} wide>
      <div className="-mt-3 mb-4 flex items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="min-w-0 text-sm text-mist/70">
          <span className="truncate">{song.artist || '—'}</span>
          {key && <span className="chip ml-2 border-gold/30 text-gold">🎼 {key}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button className="btn-icon" onClick={() => change(-0.1)} aria-label="Letra más pequeña" disabled={size <= 0.8}>
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-xs text-mist/60">Aa</span>
          <button className="btn-icon" onClick={() => change(0.1)} aria-label="Letra más grande" disabled={size >= 1.6}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      <LyricsView text={song.lyrics ?? ''} size={size} />
    </Modal>
  )
}

const LYRICS_HELP = 'Marca cada parte con [Verso], [Coro], [Puente]… y deja una línea en blanco entre estrofas. Para repetir el coro basta con escribir [Coro] otra vez.'
const LYRICS_PLACEHOLDER = '[Verso 1]\nPrimera línea…\nSegunda línea…\n\n[Coro]\nLínea del coro…'

/** Editor con botones para insertar secciones y vista previa (letra o acordes) */
export function LyricsEditor({
  value,
  onChange,
  placeholder = LYRICS_PLACEHOLDER,
  help = LYRICS_HELP,
  renderPreview,
  noWrap = false,
  extra,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  help?: ReactNode
  renderPreview?: (v: string) => ReactNode
  /** No partir las líneas largas (para conservar la alineación de acordes) */
  noWrap?: boolean
  extra?: ReactNode
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  const insert = (tag: string) => {
    const el = ref.current
    const pos = el?.selectionStart ?? value.length
    const before = value.slice(0, pos)
    const after = value.slice(pos)
    const prefix = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
    const snippet = `${prefix}[${tag}]\n`
    onChange(before + snippet + after)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.selectionStart = el.selectionEnd = pos + snippet.length
    })
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {!preview &&
          SECTION_TAGS.map((t) => (
            <button key={t} type="button" onClick={() => insert(t)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-mist transition hover:border-gold/40 hover:text-gold">
              + {t}
            </button>
          ))}
        <button type="button" onClick={() => setPreview(!preview)} className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-gold hover:bg-white/5">
          {preview ? <Pencil size={12} /> : <Eye size={12} />} {preview ? 'Editar' : 'Vista previa'}
        </button>
      </div>
      {preview ? (
        <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {renderPreview ? renderPreview(value) : <LyricsView text={value} size={0.9} />}
        </div>
      ) : (
        <textarea
          ref={ref}
          className={cx('input min-h-64 font-mono text-sm leading-relaxed', noWrap && 'whitespace-pre')}
          wrap={noWrap ? 'off' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {extra}
      <p className="mt-1.5 text-xs text-mist/60">{help}</p>
    </div>
  )
}
