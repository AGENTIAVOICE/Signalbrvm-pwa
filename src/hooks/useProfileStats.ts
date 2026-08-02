import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
