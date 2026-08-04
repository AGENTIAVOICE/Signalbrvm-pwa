import { useState } from 'react'
import { Briefcase, TrendingUp, TrendingDown, ShieldCheck, Zap, CheckCircle2, XCircle, Archive, Wallet, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFollowedAlerts, type FollowedAlert } from '../hooks/useFollowedAlerts'
import { useProfilInvestisseur } from '../hooks/useProfilInvestisseur'
import { usePortfolioSimulator, type SimPosition } from '../hooks/usePortfolioSimulator'
import { useCurrencyFormat } from '../hooks/useCurrencyFormat'
import { RefreshButton } from '../components/RefreshButton'
import { getProfile, PROFILE_COLORS } from '../lib/profilInvestisseurData'
import { formatPrice } from '../lib/theme'

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
  const { pending, validated, closed, loading, refetch, validate, reject, closePosition, setTradeDecision } = useFollowedAlerts()
  const { result: quizResult, capital, updateCapital } = useProfilInvestisseur()
  const sim = usePortfolioSimulator()
  const { format } = useCurrencyFormat()

  const [capitalInput, setCapitalInput] = useState('')
  const [editingCapital, setEditingCapital] = useState(false)
  const [tradeTarget, setTradeTarget] = useState<{ alertId: string; ticker: string; stockName: string; sector: string | null; cours: number; side: 'buy' | 'sell' } | null>(null)

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

  const investedValue = sim.positions.reduce((sum, p) => sum + p.quantity * (p.cours ?? p.avg_buy_price), 0)
  const totalPnl = sim.positions.reduce((sum, p) => sum + p.quantity * ((p.cours ?? p.avg_buy_price) - p.avg_buy_price), 0)
  const totalValue = capital != null ? capital + investedValue : null

  // Valeurs "négociables" : celles validées comme suivies, avec un cours réel
  // connu, ET pas encore tranchées (achat/vente/observer) — une fois décidé,
  // ça sort de cette liste.
  // Filet de sécurité : même si trade_decision n'a pas été mis à jour pour
  // une raison quelconque, une valeur déjà détenue en position ne doit
  // jamais réapparaître comme "à décider" — la mémoire réelle des positions
  // prime toujours sur le simple statut de décision.
  const ownedTickers = new Set(sim.positions.filter((p) => p.quantity > 0).map((p) => p.ticker))
  const tradable = validated.filter((r) => r.alert.ticker && r.cours != null && r.trade_decision === 'pending' && !ownedTickers.has(r.alert.ticker!))

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Mon</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Portefeuille</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => { refetch(); sim.refetch() }} loading={loading} />
          <Briefcase size={22} color="#F5C842" />
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Capital & simulateur */}
        <section
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
        >
          <div
            className="absolute rounded-full"
            style={{ top: -60, right: -60, width: 160, height: 160, backgroundColor: '#F5C842', opacity: 0.06 }}
          />
          <div className="flex items-center gap-2 mb-1 relative">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 30, height: 30, backgroundColor: '#1F1A0A' }}>
              <Wallet size={15} color="#F5C842" />
            </div>
            <h3 className="text-white font-bold text-sm">Capital & simulation d'ordres</h3>
          </div>

          {editingCapital ? (
            <div className="flex items-center gap-2 mt-3 mb-1 relative">
              <input
                type="number"
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                placeholder="ex: 500000"
                className="flex-1 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
                autoFocus
              />
              <button
                onClick={async () => {
                  const n = Number(capitalInput)
                  if (Number.isFinite(n) && n > 0) await updateCapital(n)
                  setEditingCapital(false)
                }}
                className="rounded-xl px-4 py-2.5 text-xs font-extrabold"
                style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setCapitalInput(capital != null ? String(capital) : '')
                setEditingCapital(true)
              }}
              className="text-left mt-2 mb-1 relative"
            >
              <p className="text-textMuted text-[10px] uppercase tracking-wide">Capital disponible</p>
              <p className="font-extrabold text-2xl" style={{ color: capital != null ? '#F5C842' : '#F5C842' }}>
                {capital != null ? capital.toLocaleString('fr-FR') : '—'} <span className="text-sm font-bold text-textMuted">FCFA</span>
              </p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#F5C842' }}>
                {capital != null ? 'Modifier' : 'Renseigner mon capital global'}
              </p>
            </button>
          )}

          {capital != null && sim.positions.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl p-2.5" style={{ backgroundColor: '#1A1A24' }}>
                <p className="text-textMuted text-[10px] uppercase">Valeur totale</p>
                <p className="text-white font-extrabold text-sm">{totalValue != null ? format(totalValue) : '—'}</p>
              </div>
              <div className="rounded-xl p-2.5" style={{ backgroundColor: '#1A1A24' }}>
                <p className="text-textMuted text-[10px] uppercase">Gain / perte latent</p>
                <p className="font-extrabold text-sm" style={{ color: totalPnl >= 0 ? '#22C55E' : '#EF4444' }}>
                  {totalPnl >= 0 ? '+' : ''}
                  {format(Math.round(totalPnl))}
                </p>
              </div>
            </div>
          )}

          {tradable.length === 0 ? (
            <p className="text-textMuted text-xs">Ajoutez et validez des alertes pour pouvoir simuler un achat ou une vente sur ces valeurs.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tradable.map((r) => (
                <div key={r.alert.id} className="rounded-xl p-2.5" style={{ backgroundColor: '#1A1A24' }}>
                  <div className="mb-2">
                    <p className="text-white text-xs font-bold truncate">{r.alert.stock_name}</p>
                    <p className="text-primary text-[11px] font-semibold">{formatPrice(r.cours!)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTradeTarget({ alertId: r.alert.id, ticker: r.alert.ticker!, stockName: r.alert.stock_name, sector: r.alert.sector, cours: r.cours!, side: 'buy' })}
                      className="flex-1 rounded-lg py-1.5 text-[11px] font-bold"
                      style={{ backgroundColor: '#052E16', color: '#22C55E' }}
                    >
                      Acheter
                    </button>
                    <button
                      onClick={() => setTradeTarget({ alertId: r.alert.id, ticker: r.alert.ticker!, stockName: r.alert.stock_name, sector: r.alert.sector, cours: r.cours!, side: 'sell' })}
                      className="flex-1 rounded-lg py-1.5 text-[11px] font-bold"
                      style={{ backgroundColor: '#200A0A', color: '#EF4444' }}
                    >
                      Vendre
                    </button>
                    <button
                      onClick={() => setTradeDecision(r.alert.id, 'watching')}
                      className="flex-1 rounded-lg py-1.5 text-[11px] font-bold"
                      style={{ backgroundColor: '#1F1A0A', color: '#F5C842' }}
                    >
                      Observer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {sim.positions.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-2">Mes actions simulées ({sim.positions.length})</h3>
            <div className="flex flex-col gap-2">
              {sim.positions.map((p) => (
                <SimPositionCard key={p.id} position={p} onOpen={() => navigate(`/portefeuille/${p.ticker}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Allocation cible */}
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
            {exposedAmount == null && <p className="text-textMuted text-xs mt-2">Renseignez votre capital ci-dessus pour une estimation en FCFA.</p>}
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

      {tradeTarget && (
        <TradeModal
          target={tradeTarget}
          capital={capital}
          ownedQuantity={sim.positions.find((p) => p.ticker === tradeTarget.ticker)?.quantity ?? 0}
          onClose={() => setTradeTarget(null)}
          onBuy={async (amount) => {
            const qty = await sim.buy({ ticker: tradeTarget.ticker, stockName: tradeTarget.stockName, sector: tradeTarget.sector, amountFcfa: amount, cours: tradeTarget.cours })
            if (capital != null) await updateCapital(capital - qty * tradeTarget.cours)
            await setTradeDecision(tradeTarget.alertId, 'bought')
            setTradeTarget(null)
          }}
          onSell={async (quantity) => {
            const proceeds = await sim.sell({ ticker: tradeTarget.ticker, quantity, cours: tradeTarget.cours })
            if (capital != null) await updateCapital(capital + proceeds)
            await setTradeDecision(tradeTarget.alertId, 'sold')
            setTradeTarget(null)
          }}
        />
      )}
    </div>
  )
}

function SimPositionCard({ position, onOpen }: { position: SimPosition; onOpen: () => void }) {
  const cours = position.cours ?? position.avg_buy_price
  const pnl = position.quantity * (cours - position.avg_buy_price)
  const pnlPct = position.avg_buy_price > 0 ? ((cours - position.avg_buy_price) / position.avg_buy_price) * 100 : 0
  const up = pnl >= 0
  return (
    <button onClick={onOpen} className="w-full text-left rounded-xl p-3 tappable" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-white text-sm font-bold">{position.stock_name}</p>
        <span className="font-extrabold text-xs" style={{ color: up ? '#22C55E' : '#EF4444' }}>
          {up ? '+' : ''}
          {pnlPct.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-textMuted">
          {position.quantity} action{position.quantity > 1 ? 's' : ''} · PRU {formatPrice(position.avg_buy_price)}
        </span>
        <span className="font-bold" style={{ color: up ? '#22C55E' : '#EF4444' }}>
          {up ? '+' : ''}
          {Math.round(pnl).toLocaleString('fr-FR')} FCFA
        </span>
      </div>
    </button>
  )
}

function TradeModal({
  target,
  capital,
  ownedQuantity,
  onClose,
  onBuy,
  onSell,
}: {
  target: { ticker: string; stockName: string; cours: number; side: 'buy' | 'sell' }
  capital: number | null
  ownedQuantity: number
  onClose: () => void
  onBuy: (amountFcfa: number) => Promise<void>
  onSell: (quantity: number) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isBuy = target.side === 'buy'
  const estimatedQty = isBuy && amount ? Math.floor(Number(amount) / target.cours) : null

  async function submit() {
    setError('')
    setSubmitting(true)
    try {
      if (isBuy) {
        const n = Number(amount)
        if (!Number.isFinite(n) || n <= 0) throw new Error('Entrez un montant valide.')
        if (capital != null && n > capital) throw new Error(`Montant supérieur à votre capital disponible (${capital.toLocaleString('fr-FR')} FCFA).`)
        await onBuy(n)
      } else {
        const n = Number(quantity)
        if (!Number.isFinite(n) || n <= 0) throw new Error('Entrez une quantité valide.')
        if (n > ownedQuantity) throw new Error(`Vous ne détenez que ${ownedQuantity} action(s).`)
        await onSell(n)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sheet-backdrop-transition" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 sheet-transition" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-extrabold text-base">
            {isBuy ? 'Acheter' : 'Vendre'} — {target.stockName}
          </h3>
          <button onClick={onClose} aria-label="Fermer">
            <X size={20} color="#8A8A9A" />
          </button>
        </div>

        <p className="text-textSub text-xs mb-3">
          Cours actuel réel : <span className="text-primary font-bold">{formatPrice(target.cours)}</span>
        </p>

        {isBuy ? (
          <>
            <p className="text-textMuted text-xs mb-1.5">Montant à investir (FCFA)</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ex: 100000"
              className="w-full rounded-xl px-3 py-3 text-white text-sm outline-none mb-1.5"
              style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
              autoFocus
            />
            {estimatedQty != null && estimatedQty > 0 && (
              <p className="text-textSub text-xs mb-3">
                ≈ {estimatedQty} action{estimatedQty > 1 ? 's' : ''} ({formatPrice(estimatedQty * target.cours)})
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-textMuted text-xs mb-1.5">Nombre d'actions à vendre (vous en détenez {ownedQuantity})</p>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`max ${ownedQuantity}`}
              className="w-full rounded-xl px-3 py-3 text-white text-sm outline-none mb-1.5"
              style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
              autoFocus
            />
            {quantity && Number(quantity) > 0 && (
              <p className="text-textSub text-xs mb-3">≈ {formatPrice(Number(quantity) * target.cours)}</p>
            )}
          </>
        )}

        {error && <p className="text-sell text-xs mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-40"
          style={{ backgroundColor: isBuy ? '#22C55E' : '#EF4444', color: '#0A0A0F' }}
        >
          {submitting ? 'Traitement…' : isBuy ? 'Confirmer l\u2019achat' : 'Confirmer la vente'}
        </button>
      </div>
    </div>
  )
}

function PendingCard({ row, onValidate, onReject, onOpen }: { row: FollowedAlert; onValidate: () => void; onReject: () => void; onOpen: () => void }) {
  const { alert } = row
  return (
    <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <button onClick={onOpen} className="flex items-center gap-2 flex-1 text-left min-w-0 tappable">
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
      <button onClick={onOpen} className="flex items-center gap-2 flex-1 text-left min-w-0 tappable">
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
