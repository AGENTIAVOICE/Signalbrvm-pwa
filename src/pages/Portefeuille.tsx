import { useMemo, useState } from 'react'
import { Briefcase, TrendingUp, TrendingDown, ShieldCheck, Zap, CheckCircle2, XCircle, Archive } from 'lucide-react'
import { useAlerts } from '../hooks/useData'
import { useAlertValidations } from '../hooks/useAlertValidations'
import { useCurrencyFormat } from '../hooks/useCurrencyFormat'
import { RefreshButton } from '../components/RefreshButton'
import type { DbAlert } from '../lib/supabase'

type RiskProfile = 'Conservateur' | 'Équilibré' | 'Dynamique'

const PROFILE_ALLOCATION: Record<RiskProfile, { actions: number; obligations: number; liquidites: number }> = {
  Conservateur: { actions: 35, obligations: 45, liquidites: 20 },
  'Équilibré': { actions: 60, obligations: 25, liquidites: 15 },
  Dynamique: { actions: 80, obligations: 12, liquidites: 8 },
}

function analyzePortfolio(profile: RiskProfile, capital: number | null, positions: { type: string }[]) {
  const target = PROFILE_ALLOCATION[profile]
  const allocations = [
    { label: 'Actions', percent: target.actions, color: '#F5C842', amount: capital != null ? Math.round((capital * target.actions) / 100) : null },
    { label: 'Obligations', percent: target.obligations, color: '#3B82F6', amount: capital != null ? Math.round((capital * target.obligations) / 100) : null },
    { label: 'Liquidités', percent: target.liquidites, color: '#22C55E', amount: capital != null ? Math.round((capital * target.liquidites) / 100) : null },
  ]
  const exposedAmount = capital != null ? Math.round((capital * target.actions) / 100) : null
  const lossAmount = exposedAmount != null ? Math.round(exposedAmount * 0.1) : null
  const portfolioAfter = capital != null && lossAmount != null ? capital - lossAmount : null
  const severity = target.actions >= 75 ? 'Élevé' : target.actions >= 50 ? 'Modéré' : 'Faible'

  const buys = positions.filter((p) => p.type === 'achat').length
  const sells = positions.filter((p) => p.type === 'vente').length
  const total = buys + sells

  let headline = 'Portefeuille équilibré'
  let advice = 'Vos positions sont réparties. Conservez votre allocation cible.'
  let tone: 'good' | 'warn' | 'neutral' = 'good'

  if (total === 0) {
    headline = 'Aucune position suivie'
    advice = 'Validez des alertes pour générer une recommandation de rééquilibrage personnalisée.'
    tone = 'neutral'
  } else if (buys > 0 && sells === 0) {
    headline = `${buys} position${buys > 1 ? 's' : ''} d'achat, aucune vente`
    advice = `Votre exposition aux actions augmente. Gardez au moins ${target.liquidites}% de liquidités pour saisir les prochaines opportunités.`
    tone = 'warn'
  } else if (sells > 0 && buys === 0) {
    headline = `${sells} vente${sells > 1 ? 's' : ''}, aucun achat`
    advice = `Vous allégez vos positions. Réinvestissez progressivement vers la cible de ${target.actions}% d'actions.`
    tone = 'warn'
  } else {
    const ratio = buys / total
    if (ratio > 0.7) {
      headline = `Biais acheteur (${buys} achats / ${sells} ventes)`
      advice = `Portefeuille orienté à la hausse. Sécurisez une partie des gains et maintenez ${target.liquidites}% de liquidités.`
      tone = 'warn'
    } else if (ratio < 0.3) {
      headline = `Biais vendeur (${buys} achats / ${sells} ventes)`
      advice = `Vous réduisez le risque. Visez progressivement la cible de ${target.actions}% d'actions.`
      tone = 'warn'
    } else {
      headline = `Équilibré (${buys} achats / ${sells} ventes)`
      advice = `Bon arbitrage achats / ventes. Conservez votre allocation cible ${target.actions}/${target.obligations}/${target.liquidites}.`
      tone = 'good'
    }
  }

  return {
    allocations,
    stress: { exposedAmount, lossAmount, portfolioAfter, severity },
    rebalance: { buys, sells, headline, advice, tone },
  }
}

