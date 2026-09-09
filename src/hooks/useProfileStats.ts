import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCached, setCached } from '../lib/dataCache'

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// ── Analyses lues ────────────────────────────────────────────────────────────
export function useAnalysisReadCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) return
    try {
      const { count: c } = await supabase
        .from('user_analysis_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
      setCount(c ?? 0)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return count
}

// ── Ensemble des identifiants déjà lus (pour badge + mise en évidence des
// nouveautés) ────────────────────────────────────────────────────────────────
export function useReadIds(kind: 'alert' | 'analysis') {
  const table = kind === 'alert' ? 'user_alert_reads' : 'user_analysis_reads'
  const column = kind === 'alert' ? 'alert_id' : 'analysis_id'
  const cacheKey = `read_ids_${kind}`
  const [ids, setIds] = useState<Set<string>>(() => new Set(getCached<string[]>(cacheKey) ?? []))
  const [loaded, setLoaded] = useState(() => getCached(cacheKey) !== undefined)

  const refresh = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) {
      setLoaded(true)
      return
    }
    try {
      const { data } = await supabase.from(table).select(column).eq('user_id', uid)
      const list = (data ?? []).map((r: Record<string, string>) => r[column])
      setIds(new Set(list))
      setCached(cacheKey, list)
    } catch {
      setIds(new Set())
    }
    setLoaded(true)
  }, [table, column, cacheKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ids, loaded, refresh }
}

export async function markAnalysisRead(analysisId: string) {
  const uid = await currentUserId()
  if (!uid) return
  try {
    await supabase.from('user_analysis_reads').upsert({ user_id: uid, analysis_id: analysisId }, { onConflict: 'user_id,analysis_id' })
  } catch {
    // Table pas encore provisionnée — on ignore pour ne pas casser l'UI.
  }
}

// ── Alertes lues ─────────────────────────────────────────────────────────────
export function useAlertReadCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) return
    try {
      const { count: c } = await supabase
        .from('user_alert_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
      setCount(c ?? 0)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return count
}

export async function markAlertRead(alertId: string) {
  const uid = await currentUserId()
  if (!uid) return
  try {
    await supabase.from('user_alert_reads').upsert({ user_id: uid, alert_id: alertId }, { onConflict: 'user_id,alert_id' })
  } catch {
    // ignore
  }
}

// ── Ouvertures de l'app ───────────────────────────────────────────────────────
let recordedThisSession = false

export function useAppOpenCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) return
    try {
      const { count: c } = await supabase
        .from('user_app_opens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
      setCount(c ?? 0)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { count, refresh }
}

export async function recordAppOpenOnce() {
  if (recordedThisSession) return
  recordedThisSession = true
  const uid = await currentUserId()
  if (!uid) return
  try {
    await supabase.from('user_app_opens').insert({ user_id: uid })
  } catch {
    // ignore
  }
}

// ── Sauvegarder / Être alerté sur une alerte ────────────────────────────────
// Persiste réellement l'état des boutons "Sauvegarder" et "Être alerté" par
// utilisateur et par alerte (au lieu d'un simple état local qui se
// réinitialisait à chaque rechargement de page).
export function useAlertAction(alertId: string | null) {
  const cacheKey = alertId ? `alert_action_${alertId}` : null
  const cached = cacheKey ? getCached<{ saved: boolean; notify: boolean }>(cacheKey) : undefined
  const [saved, setSaved] = useState(cached?.saved ?? false)
  const [notify, setNotify] = useState(cached?.notify ?? false)
  const [loading, setLoading] = useState(cached === undefined)

  useEffect(() => {
    if (!alertId) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const uid = await currentUserId()
      if (!uid) {
        if (!cancelled) setLoading(false)
        return
      }
      const { data } = await supabase
        .from('user_alert_actions')
        .select('saved, notify')
        .eq('user_id', uid)
        .eq('alert_id', alertId)
        .maybeSingle()
      if (!cancelled) {
        const s = data?.saved ?? false
        const n = data?.notify ?? false
        setSaved(s)
        setNotify(n)
        setCached(`alert_action_${alertId}`, { saved: s, notify: n })
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [alertId])

  async function toggleSaved() {
    if (!alertId) return
    const uid = await currentUserId()
    if (!uid) return
    const next = !saved
    setSaved(next)
    setCached(`alert_action_${alertId}`, { saved: next, notify })
    try {
      // Suivre une alerte l'ajoute directement comme position suivie — plus
      // besoin de l'étape "À valider" séparée.
      await supabase
        .from('user_alert_actions')
        .upsert({ user_id: uid, alert_id: alertId, saved: next, ...(next ? { portfolio_status: 'validated' } : {}) }, { onConflict: 'user_id,alert_id' })
    } catch {
      setSaved(!next)
    }
  }

  async function toggleNotify() {
    if (!alertId) return
    const uid = await currentUserId()
    if (!uid) return
    const next = !notify
    setNotify(next)
    setCached(`alert_action_${alertId}`, { saved, notify: next })
    try {
      await supabase.from('user_alert_actions').upsert({ user_id: uid, alert_id: alertId, notify: next }, { onConflict: 'user_id,alert_id' })
    } catch {
      setNotify(!next)
    }
  }

  return { saved, notify, loading, toggleSaved, toggleNotify }
}
