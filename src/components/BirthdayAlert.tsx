import { useEffect, useState } from 'react'
import { Cake, PartyPopper } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Member } from '../lib/types'
import { todayISO } from '../lib/utils'
import { Modal } from './ui'

/** Muestra, una vez por día y dispositivo, quién cumple años hoy */
export default function BirthdayAlert() {
  const [people, setPeople] = useState<Member[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const now = new Date()
    supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .eq('birth_day', now.getDate())
      .eq('birth_month', now.getMonth() + 1)
      .then(({ data }) => {
        const list = (data as Member[]) ?? []
        setPeople(list)
        const key = 'hbd-seen-' + todayISO()
        if (list.length && localStorage.getItem(key) !== list.map((p) => p.id).join(',')) setOpen(true)
      })
  }, [])

  const close = () => {
    localStorage.setItem('hbd-seen-' + todayISO(), people.map((p) => p.id).join(','))
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={close} title="¡Hoy celebramos!">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet via-navy to-ink p-6 text-center ring-1 ring-gold/30">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,#e3bf8d33,transparent_40%),radial-gradient(circle_at_80%_70%,#b5c4c933,transparent_40%)]" />
        <PartyPopper className="mx-auto mb-3 text-gold" size={44} />
        <p className="mb-1 text-sm uppercase tracking-[0.2em] text-mist/80">Feliz cumpleaños</p>
        {people.map((p) => (
          <p key={p.id} className="text-gradient text-2xl font-extrabold">
            {p.full_name}
          </p>
        ))}
        <p className="mt-4 text-sm text-mist">
          "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia." <br />
          <span className="text-mist/60">— Números 6:24-25</span>
        </p>
      </div>
      <button className="btn-primary mt-5 w-full" onClick={close}>
        <Cake size={18} /> ¡Amén, a celebrar!
      </button>
    </Modal>
  )
}
