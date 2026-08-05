import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type DbAnalysis, type DbAlert, type DbRecommendation, type BrvmRow, type DbCompany, type DbHistoryPoint } from '../lib/supabase'

// ── Recherche d'entreprises (auto-suggestion admin) ─────────────────────────
// Cherche par nom ou ticker dans `companies`, complète avec le cours en
// direct depuis `brvm_cours` — tout est réel, rien n'est inventé.
export interface CompanySuggestion extends DbCompany {
  cours: number | null
  variation_pct: number | null
}

export async function searchCompanies(query: string): Promise<CompanySuggestion[]> {
  const q = query.trim()
  if (!q) return []
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .or(`full_name.ilike.%${q}%,short_name.ilike.%${q}%,ticker.ilike.%${q}%`)
    .eq('is_active', true)
    .limit(8)
  if (error || !companies) return []

  const tickers = companies.map((c) => c.ticker)
  const { data: cours } = await supabase.from('brvm_cours').select('ticker, cours, variation_pct').in('ticker', tickers)
  const coursByTicker = new Map((cours ?? []).map((c) => [c.ticker, c]))

  return (companies as DbCompany[]).map((c) => ({
    ...c,
    cours: coursByTicker.get(c.ticker)?.cours ?? null,
    variation_pct: coursByTicker.get(c.ticker)?.variation_pct ?? null,
  }))
}

// ── Historique de prix réel + RSI(14) ───────────────────────────────────────
export function useStockHistory(ticker: string | null) {
  const [history, setHistory] = useState<DbHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ticker) {
      setHistory([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('brvm_history')
      .select('ticker, day, cours, variation_pct')
      .eq('ticker', ticker)
      .order('day', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setHistory((data ?? []) as DbHistoryPoint[])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ticker])

  return { history, loading }
}

// RSI(14) selon la méthode de Wilder, calculé sur des clôtures réelles.
// Retourne null tant qu'il n'y a pas au moins 15 points (période + 1).
export function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(Math.max(diff, 0))
    losses.push(Math.max(-diff, 0))
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

let channelCounter = 0

export function useAlerts() {
  const [alerts, setAlerts] = useState<DbAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelId = useRef(`alerts_rt_${++channelCounter}`)
  const loadedOnce = useRef(false)

  // silent = true : ne remet jamais le skeleton de chargement — les données
  // affichées restent visibles pendant qu'on récupère les données fraîches,
  // puis on les échange en place. Utilisé pour les refetch déclenchés par le
  // temps réel Supabase ou le bouton actualiser, pour éviter tout clignotement.
  const fetchAlerts = useCallback(async (silent = false) => {
    if (!loadedOnce.current && !silent) setLoading(true)
    try {
      const { data, error: err } = await supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (err) throw err
      setAlerts((data ?? []) as DbAlert[])
      setError(null)
    } catch (err) {
      if (!loadedOnce.current) setError(err instanceof Error ? err.message : 'Erreur réseau')
    }
    loadedOnce.current = true
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlerts()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => fetchAlerts(true))
      .subscribe()
    const interval = setInterval(() => fetchAlerts(true), 5 * 60 * 1000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [fetchAlerts])

  return { alerts, loading, error, refetch: () => fetchAlerts(true) }
}

export function useAnalyses() {
  const [analyses, setAnalyses] = useState<DbAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelId = useRef(`analyses_rt_${++channelCounter}`)
  const loadedOnce = useRef(false)

  const fetchAnalyses = useCallback(async (silent = false) => {
    if (!loadedOnce.current && !silent) setLoading(true)
    try {
      const { data, error: err } = await supabase.from('analyses').select('*').eq('is_published', true).order('created_at', { ascending: false })
      if (err) throw err
      setAnalyses((data ?? []) as DbAnalysis[])
      setError(null)
    } catch (err) {
      if (!loadedOnce.current) setError(err instanceof Error ? err.message : 'Erreur réseau')
    }
    loadedOnce.current = true
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAnalyses()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analyses' }, () => fetchAnalyses(true))
      .subscribe()
    const interval = setInterval(() => fetchAnalyses(true), 5 * 60 * 1000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [fetchAnalyses])

  return { analyses, loading, error, refetch: () => fetchAnalyses(true) }
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<DbRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelId = useRef(`recommendations_rt_${++channelCounter}`)
  const loadedOnce = useRef(false)

  const fetchRecs = useCallback(async (silent = false) => {
    if (!loadedOnce.current && !silent) setLoading(true)
    const { data, error: err } = await supabase
      .from('recommendations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (err) {
      if (!loadedOnce.current) setError(err.message)
    } else {
      setRecommendations((data ?? []) as DbRecommendation[])
      setError(null)
    }
    loadedOnce.current = true
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRecs()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recommendations' }, () => fetchRecs(true))
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRecs])

  return { recommendations, loading, error, refetch: () => fetchRecs(true) }
}

export function useBrvmMarket() {
  const [rows, setRows] = useState<BrvmRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelId = useRef(`brvm_rt_${++channelCounter}`)
  const loadedOnce = useRef(false)

  const fetchRows = useCallback(async (silent = false) => {
    if (!loadedOnce.current && !silent) setLoading(true)
    const { data, error: err } = await supabase
      .from('brvm_cours_enriched')
      .select('ticker, company_name, cours, variation_pct, volume, capitalisation, updated_at, variation_7j, variation_30j')
      .order('capitalisation', { ascending: false })

    if (!err) {
      setRows((data ?? []) as BrvmRow[])
      setError(null)
      loadedOnce.current = true
      setLoading(false)
      return
    }

    // Repli : la vue enrichie (variations 7j/30j) n'existe pas encore côté DB —
    // on affiche au moins les données de base sans casser l'écran.
    const fallback = await supabase
      .from('brvm_cours')
      .select('ticker, company_name, cours, variation_pct, volume, capitalisation, updated_at')
      .order('capitalisation', { ascending: false })

    if (fallback.error) {
      if (!loadedOnce.current) setError(fallback.error.message)
    } else {
      setRows((fallback.data ?? []) as BrvmRow[])
      setError(null)
    }
    loadedOnce.current = true
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRows()

    // Rafraîchissement instantané dès qu'une ligne brvm_cours change (mise à
    // jour du scraper ou modification manuelle admin dans Supabase).
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brvm_cours' }, () => fetchRows(true))
      .subscribe()

    // Filet de sécurité : re-vérifie toutes les 5 minutes même si le temps
    // réel Supabase venait à manquer un événement.
    const interval = setInterval(() => fetchRows(true), 5 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [fetchRows])

  return { rows, loading, error, refetch: () => fetchRows(true) }
}
