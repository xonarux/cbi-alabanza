// Utilidades para acordes en formato "acordes encima de la letra" (LaCuerda, Cifra Club…)

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const BASE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const SOLFEGE: Record<string, string> = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' }

const SUFFIX = String.raw`(?:maj|min|m|M|dim|aug|sus|add|°|º|\+)?\d*(?:(?:maj|sus|add|b|#|\+|-)\d+)*(?:\([^)\s]*\))?`
const CHORD = new RegExp(String.raw`^([A-G])([#b]?)(${SUFFIX})(?:\/([A-G])([#b]?))?$`)
const ORNAMENT = /^(?:\|+|-+|\/|%|\.{2,}|x\d+|\(x\d+\)|N\.?C\.?|\(|\))$/i
/** "Intro:", "Coro (x2):" … seguido de acordes en la misma línea */
const LABELED = /^(\s*[A-Za-zÁÉÍÓÚÑáéíóúñ][\wÁÉÍÓÚÑáéíóúñ\s-]*?(?:\s*\(x?\d+\))?\s*:\s*)(.*)$/

const semi = (letter: string, acc: string) => (BASE[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12
const mod12 = (n: number) => ((n % 12) + 12) % 12

export const isChordToken = (t: string) => CHORD.test(t)

/** Línea compuesta solo por acordes (y adornos como |, x2, N.C.) */
export function isChordLine(line: string) {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  return tokens.length > 0 && tokens.some(isChordToken) && tokens.every((t) => isChordToken(t) || ORNAMENT.test(t))
}

/** Si la línea es "Etiqueta: acordes…", devuelve [etiqueta, acordes] */
export function splitLabeledChordLine(line: string): [string, string] | null {
  const m = line.match(LABELED)
  return m && m[2].trim() && isChordLine(m[2]) ? [m[1], m[2]] : null
}

export function transposeChord(chord: string, semis: number, flats: boolean) {
  const m = chord.match(CHORD)
  if (!m || semis % 12 === 0) return chord
  const names = flats ? FLATS : SHARPS
  const [, root, acc, suffix, bass, bassAcc] = m
  const out = names[mod12(semi(root, acc) + semis)] + suffix
  return bass ? `${out}/${names[mod12(semi(bass, bassAcc) + semis)]}` : out
}

/** Transpone los acordes de una línea conservando la columna donde empieza cada uno */
export function transposeLine(line: string, semis: number, flats: boolean) {
  if (mod12(semis) === 0) return line
  let out = ''
  for (const m of line.matchAll(/\S+/g)) {
    const tok = isChordToken(m[0]) ? transposeChord(m[0], semis, flats) : m[0]
    const start = Math.max(m.index, out.length + (out.trim() ? 1 : 0))
    out = out.padEnd(start) + tok
  }
  return out
}

export interface Key {
  semi: number
  minor: boolean
}

/** Entiende "G", "Bb", "C#m", "C hombre", "Sol", "Lam"… */
export function parseKey(text?: string | null): Key | null {
  const t = text?.trim()
  if (!t) return null
  const sol = t.match(/^(do|re|mi|fa|sol|la|si)([#b♯♭]?)(m)?(?![a-z])/i)
  if (sol) return { semi: semi(SOLFEGE[sol[1].toLowerCase()], normAcc(sol[2])), minor: !!sol[3] }
  const m = t.match(/^([A-G])([#b♯♭]?)(m)?(?![a-z])/)
  return m ? { semi: semi(m[1], normAcc(m[2])), minor: !!m[3] } : null
}
const normAcc = (acc: string) => (acc === '♯' ? '#' : acc === '♭' ? 'b' : acc)

/** Salto más corto (−5…+6) para ir de un tono a otro */
export function semitonesBetween(from?: string | null, to?: string | null) {
  const a = parseKey(from)
  const b = parseKey(to)
  if (!a || !b) return 0
  const d = mod12(b.semi - a.semi)
  return d > 6 ? d - 12 : d
}

const FLAT_MAJOR = new Set([5, 10, 3, 8, 1, 6]) // F Bb Eb Ab Db Gb
const FLAT_MINOR = new Set([2, 7, 0, 5, 10, 3]) // Dm Gm Cm Fm Bbm Ebm

/** ¿Escribir con bemoles en este tono? Sin tono conocido, se guía por los acordes del texto */
export function prefersFlats(key: Key | null, text = '') {
  if (key) return key.minor ? FLAT_MINOR.has(key.semi) : FLAT_MAJOR.has(key.semi)
  const flats = (text.match(/\b[A-G]b/g) ?? []).length
  const sharps = (text.match(/\b[A-G]#/g) ?? []).length
  return flats > sharps
}

export function keyName(key: Key, flats: boolean) {
  return (flats ? FLATS : SHARPS)[mod12(key.semi)] + (key.minor ? 'm' : '')
}

export const shiftKey = (key: Key, semis: number): Key => ({ semi: mod12(key.semi + semis), minor: key.minor })
