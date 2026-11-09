-- Letra de la canción guardada en la app (texto con secciones marcadas: [Coro], [Verso 1]...)
alter table public.songs
  add column if not exists lyrics text;
