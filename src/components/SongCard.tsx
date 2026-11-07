import type { ReactNode } from 'react'
import { Headphones, Music2, Play } from 'lucide-react'
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

export default function SongCard({ song, actions }: { song: Song; actions?: ReactNode }) {
  const open = () => song.youtube_url && window.open(song.youtube_url, '_blank', 'noopener')
  return (
    <div className="glass group flex items-center gap-3 p-2.5 pr-2 transition hover:border-gold/30 hover:bg-white/[0.07]">
      <button onClick={open} className="flex min-w-0 flex-1 items-center gap-3 text-left" disabled={!song.youtube_url} title={song.youtube_url ? 'Escuchar en YouTube' : 'Sin enlace'}>
        <SongThumb song={song} />
        <SongInfo song={song} />
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
        {song.track_url && (
          <a href={song.track_url} target="_blank" rel="noopener" className="btn-icon text-gold" title="Pista">
            <Headphones size={18} />
          </a>
        )}
        {actions}
      </div>
    </div>
  )
}
