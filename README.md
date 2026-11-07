# CBI Alabanza · Valledupar

App web del ministerio de alabanza de CBI Valledupar: información, devocionales, ayunos y vigilias, descansos, cancionero (alabanzas, adoraciones y repertorio del fin de semana con texto para WhatsApp), propuestas de canciones y cumpleaños/registro de miembros.

**Stack:** Vite + React + TypeScript + Tailwind · Supabase (Auth, Postgres, RLS, Realtime) · Netlify.

## Desarrollo
```bash
cp .env.example .env   # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Base de datos
- Esquema y políticas: `supabase/migrations/`
- Datos iniciales desde la hoja (no se versiona: contiene datos personales): `npm run seed -- "Cancionero CBI Valledupar.xlsx" 2026` → `supabase/seed.sql`
- Aplicar: `npx supabase link --project-ref <ref>` y `npx supabase db push`

### Roles
Los usuarios se registran y quedan **pendientes**. Un admin los aprueba en *Cumpleaños → Cuentas*.
Primer admin (SQL Editor de Supabase):
```sql
update public.profiles set role = 'admin', status = 'approved' where email = 'tu@correo.com';
```
