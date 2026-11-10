import { useMemo, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import type { Song } from '../lib/types'
import { isChordLine, keyName, parseKey, prefersFlats, semitonesBetween, shiftKey, splitLabeledChordLine, transposeLine } from '../lib/chords'
import { cx } from '../lib/utils'
import { LyricsEditor, parseLyrics, tone } from './Lyrics'
import { Modal } from './ui'

function ChordLine({ line, semis, flats }: { line: string; semis: number; flats: boolean }) {
  if (isChordLine(line)) return <span className="block font-bold text-gold">{transposeLine(line, semis, flats)}</span>
  const labeled = splitLabeledChordLine(line)
  if (labeled)
    return (
      <span className="block">
        <span className="text-mist/60">{labeled[0]}</span>
        <span className="font-bold text-gold">{transposeLine(labeled[1], semis, flats)}</span>
      </span>
    )
  return <span className="block text-white">{line}</span>
}

export function ChordsView({ text, semis = 0, flats = false, size = 1 }: { text: string; semis?: number; flats?: boolean; size?: number }) {
  const sections = useMemo(() => parseLyrics(text.replace(/\t/g, '    '), { keepSpacing: true }), [text])
  if (!sections.length) return <p className="text-sm text-mist/60">Los acordes están vacíos.</p>
  return (
    <div className="space-y-5 overflow-x-auto" style={{ fontSize: `${size * 0.875}rem` }}>
      {sections.map((s, i) => (
        <section key={i}>
          {s.label && (
            <div className="mb-2 flex items-center gap-2 font-sans">
              <span className={cx('inline-block rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider', tone(s.label))}>{s.label}</span>
              {s.repeated && <span className="text-[0.7rem] italic text-mist/50">se repite</span>}
            </div>
          )}
          <div className="space-y-3">
            {s.stanzas.map((st, j) => (
              <pre key={j} className="w-max min-w-full whitespace-pre font-mono leading-snug">
                {st.map((l, k) => (
                  <ChordLine key={k} line={l} semis={semis} flats={flats} />
                ))}
              </pre>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** 0 → "Original", 1 → "+½ tono", -3 → "−1½ tonos" */
function describeShift(semis: number) {
  if (semis === 0) return 'Original'
  const n = Math.abs(semis)
  const amount = `${Math.floor(n / 2) || ''}${n % 2 ? '½' : ''}`
  return `${semis > 0 ? '+' : '−'}${amount} ${n > 2 ? 'tonos' : 'tono'}`
}

export function ChordsModal({ song, keyOverride, onClose }: { song: Song; keyOverride?: string | null; onClose: () => void }) {
  const text = song.chords ?? ''
  const original = parseKey(song.original_key)
  const [semis, setSemis] = useState(() => semitonesBetween(song.original_key, keyOverride))
  const [size, setSize] = useState(() => Number(localStorage.getItem('chords-size')) || 1)

  const current = original ? shiftKey(original, semis) : null
  const flats = current ? prefersFlats(current) : prefersFlats(null, text)
  const resize = (d: number) => {
    const v = Math.min(1.6, Math.max(0.7, Math.round((size + d) * 10) / 10))
    setSize(v)
    localStorage.setItem('chords-size', String(v))
  }
  const shift = (d: number) => setSemis((s) => (((s + d + 6) % 12) + 12) % 12 - 6)
  const offset = describeShift(semis)

  return (
    <Modal open onClose={onClose} title={song.title} wide>
      <div className="-mt-3 mb-4 space-y-3 border-b border-white/5 pb-3">
        <div className="truncate text-sm text-mist/70">{song.artist || '—'}</div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button className="btn-icon h-8 w-8" onClick={() => shift(-1)} aria-label="Bajar medio tono" title="Bajar ½ tono">
              <Minus size={16} />
            </button>
            <div className="min-w-24 px-1 text-center leading-tight">
              <div className="text-base font-extrabold text-gold">{current ? `🎼 ${keyName(current, flats)}` : offset}</div>
              {current && <div className="text-[0.65rem] text-mist/60">{offset}</div>}
            </div>
            <button className="btn-icon h-8 w-8" onClick={() => shift(1)} aria-label="Subir medio tono" title="Subir ½ tono">
              <Plus size={16} />
            </button>
            {semis !== 0 && (
              <button className="btn-icon h-8 w-8" onClick={() => setSemis(0)} aria-label="Volver al tono original" title="Tono original">
                <RotateCcw size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-icon" onClick={() => resize(-0.1)} aria-label="Texto más pequeño" disabled={size <= 0.7}>
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-xs text-mist/60">Aa</span>
            <button className="btn-icon" onClick={() => resize(0.1)} aria-label="Texto más grande" disabled={size >= 1.6}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      <ChordsView text={text} semis={semis} flats={flats} size={size} />
    </Modal>
  )
}

const CHORDS_PLACEHOLDER = ['[Verso 1]', 'G          D', 'Primera línea de la letra', 'Em         C', 'Segunda línea de la letra', '', '[Coro]', 'C      G       D', 'Línea del coro'].join('\n')

export function ChordsEditor({ value, onChange, lyrics }: { value: string; onChange: (v: string) => void; lyrics?: string }) {
  return (
    <LyricsEditor
      value={value}
      onChange={onChange}
      noWrap
      placeholder={CHORDS_PLACEHOLDER}
      renderPreview={(v) => <ChordsView text={v} size={0.9} />}
      help="Pega los acordes tal como vienen de LaCuerda o Cifra Club: cada línea de acordes encima de su línea de letra. Marca las partes con [Verso], [Coro]… como en la letra."
      extra={
        !value.trim() &&
        lyrics?.trim() && (
          <button type="button" onClick={() => onChange(lyrics)} className="mt-2 text-xs font-semibold text-gold hover:underline">
            Usar la letra como base
          </button>
        )
      }
    />
  )
}