function AllocationRing({ allocations }: { allocations: { color: string; percent: number }[] }) {
  const a = allocations
  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <div
        className="rounded-full"
        style={{
          width: 80,
          height: 80,
          border: '16px solid',
          borderColor: `${a[0].color} ${a[0].color} ${a[2].color} ${a[1].color}`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-extrabold text-sm">{a[0].percent}%</span>
      </div>
    </div>
  )
}

export default function Portefeuille() {
  const { alerts, loading, refetch } = useAlerts()
  const { validatedAlerts, closedAlerts, actionedIds, act } = useAlertValidations()
  const { format } = useCurrencyFormat()
  const [profile] = useState<RiskProfile>('Équilibré')
  const [capital] = useState<number | null>(null)

  const analysis = useMemo(() => analyzePortfolio(profile, capital, validatedAlerts), [profile, capital, validatedAlerts])
  const pending = useMemo(() => alerts.filter((a) => !actionedIds.has(a.id)), [alerts, actionedIds])

  const toneColor = { good: '#22C55E', warn: '#F5C842', neutral: '#94A3B8' }[analysis.rebalance.tone]

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Mon</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Portefeuille</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={refetch} loading={loading} />
          <Briefcase size={22} color="#F5C842" />
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Allocation cible */}
        <section className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <h3 className="text-white font-bold text-sm mb-3">Allocation cible — Profil {profile}</h3>
          <div className="flex items-center gap-4">
            <AllocationRing allocations={analysis.allocations} />
            <div className="flex-1 flex flex-col gap-2">
              {analysis.allocations.map((a) => (
                <div key={a.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: a.color }} />
                    <span className="text-textSub">{a.label}</span>
                  </span>
                  <span className="text-white font-semibold">{a.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stress test */}
        <section className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
            <ShieldCheck size={16} color="#F5C842" /> Test de résistance (-10% BRVM)
          </h3>
          <p className="text-textSub text-xs leading-relaxed">
            Sévérité estimée :{' '}
            <span style={{ color: analysis.stress.severity === 'Élevé' ? '#EF4444' : analysis.stress.severity === 'Modéré' ? '#F5C842' : '#22C55E' }} className="font-bold">
              {analysis.stress.severity}
            </span>
            {analysis.stress.lossAmount != null && (
              <>
                {' '}— perte potentielle estimée à <span className="text-white font-semibold">{format(analysis.stress.lossAmount)}</span>
              </>
            )}
          </p>
          {analysis.stress.exposedAmount == null && (
            <p className="text-textMuted text-xs mt-2">Renseignez votre capital dans votre profil pour une estimation en FCFA.</p>
          )}
        </section>

        {/* Rééquilibrage */}
        <section className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: `1px solid ${toneColor}44` }}>
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: toneColor }}>
            <Zap size={16} /> {analysis.rebalance.headline}
          </h3>
          <p className="text-textSub text-xs leading-relaxed">{analysis.rebalance.advice}</p>
        </section>

        {/* Alertes à valider */}
        {pending.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-2">À valider ({pending.length})</h3>
            <div className="flex flex-col gap-2">
              {pending.map((a) => (
                <PendingCard key={a.id} alert={a} onAct={act} />
              ))}
            </div>
          </section>
        )}

        {/* Positions suivies */}
        <section>
          <h3 className="text-white font-bold text-sm mb-2">Positions suivies ({validatedAlerts.length})</h3>
          {validatedAlerts.length === 0 ? (
            <p className="text-textMuted text-xs">Aucune position validée pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {validatedAlerts.map((a) => (
                <div key={a.id} className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
                  <div className="flex items-center gap-2">
                    {a.type === 'achat' ? <TrendingUp size={16} color="#22C55E" /> : <TrendingDown size={16} color="#EF4444" />}
                    <span className="text-white text-sm font-semibold">{a.stock_name}</span>
                  </div>
                  <Archive size={14} color="#4A4A5A" />
                </div>
              ))}
            </div>
          )}
        </section>

        {closedAlerts.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-2">Historique ({closedAlerts.length})</h3>
            <div className="flex flex-col gap-2 opacity-60">
              {closedAlerts.map((a) => (
                <div key={a.id} className="rounded-xl p-3" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
                  <span className="text-white text-sm">{a.stock_name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PendingCard({ alert, onAct }: { alert: DbAlert; onAct: (a: DbAlert, action: 'validated' | 'rejected') => void }) {
  return (
    <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <div className="flex items-center gap-2">
        {alert.type === 'achat' ? <TrendingUp size={16} color="#22C55E" /> : <TrendingDown size={16} color="#EF4444" />}
        <span className="text-white text-sm font-semibold">{alert.stock_name}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onAct(alert, 'rejected')} aria-label="Rejeter">
          <XCircle size={20} color="#EF4444" />
        </button>
        <button onClick={() => onAct(alert, 'validated')} aria-label="Valider">
          <CheckCircle2 size={20} color="#22C55E" />
        </button>
      </div>
    </div>
  )
}
