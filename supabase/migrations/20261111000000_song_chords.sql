-- Acordes de la canción guardados en la app (acordes encima de la letra, con secciones [Coro], [Verso 1]...)
alter table public.songs
  add column if not exists chords text;
