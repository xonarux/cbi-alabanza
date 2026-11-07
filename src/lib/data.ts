import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from './supabase'
import type { Member } from './types'
import { errMsg } from './utils'

/** Carga una tabla completa con orden y permite recargar */
export function useTable<T>(table: string, order: string, ascending = true, select = '*') {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const { data, error } = await supabase.from(table).select(select).order(order, { ascending })
    if (error) toast.error(errMsg(error))
    setData((data as T[]) ?? [])
    setLoading(false)
  }, [table, order, ascending, select])
  useEffect(() => {
    reload()
  }, [reload])
  return { data, loading, reload, setData }
}

export function useMembers() {
  const r = useTable<Member>('members', 'full_name')
  const byId = new Map(r.data.map((m) => [m.id, m]))
  return { ...r, byId, active: r.data.filter((m) => m.active) }
}

/** Ejecuta una mutación mostrando toasts */
export async function run(p: PromiseLike<{ error: unknown }>, ok?: string) {
  const { error } = await p
  if (error) {
    toast.error(errMsg(error))
    return false
  }
  if (ok) toast.success(ok)
  return true
}
