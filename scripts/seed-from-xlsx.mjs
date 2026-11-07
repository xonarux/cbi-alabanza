// Genera supabase/seed.sql a partir de "Cancionero CBI Valledupar.xlsx"
// Uso: node scripts/seed-from-xlsx.mjs [ruta.xlsx] [año]
import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync } from 'node:fs'

const file = process.argv[2] ?? 'Cancionero CBI Valledupar.xlsx'
const YEAR = Number(process.argv[3] ?? 2026)
const wb = XLSX.read(readFileSync(file), { cellStyles: false })

const q = (v) => (v === undefined || v === null || String(v).trim() === '' ? 'null' : `'${String(v).trim().replace(/'/g, "''")}'`)
const cell = (ws, r, c) => ws[XLSX.utils.encode_cell({ r, c })]
const val = (ws, r, c) => {
  const x = cell(ws, r, c)
  return x ? String(x.v ?? '').trim() : ''
}
const link = (ws, r, c) => cell(ws, r, c)?.l?.Target ?? ''
const rows = (ws) => XLSX.utils.decode_range(ws['!ref']).e.r

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const monthIdx = (s) => {
  if (!s || s.trim().length < 3) return null
  const k = s.trim().toLowerCase().slice(0, 3)
  const i = MONTHS.findIndex((m) => m.startsWith(k))
  return i === -1 ? null : i + 1
}
const pad = (n) => String(n).padStart(2, '0')
const sheet = (prefix) => wb.Sheets[wb.SheetNames.find((n) => n.toLowerCase().startsWith(prefix.toLowerCase()))]
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const out = ['-- Generado por scripts/seed-from-xlsx.mjs', 'begin;']
const warnings = []

// ---------- Miembros (HBD) ----------
const hbd = sheet('HBD')
const members = []
// Bloques: fila de encabezado con meses, luego filas con día|nombre
let monthsRow = null
for (let r = 0; r <= rows(hbd); r++) {
  if (monthIdx(val(hbd, r, 0)) && isNaN(Number(val(hbd, r, 0)))) {
    monthsRow = r
    continue
  }
  if (monthsRow === null) continue
  for (let c = 0; c < 12; c += 2) {
    const day = Number(val(hbd, r, c))
    const name = val(hbd, r, c + 1)
    if (day && name) members.push({ name, day, month: monthIdx(val(hbd, monthsRow, c)) })
  }
}
for (const m of members) {
  out.push(`insert into public.members (full_name, birth_day, birth_month) values (${q(m.name)}, ${m.day}, ${m.month});`)
}

// Emparejar nombres cortos ("Herre", "Jesu") con miembros
const memberRef = (short) => {
  const s = norm(short)
  if (!s) return 'null'
  const hits = members.filter((m) => norm(m.name).split(/\s+/).some((w) => w.slice(0, 4) === s.slice(0, 4)))
  if (hits.length !== 1) {
    warnings.push(`"${short}": ${hits.length === 0 ? 'sin coincidencia' : 'ambiguo → ' + hits.map((h) => h.name).join(' / ')} (se usa ${hits[0]?.name ?? 'ninguno'})`)
  }
  return hits[0] ? `(select id from public.members where full_name = ${q(hits[0].name)} limit 1)` : 'null'
}

// ---------- Información ----------
const info = sheet('Informaci')
let pos = 0
let current = null
const sections = []
for (let r = 0; r <= rows(info); r++) {
  const a = val(info, r, 0)
  const b = val(info, r, 1)
  if (!a && !b) continue
  const key = norm(a)
  if (['mision', 'vision', 'valores', 'reglas'].includes(key) && !b) {
    current = { kind: key, title: a, lines: [] }
    sections.push(current)
    continue
  }
  if (!current) continue
  if (current.kind === 'reglas') {
    const m = a.match(/^([A-ZÁÉÍÓÚÑ ]+):\s*(.*)$/s)
    sections.push({ kind: 'reglas', title: m ? m[1].trim() : 'Regla', lines: [m ? m[2] : a], rule: true })
  } else {
    current.lines.push(...[a, b].filter(Boolean))
  }
}
for (const s of sections) {
  if (s.kind === 'reglas' && !s.rule) continue // encabezado "Reglas" vacío
  out.push(`insert into public.info_sections (kind, title, body, position) values (${q(s.kind)}, ${q(s.title)}, ${q(s.lines.join('\n'))}, ${pos++});`)
}

