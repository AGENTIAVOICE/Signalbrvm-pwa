import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Sparkles, AlertTriangle } from 'lucide-react'
import { supabase, type DbCompany } from '../lib/supabase'
import { useStockHistory, computeRSI } from '../hooks/useData'
import { getMarketAnalysis } from '../lib/api'
import { formatPrice } from '../lib/theme'

export default function MarcheDetail() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<DbCompany | null>(null)
  const [cours, setCours] = useState<number | null>(null)
  const [dayChange, setDayChange] = useState<number | null>(null)
  const [companyName, setCompanyName] = useState<string>('')
  const { history } = useStockHistory(ticker ?? null)

  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    Promise.all([
      supabase.from('companies').select('*').eq('ticker', ticker).maybeSingle(),
      supabase.from('brvm_cours').select('cours, variation_pct, company_name').eq('ticker', ticker).maybeSingle(),
    ]).then(([comp, live]) => {
      if (cancelled) return
      setCompany((comp.data as DbCompany) ?? null)
      setCours(live.data?.cours ?? null)
      setDayChange(live.data?.variation_pct ?? null)
      setCompanyName(comp.data?.full_name ?? live.data?.company_name ?? ticker)
    })
    return () => {
      cancelled = true
    }
  }, [ticker])

  const closes = history.map((h) => h.cours)
  const rsi = computeRSI(closes)

  useEffect(() => {
    if (!ticker || cours == null || closes.length < 2) return
    let cancelled = false
    setAnalysisLoading(true)
    setAnalysisError('')
    const first = closes[0]
    const trendPct = first > 0 ? ((closes[closes.length - 1] - first) / first) * 100 : null
    const mn = Math.min(...closes)
    const mx = Math.max(...closes)
    const range = mx - mn || 1
    const rangeLowPct = ((closes[closes.length - 1] - mn) / range) * 100
    const rangeHighPct = 100 - rangeLowPct

    getMarketAnalysis({
      stockName: companyName,
      ticker,
      sector: company?.sector,
      cours,
      dayChangePct: dayChange,
      trendPct,
      rsi,
      rangeLowPct,
      rangeHighPct,
    })
      .then((res) => {
        if (!cancelled) setAnalysis(res.analysis)
      })
      .catch((err) => {
        if (!cancelled) setAnalysisError(err instanceof Error ? err.message : 'Erreur')
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, cours, closes.length])

  const w = 640
  const h = 150
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
  const up = (dayChange ?? 0) >= 0

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-textSub" aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-sm">{ticker}</h1>
        <div style={{ width: 20 }} />
      </div>

      <div className="px-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <div className="flex items-center gap-2.5 mb-3.5">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 40, height: 40, backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
            >
              {company?.logo_url ? (
                <img src={company.logo_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Building2 size={18} color="#F5C842" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-extrabold text-[15px] leading-tight truncate">{companyName}</p>
              <p className="text-textMuted text-[10px]">
                {ticker}
                {company?.sector ? ` · ${company.sector}` : ''}
              </p>
            </div>
          </div>

          {cours != null ? (
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white font-extrabold text-2xl">{formatPrice(cours)}</span>
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
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 90 }}>
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

        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={15} color="#F5C842" />
            <p className="text-white font-bold text-sm">Analyse de marché IA</p>
          </div>

          {analysisLoading && (
            <div className="flex items-center gap-2.5 text-textSub text-xs py-2">
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Génération de l'analyse à partir des données réelles…
            </div>
          )}

          {!analysisLoading && analysisError && (
            <p className="text-sell text-xs flex items-center gap-1.5">
              <AlertTriangle size={13} /> {analysisError}
            </p>
          )}

          {!analysisLoading && !analysisError && analysis && (
            <p className="text-textSub text-sm leading-relaxed">{analysis}</p>
          )}

          {!analysisLoading && !analysisError && !analysis && (
            <p className="text-textMuted text-xs">Pas assez d'historique pour générer une analyse sur cette valeur.</p>
          )}
        </div>
      </div>
    </div>
  )
}
