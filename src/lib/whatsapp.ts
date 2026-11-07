import type { Setlist, SetlistSong, Song } from './types'
import { fmt } from './utils'

export const DEFAULT_TEMPLATE = `🎶 *Canciones {fecha}* 🎶
{titulo}

{canciones}

{notas}
_Recuerden escuchar las canciones y estudiar sus voces e instrumentos. ¡Dios les bendiga!_ 🙌`

export const DEFAULT_LINE = `{n}. *{cancion}* – {interprete} ({tono}){dirige}
   ▶️ {youtube}{pista}`

export const PLACEHOLDERS = {
  general: ['{fecha}', '{titulo}', '{notas}', '{canciones}', '{alabanzas}', '{adoraciones}'],
  line: ['{n}', '{cancion}', '{interprete}', '{tono}', '{tono_original}', '{para}', '{dirige}', '{youtube}', '{pista}', '{categoria}'],
}

const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))

export function buildWhatsApp(
  setlist: Setlist,
  items: (SetlistSong & { song: Song })[],
  template = DEFAULT_TEMPLATE,
  lineTpl = DEFAULT_LINE,
) {
  const line = (it: SetlistSong & { song: Song }, n: number) =>
    fill(lineTpl, {
      n: String(n),
      cancion: it.song.title,
      interprete: it.song.artist ?? '',
      tono: it.key || it.song.original_key || '—',
      tono_original: it.song.original_key ?? '',
      para: it.song.voice ?? '',
      dirige: it.lead ? ` · 🎤 ${it.lead}` : '',
      youtube: it.song.youtube_url ?? '',
      pista: it.song.track_url ? `\n   🎧 Pista: ${it.song.track_url}` : '',
      categoria: it.song.category === 'alabanza' ? 'Alabanza' : 'Adoración',
    })
  const list = (arr: typeof items) => arr.map((it, i) => line(it, i + 1)).join('\n')
  const text = fill(template, {
    fecha: fmt(setlist.date),
    titulo: setlist.title ?? '',
    notas: setlist.notes ?? '',
    canciones: list(items),
    alabanzas: list(items.filter((i) => i.song.category === 'alabanza')),
    adoraciones: list(items.filter((i) => i.song.category === 'adoracion')),
  })
  return text.replace(/\n{3,}/g, '\n\n').trim()
}
