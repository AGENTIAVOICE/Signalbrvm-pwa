import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePortfolioSimulator } from '../hooks/usePortfolioSimulator'
import { useProfilInvestisseur } from '../hooks/useProfilInvestisseur'
import { useFollowedAlerts } from '../hooks/useFollowedAlerts'
import { useStockHistory, computeRSI } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/theme'

export default function SimulationDetail() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const sim = usePortfolioSimulator()
  const { capital, updateCapital } = useProfilInvestisseur()
  const { validated, setTradeDecision } = useFollowedAlerts()
  const { history } = useStockHistory(ticker ?? null)
  const [modal, setModal] = useState<'buy' | 'sell' | null>(null)
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [description, setDescription] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    supabase
      .from('companies')
      .select('description')
      .eq('ticker', ticker)
      .maybeSingle()
      .then(({ data }) => setDescription(data?.description ?? null))
  }, [ticker])

  const position = sim.positions.find((p) => p.ticker === ticker)

  if (!position && sim.loading) {
    return (
      <div className="min-h-screen p-5" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="h-8 w-40 rounded animate-pulse mb-4" style={{ backgroundColor: '#111118' }} />
        <div className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: '#111118' }} />
      </div>
    )
  }

  if (!position) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#0A0A0F' }}>
        <p className="text-textSub text-sm">Position introuvable.</p>
        <button onClick={() => navigate('/portefeuille')} className="text-primary text-sm font-semibold">
          Retour au portefeuille
        </button>
      </div>
    )
  }
  const pos = position

  const cours = pos.cours ?? pos.avg_buy_price
  const closes = history.map((h) => h.cours)
  const chartValues = closes.length && closes[closes.length - 1] !== cours ? [...closes, cours] : closes.length ? closes : [cours]
  const rsi = computeRSI(closes)
  const pnl = pos.quantity * (cours - pos.avg_buy_price)
  const pnlPct = pos.avg_buy_price > 0 ? ((cours - pos.avg_buy_price) / pos.avg_buy_price) * 100 : 0
  const up = pnl >= 0

  const w = 640
  const h = 160
  const pad = 6
  const allValues = [...chartValues, pos.avg_buy_price]
  const mn = Math.min(...allValues)
  const mx = Math.max(...allValues)
  const range = mx - mn || 1
  const yFor = (v: number) => pad + (1 - (v - mn) / range) * (h - 2 * pad)
  const points = chartValues.map((c, i) => `${(pad + (i * (w - 2 * pad)) / Math.max(chartValues.length - 1, 1)).toFixed(1)},${yFor(c).toFixed(1)}`).join(' ')
  const entryY = yFor(pos.avg_buy_price)
  const lastX = pad + ((chartValues.length - 1) * (w - 2 * pad)) / Math.max(chartValues.length - 1, 1)
  const lastY = yFor(cours)

  async function submit(side: 'buy' | 'sell') {
    setError('')
    setSubmitting(true)
    try {
      if (side === 'buy') {
        const n = Number(amount)
        if (!Number.isFinite(n) || n <= 0) throw new Error('Entrez un montant valide.')
        if (capital != null && n > capital) throw new Error(`Montant supérieur à votre capital disponible (${capital.toLocaleString('fr-FR')} FCFA).`)
        const qty = await sim.buy({ ticker: pos.ticker, stockName: pos.stock_name, sector: pos.sector, amountFcfa: n, cours })
        if (capital != null) await updateCapital(capital - qty * cours)
        const linked = validated.find((r) => r.alert.ticker === pos.ticker)
        if (linked) await setTradeDecision(linked.alert.id, 'bought')
      } else {
        const n = Number(quantity)
        if (!Number.isFinite(n) || n <= 0) throw new Error('Entrez une quantité valide.')
        if (n > pos.quantity) throw new Error(`Vous ne détenez que ${pos.quantity} action(s).`)
        const proceeds = await sim.sell({ ticker: pos.ticker, quantity: n, cours })
        if (capital != null) await updateCapital(capital + proceeds)
      }
      setModal(null)
      setAmount('')
      setQuantity('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-textSub" aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-sm">{position.stock_name}</h1>
        <div style={{ width: 20 }} />
      </div>

      <div className="px-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-white font-extrabold text-2xl">{formatPrice(cours)}</span>
            <span className="font-extrabold text-sm" style={{ color: up ? '#22C55E' : '#EF4444' }}>
              {up ? '+' : ''}
              {pnlPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-textMuted text-xs mb-3">
            {position.quantity} action{position.quantity > 1 ? 's' : ''} · prix d'entrée {formatPrice(position.avg_buy_price)}
          </p>

          {description && <p className="text-textSub text-xs leading-relaxed mb-3">{description}</p>}

          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 130 }}>
            <line x1={pad} y1={entryY} x2={w - pad} y2={entryY} stroke="#8A8A9A" strokeWidth={1} strokeDasharray="4 4" />
            <text x={w - pad} y={entryY - 4} textAnchor="end" fontSize="9" fill="#8A8A9A">
              Entrée · {formatPrice(position.avg_buy_price)}
            </text>
            <polyline points={points} fill="none" stroke={up ? '#22C55E' : '#EF4444'} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={lastX} cy={lastY} r={9} fill={up ? '#22C55E' : '#EF4444'} opacity={0.25} className="animate-pulse" />
            <circle cx={lastX} cy={lastY} r={4.5} fill={up ? '#22C55E' : '#EF4444'} />
          </svg>

          <div className="flex justify-between mt-1">
            <span className="text-textMuted text-[10px]">{history[0]?.day ?? ''}</span>
            <span className="font-bold text-[11px]" style={{ color: up ? '#22C55E' : '#EF4444' }}>
              {up ? '+' : ''}
              {Math.round(pnl).toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {rsi != null && (
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid #2A2A3A' }}>
              <div className="flex items-center justify-between">
                <span className="text-textSub text-[10px] font-bold uppercase tracking-wide">RSI (14) réel</span>
                <span className="text-primary font-extrabold text-xs">{rsi.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModal('buy')}
            className="flex-1 rounded-xl py-3.5 font-extrabold text-sm"
            style={{ backgroundColor: '#052E16', color: '#22C55E', border: '1px solid #166534' }}
          >
            Acheter plus
          </button>
          <button
            onClick={() => setModal('sell')}
            className="flex-1 rounded-xl py-3.5 font-extrabold text-sm"
            style={{ backgroundColor: '#200A0A', color: '#EF4444', border: '1px solid #7F1D1D' }}
          >
            Vendre
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sheet-backdrop-transition" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setModal(null)}>
          <div className="w-full rounded-t-3xl p-5 sheet-transition" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-extrabold text-base mb-4">{modal === 'buy' ? 'Acheter' : 'Vendre'} — {position.stock_name}</h3>
            <p className="text-textSub text-xs mb-3">
              Cours actuel réel : <span className="text-primary font-bold">{formatPrice(cours)}</span>
            </p>
            {modal === 'buy' ? (
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant en FCFA"
                className="w-full rounded-xl px-3 py-3 text-white text-sm outline-none mb-3"
                style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
                autoFocus
              />
            ) : (
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Quantité (max ${position.quantity})`}
                className="w-full rounded-xl px-3 py-3 text-white text-sm outline-none mb-3"
                style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
                autoFocus
              />
            )}
            {error && <p className="text-sell text-xs mb-3">{error}</p>}
            <button
              onClick={() => submit(modal)}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-40"
              style={{ backgroundColor: modal === 'buy' ? '#22C55E' : '#EF4444', color: '#0A0A0F' }}
            >
              {submitting ? 'Traitement…' : 'Confirmer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
