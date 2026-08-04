import { Briefcase, TrendingUp, TrendingDown, ShieldCheck, Zap, CheckCircle2, XCircle, Archive } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFollowedAlerts, type FollowedAlert } from '../hooks/useFollowedAlerts'
import { useProfilInvestisseur } from '../hooks/useProfilInvestisseur'
import { useCurrencyFormat } from '../hooks/useCurrencyFormat'
import { RefreshButton } from '../components/RefreshButton'
import { getProfile, PROFILE_COLORS } from '../lib/profilInvestisseurData'
import { formatPrice } from '../lib/theme'

// Allocation cible numérique par profil — cohérente avec la tolérance et
// l'horizon déjà définis dans le quiz profil investisseur (profilInvestisseurData.ts),
// juste traduite en pourcentages actions/obligations/liquidités exploitables ici.
const ALLOCATION_BY_KEY: Record<string, { actions: number; obligations: number; liquidites: number }> = {
  securitaire: { actions: 10, obligations: 60, liquidites: 30 },
  prudent: { actions: 25, obligations: 55, liquidites: 20 },
  equilibre: { actions: 50, obligations: 35, liquidites: 15 },
  dynamique: { actions: 70, obligations: 20, liquidites: 10 },
  agressif: { actions: 85, obligations: 10, liquidites: 5 },
}

