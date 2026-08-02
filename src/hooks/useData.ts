import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type DbAnalysis, type DbAlert, type DbRecommendation, type BrvmRow } from '../lib/supabase'
import { api } from '../lib/api'

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
      const data = await api.get<DbAlert[]>('/api/alertes')
      setAlerts(data ?? [])
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
      const data = await api.get<DbAnalysis[]>('/api/analyses')
      setAnalyses(data ?? [])
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
