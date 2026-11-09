import { useState, type ReactNode } from 'react'
import { LyricsModal } from './Lyrics'
import { AudioLines, FileText, Guitar, Headphones, Music2, Play } from 'lucide-react'
import type { Song } from '../lib/types'
import { youtubeId } from '../lib/utils'

export function SongThumb({ song, className = 'h-16 w-24' }: { song: Song; className?: string }) {
  const id = youtubeId(song.youtube_url)
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet to-navy ${className}`}>
      {id ? (
        <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Music2 className="absolute inset-0 m-auto text-gold/60" />
      )}
      {id && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <Play className="fill-white text-white" size={22} />
        </div>
      )}
    </div>
  )
}

export function SongInfo({ song, keyOverride }: { song: Song; keyOverride?: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-bold text-white">{song.title}</div>
      <div className="truncate text-sm text-mist/70">{song.artist || '—'}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(keyOverride || song.original_key) && (
          <span className="chip border-gold/30 text-gold">
            🎼 {keyOverride || song.original_key}
          </span>
        )}
        {song.voice && <span className="chip">{song.voice}</span>}
        {song.variant_key && <span className="chip">Var: {song.variant_key}</span>}
        {song.genre && <span className="chip">{song.genre}</span>}
      </div>
    </div>
  )
}

/** Enlaces de la canción. Si no hay enlace guardado, se usa una búsqueda. */
export function songLinks(song: Song) {
  const q = encodeURIComponent(`${song.title} ${song.artist ?? ''}`.trim())
  return [
    {
      key: 'youtube',
      label: 'YouTube',
      icon: <Play size={14} className="fill-current" />,
      href: song.youtube_url || `https://www.youtube.com/results?search_query=${q}`,
      saved: !!song.youtube_url,
      tone: 'hover:border-red-400/50 hover:text-red-300',
    },
    {
      key: 'spotify',
      label: 'Spotify',
      icon: <AudioLines size={14} />,
      href: song.spotify_url || `https://open.spotify.com/search/${q}`,
      saved: !!song.spotify_url,
      tone: 'hover:border-green-400/50 hover:text-green-300',
    },
    {
      key: 'letra',
      label: 'Letra',
      icon: <FileText size={14} />,
      href: song.lyrics_url || `https://www.google.com/search?q=${q}+letra`,
      saved: !!song.lyrics_url,
      tone: 'hover:border-sky-400/50 hover:text-sky-300',
    },
    {
      key: 'acordes',
      label: 'Acordes',
      icon: <Guitar size={14} />,
      href: song.chords_url || `https://www.google.com/search?q=${q}+acordes`,
      saved: !!song.chords_url,
      tone: 'hover:border-gold/50 hover:text-gold',
    },
  ]
}

export function SongLinks({ song, keyOverride, className = '' }: { song: Song; keyOverride?: string | null; className?: string }) {
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const btn = 'flex min-w-0 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-1 py-1.5 text-xs font-semibold text-mist transition'
  return (
    <div className={`grid grid-cols-4 gap-1.5 ${className}`}>
      {songLinks(song).map((l) =>
        l.key === 'letra' && song.lyrics ? (
          <button key={l.key} type="button" onClick={() => setLyricsOpen(true)} title="Letra: ver en la app" className={`${btn} ${l.tone} border-sky-400/30 text-sky-200`}>
            {l.icon}
            <span className="truncate">{l.label}</span>
          </button>
        ) : (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener"
            title={l.saved ? `${l.label}: abrir enlace` : `${l.label}: buscar (sin enlace guardado)`}
            className={`${btn} ${l.tone} ${l.saved ? '' : 'opacity-60'}`}
          >
            {l.icon}
            <span className="truncate">{l.label}</span>
          </a>
        ),
      )}
      {lyricsOpen && <LyricsModal song={song} keyOverride={keyOverride} onClose={() => setLyricsOpen(false)} />}
    </div>
  )
}

export default function SongCard({ song, actions }: { song: Song; actions?: ReactNode }) {
  return (
    <div className="glass min-w-0 p-2.5 transition hover:border-gold/30 hover:bg-white/[0.07]">
      <div className="flex min-w-0 items-center gap-3">
        <SongThumb song={song} className="h-14 w-20 sm:h-16 sm:w-24" />
        <SongInfo song={song} />
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
          {song.track_url && (
            <a href={song.track_url} target="_blank" rel="noopener" className="btn-icon text-gold" title="Pista">
              <Headphones size={18} />
            </a>
          )}
          {actions}
        </div>
      </div>
      <SongLinks song={song} className="mt-2.5" />
    </div>
  )
}
