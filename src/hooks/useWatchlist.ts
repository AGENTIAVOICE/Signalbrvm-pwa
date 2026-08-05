import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface WatchedMarket {
  ticker: string
  full_name: string
  sector: string | null
  cours: number | null
  variation_pct: number | null
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export function useWatchlist() {
  const [watched, setWatched] = useState<WatchedMarket[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) {
      setWatched([])
      setLoading(false)
      return
    }
    const { data: rows } = await supabase.from('user_watchlist').select('ticker').eq('user_id', uid)
    const tickers = (rows ?? []).map((r) => r.ticker)
    if (tickers.length === 0) {
      setWatched([])
      setLoading(false)
      return
    }
    const [{ data: companies }, { data: cours }] = await Promise.all([
      supabase.from('companies').select('ticker, full_name, sector').in('ticker', tickers),
      supabase.from('brvm_cours').select('ticker, cours, variation_pct').in('ticker', tickers),
    ])
    const coursByTicker = new Map((cours ?? []).map((c) => [c.ticker, c]))
    setWatched(
      (companies ?? []).map((c) => ({
        ticker: c.ticker,
        full_name: c.full_name,
        sector: c.sector,
        cours: coursByTicker.get(c.ticker)?.cours ?? null,
        variation_pct: coursByTicker.get(c.ticker)?.variation_pct ?? null,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
    const channel = supabase
      .channel(`watchlist_rt_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brvm_cours' }, () => refetch())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  async function follow(ticker: string) {
    const uid = await currentUserId()
    if (!uid) return
    await supabase.from('user_watchlist').upsert({ user_id: uid, ticker })
    refetch()
  }

  async function unfollow(ticker: string) {
    const uid = await currentUserId()
    if (!uid) return
    await supabase.from('user_watchlist').delete().eq('user_id', uid).eq('ticker', ticker)
    refetch()
  }

  return { watched, loading, refetch, follow, unfollow, watchedTickers: new Set(watched.map((w) => w.ticker)) }
}
