import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, X, Calendar, Percent, TrendingUp, Building2 } from 'lucide-react'
import { useAnalyses } from '../hooks/useData'
import { useStockHistory, computeRSI } from '../hooks/useData'
import { supabase, type DbAnalysis } from '../lib/supabase'
import { RiskBadge } from '../components/RiskBadge'
import { RefreshButton } from '../components/RefreshButton'
import { formatGMTDate, formatPrice } from '../lib/theme'
import { markAnalysisRead } from '../hooks/useProfileStats'

function AnalysisMarketPanel({ ticker }: { ticker: string }) {
  const [cours, setCours] = useState<number | null>(null)
  const [dayChange, setDayChange] = useState<number | null>(null)
  const [sector, setSector] = useState<string | null>(null)
  const { history } = useStockHistory(ticker)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('brvm_cours').select('cours, variation_pct').eq('ticker', ticker).maybeSingle(),
      supabase.from('companies').select('sector').eq('ticker', ticker).maybeSingle(),
    ]).then(([live, comp]) => {
      if (cancelled) return
      setCours(live.data?.cours ?? null)
      setDayChange(live.data?.variation_pct ?? null)
      setSector(comp.data?.sector ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [ticker])

  const closes = history.map((h) => h.cours)
  const rsi = computeRSI(closes)
  const up = (dayChange ?? 0) >= 0

  const w = 640
  const h = 120
  const pad = 6
  let points = ''
  if (closes.length > 1) {
    const mn = Math.min(...closes)
    const mx = Math.max(...closes)
    const range = mx - mn || 1
    points = closes
      .map((c, i) => {
        const x = pad + (i * (w - 2 * pad)) / (closes.length - 1)
        const y = pad + (1 - (c - mn) / range) * (h - 2 * pad)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  return (
    <div className="rounded-2xl p-4 mt-5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <div className="flex items-center gap-2 mb-3">
        <Building2 size={14} color="#F5C842" />
        <p className="text-textMuted text-[10px] font-bold uppercase tracking-wide">
          Données de marché réelles · {ticker}
          {sector ? ` · ${sector}` : ''}
        </p>
      </div>

      {cours != null ? (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-white font-extrabold text-xl">{formatPrice(cours)}</span>
          {dayChange != null && (
            <span className="font-extrabold text-sm" style={{ color: up ? '#22C55E' : '#EF4444' }}>
              {up ? '+' : ''}
              {dayChange.toFixed(2)}%
            </span>
          )}
        </div>
      ) : (
        <p className="text-textSub text-xs mb-3">Cours indisponible pour le moment.</p>
      )}

      {points ? (
        <>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 70 }}>
            <polyline points={points} fill="none" stroke={up ? '#22C55E' : '#EF4444'} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="flex justify-between mt-1">
            <span className="text-textMuted text-[9px]">{history[0]?.day}</span>
            <span className="text-textMuted text-[9px]">{history[history.length - 1]?.day}</span>
          </div>
        </>
      ) : (
        <p className="text-textSub text-xs">Historique de prix en cours de constitution pour cette valeur.</p>
      )}

      {rsi != null && (
        <div className="mt-3 pt-2.5 flex items-center justify-between" style={{ borderTop: '1px solid #2A2A3A' }}>
          <span className="text-textSub text-[10px] font-bold uppercase tracking-wide">RSI (14) réel</span>
          <span className="text-primary font-extrabold text-xs">
            {rsi.toFixed(1)} · {rsi >= 70 ? 'suracheté' : rsi <= 30 ? 'survendu' : 'neutre'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function Analyses() {
  const navigate = useNavigate()
  const { analyses, loading, error, refetch } = useAnalyses()
  const [selected, setSelected] = useState<DbAnalysis | null>(null)

  function openAnalysis(a: DbAnalysis) {
    setSelected(a)
    markAnalysisRead(a.id)
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-3 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Marché BRVM</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Analyses</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={refetch} loading={loading} />
          <BarChart2 size={22} color="#F5C842" />
        </div>
      </div>

      <button
        onClick={() => navigate('/formations')}
        className="flex items-center gap-1.5 px-5 pb-3 text-xs font-bold"
        style={{ color: '#F5C842' }}
      >
        <TrendingUp size={14} /> BRVM · Nos Formations
      </button>
      <div style={{ borderBottom: '1px solid #1E1E2A' }} />


      <div className="px-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: '#111118' }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-sell text-sm mb-3">{error}</p>
            <button onClick={refetch} className="text-primary text-sm font-semibold">Réessayer</button>
          </div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div className="text-center py-20">
            <BarChart2 size={40} color="#4A4A5A" className="mx-auto mb-3" />
            <p className="text-textSub text-sm">Aucune analyse publiée</p>
          </div>
        )}

        {!loading && !error && analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => openAnalysis(a)}
            className="w-full text-left rounded-2xl mb-3 tappable overflow-hidden"
            style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
          >
            {a.image_url && <img src={a.image_url} alt="" className="w-full h-32 object-cover" />}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                {a.stock_name && <span className="text-primary font-bold text-xs uppercase tracking-wide">{a.stock_name}</span>}
                {a.risk_level && <RiskBadge level={a.risk_level} size="sm" />}
              </div>
              <h3 className="text-white font-bold text-base mb-1">{a.title}</h3>
              <div className="flex items-center gap-4 mt-2">
                {a.potential_percent != null && (
                  <span className="flex items-center gap-1 text-buy text-xs font-semibold">
                    <Percent size={12} /> +{a.potential_percent}% potentiel
                  </span>
                )}
                <span className="flex items-center gap-1 text-textMuted text-xs">
                  <Calendar size={12} /> {formatGMTDate(new Date(a.created_at))}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0A0A0F' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
            <h2 className="text-white font-bold text-lg">Analyse</h2>
            <button onClick={() => setSelected(null)} className="text-textSub">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {selected.image_url && <img src={selected.image_url} alt="" className="w-full h-44 object-cover rounded-2xl mb-4" />}
            {selected.stock_name && (
              <span className="text-primary font-bold text-sm uppercase tracking-wide">{selected.stock_name}</span>
            )}
            <h1 className="text-white font-extrabold text-2xl mt-2 mb-3">{selected.title}</h1>
            <div className="flex items-center gap-3 mb-5">
              {selected.risk_level && <RiskBadge level={selected.risk_level} />}
              {selected.potential_percent != null && (
                <span className="text-buy text-sm font-bold">+{selected.potential_percent}% potentiel</span>
              )}
            </div>
            <p className="text-textSub text-sm leading-7 whitespace-pre-wrap">{selected.content}</p>
            {selected.ticker && <AnalysisMarketPanel ticker={selected.ticker} />}
          </div>
        </div>
      )}
    </div>
  )
}