// ---------- Devocionales ----------
const dev = sheet('Devocional')
let month = null
for (let r = 2; r <= rows(dev); r++) {
  month = monthIdx(val(dev, r, 0)) ?? month
  const day = Number(val(dev, r, 1))
  const name = val(dev, r, 3)
  if (!month || !day) continue
  out.push(`insert into public.devotionals (date, topic, member_id) values ('${YEAR}-${pad(month)}-${pad(day)}', ${q(val(dev, r, 2))}, ${memberRef(name)});`)
}
for (let r = 2; r <= rows(dev); r++) {
  const f = val(dev, r, 5)
  if (f) out.push(`-- Ayuno/vigilia sin procesar: ${f} ${val(dev, r, 6)} ${val(dev, r, 7)} ${val(dev, r, 8)}`)
}

// ---------- Descansos ----------
const des = sheet('Descansos')
month = null
for (let r = 1; r <= rows(des); r++) {
  month = monthIdx(val(des, r, 0)) ?? month
  const day = Number(val(des, r, 1))
  if (!month || !day) continue
  out.push(`insert into public.rests (date, member_id) values ('${YEAR}-${pad(month)}-${pad(day)}', ${memberRef(val(des, r, 2))});`)
}

// ---------- Canciones ----------
const songs = (name, category) => {
  const ws = sheet(name)
  let n = 0
  for (let r = 1; r <= rows(ws); r++) {
    const title = val(ws, r, 0)
    if (!title) continue
    const isAlabanza = category === 'alabanza'
    out.push(
      `insert into public.songs (category, title, artist, original_key, voice, variant_key, genre, youtube_url, track_url) values (` +
        [q(category), q(title), q(val(ws, r, 1)), q(val(ws, r, 2)), q(val(ws, r, 3)), q(val(ws, r, 4)),
          q(isAlabanza ? '' : val(ws, r, 5)), q(link(ws, r, 0)), q(isAlabanza ? link(ws, r, 5) : '')].join(', ') +
        ');',
    )
    n++
  }
  return n
}
const nAl = songs('Alabanzas', 'alabanza')
const nAd = songs('Adoraciones', 'adoracion')

// ---------- Propuestas ----------
const pro = sheet('Propuestas')
for (let r = 1; r <= rows(pro); r++) {
  const title = val(pro, r, 0)
  if (title) out.push(`insert into public.proposals (title, artist, link, proposed_by, proposer_name) values (${q(title)}, ${q(val(pro, r, 1))}, ${q(link(pro, r, 0))}, null, 'Hoja original');`)
}

// ---------- Ajustes ----------
out.push(`insert into public.settings (key, value) values ('whatsapp_template', ${q(`🎶 *Canciones {fecha}* 🎶
{titulo}

{canciones}

{notas}
_Recuerden escuchar las canciones y estudiar sus voces e instrumentos. ¡Dios les bendiga!_ 🙌`)}) on conflict (key) do nothing;`)
out.push(`insert into public.settings (key, value) values ('whatsapp_song_line', ${q(`{n}. *{cancion}* – {interprete} ({tono}){dirige}
   ▶️ {youtube}{pista}`)}) on conflict (key) do nothing;`)

out.push('commit;')
writeFileSync('supabase/seed.sql', out.join('\n') + '\n')
console.log(`Miembros: ${members.length} | Alabanzas: ${nAl} | Adoraciones: ${nAd}`)
if (warnings.length) console.log('Revisar:\n  ' + [...new Set(warnings)].join('\n  '))
