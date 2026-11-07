import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { run } from '../lib/data'
import { supabase } from '../lib/supabase'
import { Field, FormActions, Modal } from './ui'

export default function RecoveryModal() {
  const { recovery, endRecovery } = useAuth()
  const [pw, setPw] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (await run(supabase.auth.updateUser({ password: pw }), 'Contraseña actualizada')) endRecovery()
    setSaving(false)
  }
  return (
    <Modal open={recovery} onClose={endRecovery} title="Nueva contraseña">
      <form onSubmit={submit}>
        <Field label="Escribe tu nueva contraseña">
          <input className="input" type="password" minLength={6} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </Field>
        <FormActions onCancel={endRecovery} saving={saving} />
      </form>
    </Modal>
  )
}
