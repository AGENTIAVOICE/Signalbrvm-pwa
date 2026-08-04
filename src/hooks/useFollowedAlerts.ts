import { useCallback, useEffect, useState } from 'react'
import { supabase, type DbAlert } from '../lib/supabase'

export interface FollowedAlert {
  alert: DbAlert
  portfolio_status: 'pending' | 'validated' | 'rejected'
  closed_at: string | null
  cours: number | null
  variation_pct: number | null
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// Seule source de vérité du portefeuille : les alertes que l'utilisateur a
// réellement ajoutées au suivi (bouton "Ajouter au suivi" / "Sauvegarder"),
// enrichies du vrai cours du jour pour chaque valeur suivie.
export function useFollowedAlerts() {
  const [rows, setRows] = useState<FollowedAlert[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const uid = await currentUserId()
    if (!uid) {
      setRows([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('user_alert_actions')
      .select('portfolio_status, closed_at, alert:alerts(*)')
      .eq('user_id', uid)
      .eq('saved', true)

    const list = (data ?? []).filter((r) => r.alert) as unknown as { portfolio_status: 'pending' | 'validated' | 'rejected'; closed_at: string | null; alert: DbAlert }[]
    const tickers = [...new Set(list.map((r) => r.alert.ticker).filter((t): t is string => !!t))]
    const coursByTicker = new Map<string, { cours: number; variation_pct: number | null }>()
    if (tickers.length) {
      const { data: cours } = await supabase.from('brvm_cours').select('ticker, cours, variation_pct').in('ticker', tickers)
      for (const c of cours ?? []) coursByTicker.set(c.ticker, { cours: c.cours, variation_pct: c.variation_pct })
    }

    setRows(
      list.map((r) => ({
        alert: r.alert,
        portfolio_status: r.portfolio_status,
        closed_at: r.closed_at,
        cours: r.alert.ticker ? coursByTicker.get(r.alert.ticker)?.cours ?? null : null,
        variation_pct: r.alert.ticker ? coursByTicker.get(r.alert.ticker)?.variation_pct ?? null : null,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function setStatus(alertId: string, status: 'validated' | 'rejected') {
    const uid = await currentUserId()
    if (!uid) return
    // Un rejet retire complètement l'alerte du suivi ; une validation en
    // fait une vraie position suivie.
    await supabase
      .from('user_alert_actions')
      .update({ portfolio_status: status, saved: status === 'validated' })
      .eq('user_id', uid)
      .eq('alert_id', alertId)
    refetch()
  }

  async function closePosition(alertId: string) {
    const uid = await currentUserId()
    if (!uid) return
    await supabase.from('user_alert_actions').update({ closed_at: new Date().toISOString() }).eq('user_id', uid).eq('alert_id', alertId)
    refetch()
  }

  const pending = rows.filter((r) => r.portfolio_status === 'pending' && !r.closed_at)
  const validated = rows.filter((r) => r.portfolio_status === 'validated' && !r.closed_at)
  const closed = rows.filter((r) => r.portfolio_status === 'validated' && r.closed_at)

  return { pending, validated, closed, loading, refetch, validate: (id: string) => setStatus(id, 'validated'), reject: (id: string) => setStatus(id, 'rejected'), closePosition }
}
