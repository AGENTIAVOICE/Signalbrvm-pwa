import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type DbPortfolioPosition } from '../lib/supabase'

export interface SimPosition extends DbPortfolioPosition {
  cours: number | null
  variation_pct: number | null
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// Simulateur d'achat/vente réel : mêmes cours que le reste de l'app
// (brvm_cours), mêmes tickers que ceux suivis dans les alertes, capital
// réellement débité/crédité et positions réellement persistées.
export function usePortfolioSimulator() {
  const [positions, setPositions] = useState<SimPosition[]>([])
  const [loading, setLoading] = useState(true)
  const channelId = useRef(`portfolio_rt_${Math.random().toString(36).slice(2)}`)

  const refetch = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) {
      setPositions([])
      setLoading(false)
      return
    }
    const { data } = await supabase.from('portfolio_positions').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    const rows = (data ?? []) as DbPortfolioPosition[]
    const tickers = [...new Set(rows.map((r) => r.ticker))]
    const coursByTicker = new Map<string, { cours: number; variation_pct: number | null }>()
    if (tickers.length) {
      const { data: cours } = await supabase.from('brvm_cours').select('ticker, cours, variation_pct').in('ticker', tickers)
      for (const c of cours ?? []) coursByTicker.set(c.ticker, { cours: c.cours, variation_pct: c.variation_pct })
    }
    setPositions(
      rows.map((r) => ({ ...r, cours: coursByTicker.get(r.ticker)?.cours ?? null, variation_pct: coursByTicker.get(r.ticker)?.variation_pct ?? null }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brvm_cours' }, () => refetch())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  // Achète `amountFcfa` de FCFA de l'action `ticker` au cours réel donné.
  // Retourne le nombre d'actions achetées, ou lève une erreur explicite.
  async function buy(params: { ticker: string; stockName: string; sector: string | null; amountFcfa: number; cours: number }): Promise<number> {
    const uid = await currentUserId()
    if (!uid) throw new Error('Vous devez être connecté.')
    const quantity = Math.floor(params.amountFcfa / params.cours)
    if (quantity < 1) throw new Error(`Montant insuffisant pour acheter au moins une action à ${params.cours.toLocaleString('fr-FR')} FCFA.`)
    const cost = quantity * params.cours

    const { data: existing } = await supabase.from('portfolio_positions').select('*').eq('user_id', uid).eq('ticker', params.ticker).maybeSingle()

    if (existing) {
      const newQuantity = existing.quantity + quantity
      const newAvg = (existing.quantity * existing.avg_buy_price + cost) / newQuantity
      await supabase.from('portfolio_positions').update({ quantity: newQuantity, avg_buy_price: newAvg, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('portfolio_positions').insert({
        user_id: uid,
        stock_id: params.ticker,
        stock_name: params.stockName,
        ticker: params.ticker,
        sector: params.sector,
        quantity,
        avg_buy_price: params.cours,
      })
    }
    await refetch()
    return quantity
  }

  // Vend `quantity` actions au cours réel donné. Retourne le produit de la vente en FCFA.
  async function sell(params: { ticker: string; quantity: number; cours: number }): Promise<number> {
    const uid = await currentUserId()
    if (!uid) throw new Error('Vous devez être connecté.')
    const { data: existing } = await supabase.from('portfolio_positions').select('*').eq('user_id', uid).eq('ticker', params.ticker).maybeSingle()
    if (!existing || existing.quantity <= 0) throw new Error('Aucune action détenue sur cette valeur.')
    const qty = Math.min(params.quantity, existing.quantity)
    if (qty < 1) throw new Error('Quantité invalide.')
    const proceeds = qty * params.cours

    if (qty >= existing.quantity) {
      await supabase.from('portfolio_positions').delete().eq('id', existing.id)
    } else {
      await supabase
        .from('portfolio_positions')
        .update({ quantity: existing.quantity - qty, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }
    await refetch()
    return proceeds
  }

  return { positions, loading, refetch, buy, sell }
}
