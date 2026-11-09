-- =========================================================
-- Enlaces extra por canción + edición del devocional por su encargado
-- =========================================================

-- ---------- Canciones: Spotify, letra y acordes ----------
alter table public.songs
  add column if not exists spotify_url text,
  add column if not exists lyrics_url text,
  add column if not exists chords_url text;

-- ---------- Devocionales: el encargado puede poner tema y comentarios ----------
-- Solo se permiten cambiar topic y notes, y solo si el devocional está asignado
-- al miembro vinculado al perfil del usuario.
create or replace function public.update_my_devotional(p_id uuid, p_topic text, p_notes text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_approved() then
    raise exception 'No autorizado';
  end if;

  update devotionals d
     set topic = nullif(btrim(p_topic), ''),
         notes = nullif(btrim(p_notes), '')
   where d.id = p_id
     and (
       public.is_admin()
       or d.member_id = (select member_id from profiles where id = auth.uid())
     );

  if not found then
    raise exception 'Solo el encargado de este devocional puede editarlo';
  end if;
end $$;

revoke all on function public.update_my_devotional(uuid, text, text) from public, anon;
grant execute on function public.update_my_devotional(uuid, text, text) to authenticated;