function AllocationRing({ allocations }: { allocations: { color: string; percent: number }[] }) {
  const a = allocations
  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <div
        className="rounded-full"
        style={{ width: 80, height: 80, border: '16px solid', borderColor: `${a[0].color} ${a[0].color} ${a[2].color} ${a[1].color}` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-extrabold text-sm">{a[0].percent}%</span>
      </div>
    </div>
  )
}

export default function Portefeuille() {
  const navigate = useNavigate()
  const { pending, validated, closed, loading, refetch, validate, reject, closePosition } = useFollowedAlerts()
  const { result: quizResult, capital } = useProfilInvestisseur()
  const { format } = useCurrencyFormat()

  const profile = quizResult ? getProfile(quizResult.score) : null
  const target = profile ? ALLOCATION_BY_KEY[profile.key] ?? ALLOCATION_BY_KEY.equilibre : null
  const profileColor = profile ? PROFILE_COLORS[profile.key] ?? '#F5C842' : '#F5C842'

  const allocations = target
    ? [
        { label: 'Actions', percent: target.actions, color: '#F5C842', amount: capital != null ? Math.round((capital * target.actions) / 100) : null },
        { label: 'Obligations', percent: target.obligations, color: '#3B82F6', amount: capital != null ? Math.round((capital * target.obligations) / 100) : null },
        { label: 'Liquidités', percent: target.liquidites, color: '#22C55E', amount: capital != null ? Math.round((capital * target.liquidites) / 100) : null },
      ]
    : null

  const exposedAmount = target && capital != null ? Math.round((capital * target.actions) / 100) : null
  const lossAmount = exposedAmount != null ? Math.round(exposedAmount * 0.1) : null
  const severity = target ? (target.actions >= 65 ? 'Élevé' : target.actions >= 40 ? 'Modéré' : 'Faible') : null

  const buys = validated.filter((r) => r.alert.type === 'achat').length
  const sells = validated.filter((r) => r.alert.type === 'vente').length
  const totalPositions = buys + sells

  let headline = 'Aucune position suivie'
  let advice = "Ajoutez des alertes au suivi (bouton « Ajouter au suivi ») pour construire votre portefeuille."
  let tone: 'good' | 'warn' | 'neutral' = 'neutral'

  if (totalPositions > 0 && target) {
    const ratio = buys / totalPositions
    if (ratio > 0.7) {
      headline = `Biais acheteur (${buys} achat${buys > 1 ? 's' : ''} / ${sells} vente${sells > 1 ? 's' : ''})`
      advice = `Votre exposition aux actions augmente. Gardez au moins ${target.liquidites}% de liquidités, cohérent avec votre profil ${profile?.label ?? ''}.`
      tone = 'warn'
    } else if (ratio < 0.3 && sells > 0) {
      headline = `Biais vendeur (${buys} achat${buys > 1 ? 's' : ''} / ${sells} vente${sells > 1 ? 's' : ''})`
      advice = `Vous allégez vos positions. Votre profil ${profile?.label ?? ''} vise ${target.actions}% d'actions à terme.`
      tone = 'warn'
    } else {
      headline = `Équilibré (${buys} achat${buys > 1 ? 's' : ''} / ${sells} vente${sells > 1 ? 's' : ''})`
      advice = `Bon arbitrage achats / ventes, cohérent avec l'allocation cible ${target.actions}/${target.obligations}/${target.liquidites} de votre profil.`
      tone = 'good'
    }
  }
  const toneColor = { good: '#22C55E', warn: '#F5C842', neutral: '#94A3B8' }[tone]

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
        {!profile ? (
          <button
            onClick={() => navigate('/profil-investisseur')}
            className="w-full rounded-2xl p-4 text-left"
            style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
          >
            <p className="text-white font-bold text-sm mb-1">Déterminez votre profil de risque</p>
            <p className="text-textSub text-xs">Nécessaire pour calculer une allocation cible personnalisée.</p>
          </button>
        ) : (
          <section className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <h3 className="text-white font-bold text-sm mb-3">Allocation cible — Profil {profile.label}</h3>
            <div className="flex items-center gap-4">
              <AllocationRing allocations={allocations!} />
              <div className="flex-1 flex flex-col gap-2">
                {allocations!.map((a) => (
                  <div key={a.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: a.color }} />
                      <span className="text-textSub">{a.label}</span>
                    </span>
                    <span className="text-white font-semibold">
                      {a.percent}% {a.amount != null && <span className="text-textMuted">· {format(a.amount)}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {capital == null && (
              <button onClick={() => navigate('/profil')} className="text-xs font-semibold mt-3" style={{ color: profileColor }}>
                Renseigner mon capital pour voir les montants en FCFA
              </button>
            )}
          </section>
        )}

        {profile && (
          <section className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
              <ShieldCheck size={16} color="#F5C842" /> Test de résistance (-10% BRVM)
            </h3>
            <p className="text-textSub text-xs leading-relaxed">
              Sévérité estimée :{' '}
              <span style={{ color: severity === 'Élevé' ? '#EF4444' : severity === 'Modéré' ? '#F5C842' : '#22C55E' }} className="font-bold">
                {severity}
              </span>
              {lossAmount != null && (
                <>
                  {' '}— perte potentielle estimée à <span className="text-white font-semibold">{format(lossAmount)}</span>
                </>
              )}
            </p>
            {exposedAmount == null && <p className="text-textMuted text-xs mt-2">Renseignez votre capital dans votre profil pour une estimation en FCFA.</p>}
          </section>
        )}

        {profile && (
          <section className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: `1px solid ${toneColor}44` }}>
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: toneColor }}>
              <Zap size={16} /> {headline}
            </h3>
            <p className="text-textSub text-xs leading-relaxed">{advice}</p>
          </section>
        )}

        {pending.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-2">À valider ({pending.length})</h3>
            <div className="flex flex-col gap-2">
              {pending.map((r) => (
                <PendingCard key={r.alert.id} row={r} onValidate={() => validate(r.alert.id)} onReject={() => reject(r.alert.id)} onOpen={() => navigate(`/alertes/${r.alert.id}`)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-white font-bold text-sm mb-2">Positions suivies ({validated.length})</h3>
          {validated.length === 0 ? (
            <p className="text-textMuted text-xs">
              Aucune position validée pour le moment.{' '}
              <button onClick={() => navigate('/alertes')} className="font-semibold" style={{ color: profileColor }}>
                Voir les alertes
              </button>
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {validated.map((r) => (
                <PositionCard key={r.alert.id} row={r} onOpen={() => navigate(`/alertes/${r.alert.id}`)} onClose={() => closePosition(r.alert.id)} />
              ))}
            </div>
          )}
        </section>

        {closed.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-2">Historique ({closed.length})</h3>
            <div className="flex flex-col gap-2 opacity-60">
              {closed.map((r) => (
                <div key={r.alert.id} className="rounded-xl p-3" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
                  <span className="text-white text-sm">{r.alert.stock_name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PendingCard({ row, onValidate, onReject, onOpen }: { row: FollowedAlert; onValidate: () => void; onReject: () => void; onOpen: () => void }) {
  const { alert } = row
  return (
    <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <button onClick={onOpen} className="flex items-center gap-2 flex-1 text-left min-w-0">
        {alert.type === 'achat' ? <TrendingUp size={16} color="#22C55E" className="shrink-0" /> : <TrendingDown size={16} color="#EF4444" className="shrink-0" />}
        <span className="text-white text-sm font-semibold truncate">{alert.stock_name}</span>
      </button>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={onReject} aria-label="Rejeter">
          <XCircle size={20} color="#EF4444" />
        </button>
        <button onClick={onValidate} aria-label="Valider">
          <CheckCircle2 size={20} color="#22C55E" />
        </button>
      </div>
    </div>
  )
}

function PositionCard({ row, onOpen, onClose }: { row: FollowedAlert; onOpen: () => void; onClose: () => void }) {
  const { alert, cours, variation_pct } = row
  return (
    <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <button onClick={onOpen} className="flex items-center gap-2 flex-1 text-left min-w-0">
        {alert.type === 'achat' ? <TrendingUp size={16} color="#22C55E" className="shrink-0" /> : <TrendingDown size={16} color="#EF4444" className="shrink-0" />}
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{alert.stock_name}</p>
          {cours != null ? (
            <p className="text-[11px] flex items-center gap-1.5">
              <span className="text-textMuted">{formatPrice(cours)}</span>
              {variation_pct != null && (
                <span className="font-bold" style={{ color: variation_pct >= 0 ? '#22C55E' : '#EF4444' }}>
                  {variation_pct >= 0 ? '+' : ''}
                  {variation_pct.toFixed(2)}%
                </span>
              )}
            </p>
          ) : (
            <p className="text-[11px] text-textMuted">Cours indisponible</p>
          )}
        </div>
      </button>
      <button onClick={onClose} aria-label="Clôturer la position" className="shrink-0 ml-2">
        <Archive size={14} color="#4A4A5A" />
      </button>
    </div>
  )
}
