-- El primer administrador queda aprobado automáticamente al registrarse.
-- Reemplaza 'admin@example.com' por el correo real al aplicar esta migración.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_boot boolean := lower(new.email) in ('admin@example.com');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
begin
  insert into profiles (id, email, full_name, birth_day, birth_month, role, status)
  values (
    new.id,
    new.email,
    v_name,
    nullif(new.raw_user_meta_data->>'birth_day','')::smallint,
    nullif(new.raw_user_meta_data->>'birth_month','')::smallint,
    case when is_boot then 'admin' else 'member' end,
    case when is_boot then 'approved' else 'pending' end
  );
  -- Vincular al admin con su registro de miembro si el nombre coincide
  if is_boot then
    update profiles p set member_id = (select m.id from members m where lower(m.full_name) = lower(v_name) limit 1)
    where p.id = new.id;
  end if;
  return new;
end $$;
