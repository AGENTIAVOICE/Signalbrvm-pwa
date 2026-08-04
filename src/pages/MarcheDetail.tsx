import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Sparkles, AlertTriangle } from 'lucide-react'
import { supabase, type DbCompany } from '../lib/supabase'
import { useStockHistory, computeRSI } from '../hooks/useData'
import { getMarketAnalysis } from '../lib/api'
import { formatPrice, formatRelativeTime } from '../lib/theme'

function DataRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={!last ? { borderBottom: '1px solid #1E1E2A' } : undefined}>
      <span className="text-textSub text-xs">{label}</span>
      <span className="text-white text-xs font-bold">{value}</span>
    </div>
  )
}

export default function MarcheDetail() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<DbCompany | null>(null)
  const [cours, setCours] = useState<number | null>(null)
  const [dayChange, setDayChange] = useState<number | null>(null)
  const [volume, setVolume] = useState<number | null>(null)
  const [capitalisation, setCapitalisation] = useState<number | null>(null)
  const [previousClose, setPreviousClose] = useState<number | null>(null)
  const [companyName, setCompanyName] = useState<string>('')
  const { history } = useStockHistory(ticker ?? null)

  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisGeneratedAt, setAnalysisGeneratedAt] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    Promise.all([
      supabase.from('companies').select('*').eq('ticker', ticker).maybeSingle(),
      supabase.from('brvm_cours').select('cours, variation_pct, volume, capitalisation, company_name').eq('ticker', ticker).maybeSingle(),
    ]).then(([comp, live]) => {
      if (cancelled) return
      setCompany((comp.data as DbCompany) ?? null)
      setCours(live.data?.cours ?? null)
      setDayChange(live.data?.variation_pct ?? null)
      setVolume(live.data?.volume ?? null)
      setCapitalisation(live.data?.capitalisation ?? null)
      setCompanyName(comp.data?.full_name ?? live.data?.company_name ?? ticker)
    })
    return () => {
      cancelled = true
    }
  }, [ticker])

  const closes = history.map((h) => h.cours)
  const rsi = computeRSI(closes)

  useEffect(() => {
    if (closes.length >= 2) setPreviousClose(closes[closes.length - 2])
  }, [closes.length])

  // Lit d'abord l'analyse déjà précalculée côté serveur (générée à la
  // clôture des marchés) — quasi instantané. Ne relance un appel IA en
  // direct que si aucune version en cache n'existe encore pour ce ticker.
  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    setAnalysisLoading(true)
    setAnalysisError('')

    supabase
      .from('market_analyses')
      .select('analysis, generated_at')
      .eq('ticker', ticker)
      .maybeSingle()
      .then(({ data: cached }) => {
        if (cancelled) return
        if (cached?.analysis) {
          setAnalysis(cached.analysis)
          setAnalysisGeneratedAt(cached.generated_at)
          setAnalysisLoading(false)
          return
        }
        // Repli : pas encore de version en cache pour cette valeur —
        // génération à la demande, comme avant.
        if (cours == null || closes.length < 2) {
          setAnalysisLoading(false)
          return
        }
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
            if (!cancelled) {
              setAnalysis(res.analysis)
              setAnalysisGeneratedAt(new Date().toISOString())
            }
          })
          .catch((err) => {
            if (!cancelled) setAnalysisError(err instanceof Error ? err.message : 'Erreur')
          })
          .finally(() => {
            if (!cancelled) setAnalysisLoading(false)
          })
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
          <p className="text-textMuted text-[10px] font-bold uppercase tracking-wide mb-2.5">Données de marché</p>
          <div className="flex flex-col gap-2">
            {volume != null && <DataRow label="Volume (titres)" value={volume.toLocaleString('fr-FR')} />}
            {volume != null && cours != null && <DataRow label="Volume (FCFA)" value={formatPrice(Math.round(volume * cours))} />}
            {previousClose != null && <DataRow label="Clôture veille" value={formatPrice(previousClose)} />}
            {capitalisation != null && <DataRow label="Valorisation" value={`${capitalisation.toLocaleString('fr-FR')} Md FCFA`} last />}
          </div>
          <p className="text-textMuted text-[10px] mt-2.5 leading-relaxed">
            Ouverture, plus haut/bas du jour et bêta ne sont pas disponibles dans les données actuelles (seul le cours de clôture est fourni) — non affichés plutôt qu'estimés.
          </p>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} color="#F5C842" />
              <p className="text-white font-bold text-sm">Analyse de marché IA</p>
            </div>
            {analysisGeneratedAt && !analysisLoading && (
              <span className="text-textMuted text-[10px]">Mise à jour {formatRelativeTime(new Date(analysisGeneratedAt))}</span>
            )}
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
