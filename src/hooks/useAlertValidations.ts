import { useCallback, useEffect, useState } from 'react'
import { supabase, type DbAlert } from '../lib/supabase'

export interface ValidatedAlert extends DbAlert {
  action: 'validated' | 'rejected'
  validated_at: string
  closed_at?: string
}

const KEY_PREFIX = '@signalbrvm_alert_actions_'

async function getKey(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user?.id
  return uid ? `${KEY_PREFIX}${uid}` : null
}

async function loadAll(): Promise<ValidatedAlert[]> {
  const key = await getKey()
  if (!key) return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ValidatedAlert[]
  } catch {
    return []
  }
}

async function saveAll(actions: ValidatedAlert[]): Promise<void> {
  const key = await getKey()
  if (!key) return
  localStorage.setItem(key, JSON.stringify(actions))
}

export function useAlertValidations() {
  const [all, setAll] = useState<ValidatedAlert[]>([])
  const [actionedIds, setActioned] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const actions = await loadAll()
    setAll(actions)
    setActioned(new Set(actions.map((a) => a.id)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = useCallback(async (alert: DbAlert, action: 'validated' | 'rejected') => {
    const existing = await loadAll()
    const filtered = existing.filter((a) => a.id !== alert.id)
    const entry: ValidatedAlert = { ...alert, action, validated_at: new Date().toISOString() }
    const updated = [...filtered, entry]
    await saveAll(updated)
    setAll(updated)
    setActioned(new Set(updated.map((a) => a.id)))
  }, [])

  const close = useCallback(async (id: string) => {
    const existing = await loadAll()
    const updated = existing.map((a) => (a.id === id ? { ...a, closed_at: new Date().toISOString() } : a))
    await saveAll(updated)
    setAll(updated)
    setActioned(new Set(updated.map((a) => a.id)))
  }, [])

  const validatedAlerts = all
    .filter((a) => a.action === 'validated' && !a.closed_at)
    .sort((a, b) => new Date(b.validated_at).getTime() - new Date(a.validated_at).getTime())

  const closedAlerts = all
    .filter((a) => a.action === 'validated' && a.closed_at)
    .sort((a, b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime())

  return { validatedAlerts, closedAlerts, actionedIds, act, close }
}
