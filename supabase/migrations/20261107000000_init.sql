-- =========================================================
-- CBI Alabanza Valledupar - esquema inicial
-- =========================================================

-- ---------- Miembros (registro + cumpleaños) ----------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_day smallint check (birth_day between 1 and 31),
  birth_month smallint check (birth_month between 1 and 12),
  phone text,
  role_in_ministry text,           -- voz, guitarra, batería...
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Perfiles (cuentas de acceso) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  birth_day smallint,
  birth_month smallint,
  member_id uuid references public.members(id) on delete set null,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  fasts_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------- Helpers de rol ----------
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and status = 'approved');
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and status = 'approved' and role = 'admin');
$$;

-- Crear perfil al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, birth_day, birth_month)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    nullif(new.raw_user_meta_data->>'birth_day','')::smallint,
    nullif(new.raw_user_meta_data->>'birth_month','')::smallint
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Marcar ayunos/vigilias como vistos (el usuario no puede editar su perfil directamente)
create or replace function public.mark_fasts_seen() returns void
language sql security definer set search_path = public as $$
  update profiles set fasts_seen_at = now() where id = auth.uid();
$$;

-- ---------- Contenido ----------
create table public.info_sections (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mision','vision','valores','reglas','otro')),
  title text not null,
  body text not null default '',
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.devotionals (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  topic text,
  member_id uuid references public.members(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.fasts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  duration text,
  type text not null default 'ayuno' check (type in ('ayuno','vigilia','ayuno y vigilia')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.rests (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  member_id uuid references public.members(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('alabanza','adoracion')),
  title text not null,
  artist text,
  original_key text,
  voice text,
  variant_key text,
  genre text,
  youtube_url text,
  track_url text,
  created_at timestamptz not null default now()
);

create table public.setlists (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.setlist_songs (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position int not null default 0,
  key text,
  lead text
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  link text,
  notes text,
  proposed_by uuid references public.profiles(id) on delete set null default auth.uid(),
  proposer_name text,
  status text not null default 'pendiente' check (status in ('pendiente','aprobada','descartada')),
  created_at timestamptz not null default now()
);

create or replace function public.set_proposer_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.proposer_name is null and new.proposed_by is not null then
    select full_name into new.proposer_name from profiles where id = new.proposed_by;
  end if;
  return new;
end $$;

create trigger proposals_set_name before insert on public.proposals
  for each row execute function public.set_proposer_name();

create table public.settings (
  key text primary key,
  value text not null
);

-- ---------- RLS ----------
alter table public.members        enable row level security;
alter table public.profiles       enable row level security;
alter table public.info_sections  enable row level security;
alter table public.devotionals    enable row level security;
alter table public.fasts          enable row level security;
alter table public.rests          enable row level security;
alter table public.songs          enable row level security;
alter table public.setlists       enable row level security;
alter table public.setlist_songs  enable row level security;
alter table public.proposals      enable row level security;
alter table public.settings       enable row level security;

-- Lectura para aprobados, escritura para admin (tablas de contenido)
do $$
declare t text;
begin
  foreach t in array array['members','info_sections','devotionals','fasts','rests','songs','setlists','setlist_songs','settings']
  loop
    execute format('create policy "%1$s_read" on public.%1$I for select using (public.is_approved())', t);
    execute format('create policy "%1$s_admin_write" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Perfiles
create policy "profiles_self_read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles for delete using (public.is_admin());

-- Propuestas
create policy "proposals_read" on public.proposals for select using (public.is_approved());
create policy "proposals_insert" on public.proposals for insert
  with check (public.is_approved() and proposed_by = auth.uid() and status = 'pendiente');
create policy "proposals_admin_update" on public.proposals for update using (public.is_admin()) with check (public.is_admin());
create policy "proposals_delete" on public.proposals for delete
  using (public.is_admin() or (proposed_by = auth.uid() and status = 'pendiente'));

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.fasts;

-- ---------- Índices ----------
create index on public.devotionals (date);
create index on public.fasts (date);
create index on public.rests (date);
create index on public.songs (category, title);
create index on public.setlists (date);
create index on public.setlist_songs (setlist_id, position);
