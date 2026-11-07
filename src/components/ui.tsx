import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Trash2, X } from 'lucide-react'
import LogoSvg from '../assets/logo-cbi.svg?raw'
import { cx, initials } from '../lib/utils'
import type { Member } from '../lib/types'

export function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  return <span className={cx('inline-block text-gold [&>svg]:h-full [&>svg]:w-full', className)} dangerouslySetInnerHTML={{ __html: LogoSvg }} />
}

export function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/20">{icon}</div>}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="text-sm text-mist/70">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={cx('glass max-h-[92vh] w-full overflow-y-auto rounded-b-none bg-night/95 p-5 sm:rounded-2xl sm:p-6', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function FormActions({ onCancel, saving, label = 'Guardar' }: { onCancel: () => void; saving?: boolean; label?: string }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" className="btn-ghost" onClick={onCancel}>
        Cancelar
      </button>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving && <Loader2 size={16} className="animate-spin" />} {label}
      </button>
    </div>
  )
}

export function DeleteButton({ onConfirm, label = '¿Eliminar este elemento?' }: { onConfirm: () => void | Promise<unknown>; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn-icon hover:!text-red-300" onClick={() => setOpen(true)} aria-label="Eliminar" title="Eliminar">
        <Trash2 size={16} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirmar">
        <p className="text-sm text-mist">{label}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={async () => {
              await onConfirm()
              setOpen(false)
            }}
          >
            <Trash2 size={16} /> Eliminar
          </button>
        </div>
      </Modal>
    </>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16 text-gold">
      <Loader2 className="animate-spin" />
    </div>
  )
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center gap-3 px-6 py-12 text-center text-sm text-mist/70">
      {icon && <div className="text-mist/40">{icon}</div>}
      {children}
    </div>
  )
}

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  return (
    <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-navy text-sm font-bold text-gold ring-1 ring-white/10', className)}>
      {initials(name)}
    </div>
  )
}

export function MemberSelect({ members, value, onChange, required }: { members: Member[]; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required={required}>
      <option value="">— Seleccionar miembro —</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.full_name}
        </option>
      ))}
    </select>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; icon?: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="glass mb-5 flex gap-1 overflow-x-auto p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition',
            value === t.id ? 'bg-gold text-ink shadow' : 'text-mist hover:bg-white/5',
          )}
        >
          {t.icon}
          {t.label}
          {t.count !== undefined && <span className={cx('rounded-full px-1.5 text-xs', value === t.id ? 'bg-ink/15' : 'bg-white/10')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
