import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bell, Building2, Lightbulb, Star, Check, Lock } from 'lucide-react'
import { supabase, type DbAlert, type DbCompany } from '../lib/supabase'
import { useStockHistory, computeRSI } from '../hooks/useData'
import { formatPrice } from '../lib/theme'
import { markAlertRead, useAlertAction } from '../hooks/useProfileStats'
import { useAuth } from '../context/AuthContext'
import { ProTeaser } from '../components/ProTeaser'

function pct(target: number | null, base: number | null): string | null {
  if (target == null || base == null || base === 0) return null
  const v = ((target - base) / base) * 100
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

// Le contenu admin peut être un message brut, ou un JSON {message, price_max,
// gain_potential} produit par l'ancien formulaire — dans les deux cas, on
// n'affiche jamais le JSON brut à l'utilisateur.
function parseContent(raw: string | null): string {
  if (!raw) return ''
  try {
    const p = JSON.parse(raw)
    if (typeof p === 'object' && p !== null && 'message' in p) return p.message || ''
  } catch {
    /* texte brut */
  }
  return raw
}

// Niveau de risque calculé à partir de signaux réels (RSI + amplitude de
// variation sur la période observée) — jamais saisi par l'admin.
function computeRiskLevel(rsi: number | null, closes: number[]): string | null {
  if (closes.length < 2) return null
  const mn = Math.min(...closes)
  const mx = Math.max(...closes)
  const amplitude = mn > 0 ? ((mx - mn) / mn) * 100 : 0
  const rsiExtreme = rsi != null && (rsi >= 75 || rsi <= 25)
  if (amplitude >= 25 || rsiExtreme) return 'Élevé'
  if (amplitude >= 12) return 'Modéré'
  return 'Faible'
}

// Petite analyse générée automatiquement à partir de chiffres réels
// (tendance sur la période, position dans le range, RSI) — jamais rédigée
// par l'admin.
function generateAnalysis(stockName: string, closes: number[], rsi: number | null): string | null {
  if (closes.length < 2) return null
  const first = closes[0]
  const last = closes[closes.length - 1]
  const trendPct = first > 0 ? ((last - first) / first) * 100 : 0
  const mn = Math.min(...closes)
  const mx = Math.max(...closes)
  const nearHigh = mx > mn && last >= mn + (mx - mn) * 0.85
  const nearLow = mx > mn && last <= mn + (mx - mn) * 0.15

  const trendPhrase =
    trendPct > 3
      ? `${stockName} est en tendance haussière sur la période observée (${trendPct > 0 ? '+' : ''}${trendPct.toFixed(1)}%)`
      : trendPct < -3
        ? `${stockName} est en tendance baissière sur la période observée (${trendPct.toFixed(1)}%)`
        : `${stockName} évolue de façon plutôt stable sur la période observée (${trendPct > 0 ? '+' : ''}${trendPct.toFixed(1)}%)`

  const positionPhrase = nearHigh
    ? 'le cours se situe actuellement proche de son plus haut sur la période.'
    : nearLow
      ? 'le cours se situe actuellement proche de son plus bas sur la période.'
      : 'le cours évolue actuellement dans le milieu de sa fourchette récente.'

  const rsiPhrase =
    rsi == null
      ? ''
      : rsi >= 70
        ? ` Le RSI (14) à ${rsi.toFixed(1)} indique une zone de surachat.`
        : rsi <= 30
          ? ` Le RSI (14) à ${rsi.toFixed(1)} indique une zone de survente.`
          : ` Le RSI (14) à ${rsi.toFixed(1)} reste en zone neutre.`

  return `${trendPhrase}, ${positionPhrase}${rsiPhrase}`
}

// Reconnaissance approximative par mots communs — plus robuste qu'une simple
// sous-chaîne, car elle tolère les parenthèses, abréviations ou mots en plus
// que l'admin peut avoir tapés (ex: "AFRICA GLOBAL LOGISTICS ( AGL CI )" doit
// tout de même retrouver "AFRICA GLOBAL LOGISTICS COTE D'IVOIRE").
function normalizeName(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function nameMatchScore(typed: string, candidate: string): number {
  const wa = new Set(normalizeName(typed).split(' ').filter((w) => w.length > 2))
  const wb = new Set(normalizeName(candidate).split(' ').filter((w) => w.length > 2))
  if (wa.size === 0) return 0
  let common = 0
  wa.forEach((w) => {
    if (wb.has(w)) common++
  })
  return common / wa.size
}

function findBestCompanyMatch(stockName: string, companies: { ticker: string; full_name: string; short_name: string | null }[]) {
  let best: { ticker: string; full_name: string; short_name: string | null } | null = null
  let bestScore = 0
  for (const c of companies) {
    const s = Math.max(nameMatchScore(stockName, c.full_name), c.short_name ? nameMatchScore(stockName, c.short_name) : 0)
    if (s > bestScore) {
      bestScore = s
      best = c
    }
  }
  return bestScore >= 0.5 ? best : null
}

function LockedInline({ label = 'Pro' }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigate('/abonnement')
      }}
      className="inline-flex items-center gap-1 rounded-md font-extrabold"
      style={{ backgroundColor: '#1F1A0A', color: '#F5C842', border: '1px solid #F5C842', fontSize: 10, padding: '2px 7px' }}
    >
      <Lock size={9} /> {label}
    </button>
  )
}

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const [alert, setAlert] = useState<DbAlert | null>(null)
  const [company, setCompany] = useState<DbCompany | null>(null)
  const [resolvedTicker, setResolvedTicker] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [dayChange, setDayChange] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (cancelled || !data) {
          setLoading(false)
          return
        }
        const a = data as DbAlert
        setAlert(a)
        markAlertRead(a.id)

        let ticker = a.ticker
        if (!ticker) {
          // L'admin n'a pas (ou n'a pas pu) lier cette alerte à une fiche
          // entreprise au moment de la création — on tente de la retrouver
          // par similarité de nom pour ne pas laisser la page vide de
          // graphique/RSI.
          const { data: allCompanies } = await supabase.from('companies').select('ticker, full_name, short_name')
          const match = findBestCompanyMatch(a.stock_name, allCompanies ?? [])
          ticker = match?.ticker ?? null
        }

        if (ticker) {
          const [{ data: comp }, { data: cours }] = await Promise.all([
            supabase.from('companies').select('*').eq('ticker', ticker).maybeSingle(),
            supabase.from('brvm_cours').select('cours, variation_pct').eq('ticker', ticker).maybeSingle(),
          ])
          if (!cancelled) {
            setResolvedTicker(ticker)
            setCompany((comp as DbCompany) ?? null)
            setCurrentPrice(cours?.cours ?? null)
            setDayChange(cours?.variation_pct ?? null)
          }
        }
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const { history } = useStockHistory(resolvedTicker)
  const closes = history.map((h) => h.cours)
  const rsi = computeRSI(closes)
  const { saved, notify, toggleSaved, toggleNotify } = useAlertAction(alert?.id ?? null)

  if (loading) {
    return (
      <div className="min-h-screen p-5" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="h-8 w-40 rounded animate-pulse mb-4" style={{ backgroundColor: '#111118' }} />
        <div className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: '#111118' }} />
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#0A0A0F' }}>
        <p className="text-textSub text-sm">Alerte introuvable.</p>
        <button onClick={() => navigate('/alertes')} className="text-primary text-sm font-semibold">
          Retour aux alertes
        </button>
      </div>
    )
  }

  const isBuy = alert.type === 'achat'
  const accent = isBuy ? '#22C55E' : '#EF4444'
  const accentBg = isBuy ? '#052E16' : '#200A0A'
  const accentBorder = isBuy ? '#166534' : '#7F1D1D'

  // Points d'un sparkline SVG à partir des clôtures réelles.
  const w = 640
  const h = 130
  const pad = 4
  let pathPoints = ''
  if (closes.length > 1) {
    const mn = Math.min(...closes)
    const mx = Math.max(...closes)
    const range = mx - mn || 1
    pathPoints = closes
      .map((c, i) => {
        const x = pad + (i * (w - 2 * pad)) / (closes.length - 1)
        const y = pad + (1 - (c - mn) / range) * (h - 2 * pad)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const rsiLabel = rsi == null ? null : rsi >= 70 ? 'suracheté' : rsi <= 30 ? 'survendu' : 'neutre'
  const sector = alert.sector || company?.sector || null
  const riskLevel = alert.risk_level || computeRiskLevel(rsi, closes)
  const analysis = generateAnalysis(alert.stock_name, closes, rsi)
  const adminNote = parseContent(alert.content)
  const horizonLabel = alert.horizon === 'long' ? 'Long terme (6-12 mois)' : alert.horizon === 'court' ? 'Court terme (1-3 mois)' : null

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-textSub" aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-sm">Alerte et recommandation</h1>
        <Bell size={18} color="#8A8A9A" />
      </div>

      <div className="px-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
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
              <div>
                <p className="text-white font-extrabold text-[15px] leading-tight">{alert.stock_name}</p>
                {company?.full_name && <p className="text-textMuted text-[10px]">{company.full_name}</p>}
              </div>
            </div>
            {isPro ? (
              <span
                className="rounded-lg px-2 py-1 text-[10px] font-extrabold"
                style={{ backgroundColor: accentBg, color: accent, border: `1px solid ${accentBorder}` }}
              >
                {isBuy ? "OPPORTUNITÉ D'ACHAT" : 'SIGNAL DE VENTE'}
              </span>
            ) : (
              <LockedInline label="Signal verrouillé" />
            )}
          </div>

          {company?.description && <p className="text-textSub text-xs leading-relaxed mb-3">{company.description}</p>}

          <div className="grid grid-cols-2 gap-2 pt-2.5" style={{ borderTop: '1px solid #2A2A3A' }}>
            <Stat label="Type d'ordre" value={isPro ? (isBuy ? 'ACHAT' : 'VENTE') : <LockedInline />} color={isPro ? accent : undefined} />
            {alert.price_target != null && <Stat label="Cours limite" value={isPro ? formatPrice(alert.price_target) : <LockedInline />} />}
            {alert.horizon && <Stat label="Horizon" value={alert.horizon === 'long' ? 'Long terme' : 'Court terme'} />}
            {(() => {
              const p1 = pct(alert.objectif_1, alert.price_target)
              const p2 = pct(alert.objectif_2, alert.price_target)
              if (!p1 && !p2) return null
              const nums = [p1, p2].filter(Boolean).map((s) => parseFloat(s as string))
              const avg = nums.reduce((a, b) => a + b, 0) / nums.length
              return <Stat label="Potentiel moyen" value={`${avg > 0 ? '+' : ''}${avg.toFixed(1)}%`} color="#22C55E" />
            })()}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <p className="text-textMuted text-[10px] font-bold uppercase tracking-wide mb-1">Cours actuel (réel)</p>
          {currentPrice != null ? (
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white font-extrabold text-xl">{formatPrice(currentPrice)}</span>
              {dayChange != null && (
                <span className="text-xs font-extrabold" style={{ color: dayChange >= 0 ? '#22C55E' : '#EF4444' }}>
                  {dayChange >= 0 ? '+' : ''}
                  {dayChange.toFixed(2)}%
                </span>
              )}
            </div>
          ) : (
            <p className="text-textSub text-xs mb-3">Cours indisponible pour le moment.</p>
          )}

          {isPro ? (
            <>
              {closes.length > 1 ? (
                <>
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
                    <polyline points={pathPoints} fill="none" stroke="#F5C842" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
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
                <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid #2A2A3A' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-textSub text-[10px] font-bold uppercase tracking-wide">RSI (14) réel</span>
                    <span className="text-primary font-extrabold text-xs">
                      {rsi.toFixed(1)} · {rsiLabel}
                    </span>
                  </div>
                  <div className="relative h-2 rounded" style={{ backgroundColor: '#1A1A24' }}>
                    <div className="absolute top-0 bottom-0 rounded" style={{ left: '30%', width: '40%', backgroundColor: '#22C55E22' }} />
                    <div className="absolute rounded" style={{ left: `${rsi}%`, top: -3, width: 2, height: 14, backgroundColor: '#F5C842' }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <ProTeaser compact title="Graphique & RSI en temps réel" description="Passez à Pro pour voir l'historique de prix et le RSI réel de chaque valeur.">
              <div style={{ height: 110 }} />
            </ProTeaser>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <p className="text-textMuted text-[10px] font-bold uppercase tracking-wide mb-2.5">Détails de l'alerte</p>
          <DetailRow label="Actif" value={alert.stock_name} />
          {sector && <DetailRow label="Secteur" value={sector} />}
          {currentPrice != null && <DetailRow label="Cours actuel" value={formatPrice(currentPrice)} />}
          {alert.price_target != null && (
            <DetailRow label={`Cours limite (${isBuy ? 'achat' : 'vente'})`} value={isPro ? formatPrice(alert.price_target) : <LockedInline />} />
          )}
          {alert.objectif_1 != null && (
            <DetailRow
              label="Objectif 1"
              value={isPro ? `${formatPrice(alert.objectif_1)}${pct(alert.objectif_1, currentPrice) ? ` (${pct(alert.objectif_1, currentPrice)})` : ''}` : <LockedInline />}
              color={isPro ? '#22C55E' : undefined}
            />
          )}
          {alert.objectif_2 != null && (
            <DetailRow
              label="Objectif 2"
              value={isPro ? `${formatPrice(alert.objectif_2)}${pct(alert.objectif_2, currentPrice) ? ` (${pct(alert.objectif_2, currentPrice)})` : ''}` : <LockedInline />}
              color={isPro ? '#22C55E' : undefined}
            />
          )}
          {alert.stop_loss != null && (
            <DetailRow
              label="Stop loss"
              value={isPro ? `${formatPrice(alert.stop_loss)}${pct(alert.stop_loss, currentPrice) ? ` (${pct(alert.stop_loss, currentPrice)})` : ''}` : <LockedInline />}
              color={isPro ? '#EF4444' : undefined}
            />
          )}
          {(() => {
            const p1 = pct(alert.objectif_1, alert.price_target)
            const p2 = pct(alert.objectif_2, alert.price_target)
            if (!p1 && !p2) return null
            const nums = [p1, p2].filter(Boolean).map((s) => parseFloat(s as string))
            const avg = nums.reduce((a, b) => a + b, 0) / nums.length
            return <DetailRow label="Potentiel de gain moyen" value={`${avg > 0 ? '+' : ''}${avg.toFixed(1)}%`} color="#22C55E" />
          })()}
          {horizonLabel && <DetailRow label="Horizon recommandé" value={horizonLabel} />}
          {riskLevel && <DetailRow label="Niveau de risque" value={riskLevel} color="#F5C842" last />}
        </div>

        {isPro ? (
          (analysis || adminNote) && (
            <div className="rounded-2xl p-3 flex gap-2.5" style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}` }}>
              <Lightbulb size={16} color={accent} className="mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                {analysis && <p className="text-textSub text-xs leading-relaxed">{analysis}</p>}
                {adminNote && (
                  <p className="text-textSub text-xs leading-relaxed italic">
                    {analysis ? 'Note de l\u2019admin : ' : ''}
                    {adminNote}
                  </p>
                )}
              </div>
            </div>
          )
        ) : (
          <ProTeaser compact title="Analyse détaillée" description="Passez à Pro pour lire l'analyse complète de cette alerte.">
            <div style={{ height: 60 }} />
          </ProTeaser>
        )}

        <div className="flex gap-2">
          <button
            onClick={toggleSaved}
            className="flex-1 rounded-xl py-3 flex items-center justify-center gap-2 font-extrabold text-sm"
            style={{ border: '1px solid #2A2A3A', color: saved ? '#F5C842' : '#FFFFFF' }}
          >
            <Star size={15} fill={saved ? '#F5C842' : 'none'} /> {saved ? 'Sauvegardé' : 'Sauvegarder'}
          </button>
          <button
            onClick={toggleNotify}
            className="flex-1 rounded-xl py-3 flex items-center justify-center gap-2 font-extrabold text-sm"
            style={{ backgroundColor: notify ? '#22C55E' : '#F5C842', color: '#0A0A0F' }}
          >
            {notify ? (
              <>
                <Check size={15} /> Alerté
              </>
            ) : (
              <>
                <Bell size={15} /> Être alerté
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div>
      <p className="text-textMuted text-[9px] uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-extrabold text-[13px]" style={{ color: color ?? '#FFFFFF' }}>
        {value}
      </p>
    </div>
  )
}

function DetailRow({ label, value, color, last }: { label: string; value: ReactNode; color?: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={!last ? { borderBottom: '1px solid #1E1E2A' } : undefined}>
      <span className="text-textSub text-xs">{label}</span>
      <span className="text-xs font-bold" style={{ color: color ?? '#FFFFFF' }}>
        {value}
      </span>
    </div>
  )
}
