export type Role = 'admin' | 'member'
export type Status = 'pending' | 'approved' | 'rejected'

export interface Member {
  id: string
  full_name: string
  birth_day: number | null
  birth_month: number | null
  phone: string | null
  role_in_ministry: string | null
  active: boolean
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  birth_day: number | null
  birth_month: number | null
  member_id: string | null
  role: Role
  status: Status
  fasts_seen_at: string
  created_at: string
}

export interface InfoSection {
  id: string
  kind: 'mision' | 'vision' | 'valores' | 'reglas' | 'otro'
  title: string
  body: string
  position: number
}

export interface Devotional {
  id: string
  date: string
  topic: string | null
  member_id: string | null
  notes: string | null
}

export type FastType = 'ayuno' | 'vigilia' | 'ayuno y vigilia'
export interface Fast {
  id: string
  date: string
  time: string | null
  duration: string | null
  type: FastType
  notes: string | null
  created_at: string
}

export interface Rest {
  id: string
  date: string
  member_id: string | null
  notes: string | null
}

export type SongCategory = 'alabanza' | 'adoracion'
export interface Song {
  id: string
  category: SongCategory
  title: string
  artist: string | null
  original_key: string | null
  voice: string | null
  variant_key: string | null
  genre: string | null
  youtube_url: string | null
  spotify_url: string | null
  lyrics_url: string | null
  lyrics: string | null
  chords_url: string | null
  track_url: string | null
}

export interface Setlist {
  id: string
  date: string
  title: string | null
  notes: string | null
}

export interface SetlistSong {
  id: string
  setlist_id: string
  song_id: string
  position: number
  key: string | null
  lead: string | null
}

export interface Proposal {
  id: string
  title: string
  artist: string | null
  link: string | null
  notes: string | null
  proposed_by: string | null
  proposer_name: string | null
  status: 'pendiente' | 'aprobada' | 'descartada'
  created_at: string
}
