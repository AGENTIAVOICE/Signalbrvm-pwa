import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { usePortfolioSimulator, type SimPosition } from '../hooks/usePortfolioSimulator'
import { useProfilInvestisseur } from '../hooks/useProfilInvestisseur'
import { useCurrencyFormat } from '../hooks/useCurrencyFormat'
import { formatPrice } from '../lib/theme'

// Récapitulatif de toutes les positions ouvertes (achats/ventes simulés),
// dans un seul tableau — mêmes données réelles que le simulateur du
// Portefeuille, juste présentées façon "relevé de compte".
export default function PortfolioRecap() {
  const navigate = useNavigate()
  const sim = usePortfolioSimulator()
  const { capital, updateCapital } = useProfilInvestisseur()
  const { format } = useCurrencyFormat()
  const [sellTarget, setSellTarget] = useState<SimPosition | null>(null)
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const rows = sim.positions.map((p) => {
    const cours = p.cours ?? p.avg_buy_price
    const capitalInitial = p.quantity * p.avg_buy_price
    const valeurActuelle = p.quantity * cours
    const gainFcfa = valeurActuelle - capitalInitial
    const gainPct = capitalInitial > 0 ? (gainFcfa / capitalInitial) * 100 : 0
    return { ...p, cours, capitalInitial, valeurActuelle, gainFcfa, gainPct }
  })

  const titres = rows.reduce((sum, r) => sum + r.valeurActuelle, 0)
  const titresGain = rows.reduce((sum, r) => sum + r.gainFcfa, 0)
  const liquidites = capital ?? 0
  const totaux = titres + liquidites

  async function handleSell() {
    if (!sellTarget) return
    setError('')
    setSubmitting(true)
    try {
      const n = Number(quantity)
      if (!Number.isFinite(n) || n <= 0) throw new Error('Entrez une quantité valide.')
      if (n > sellTarget.quantity) throw new Error(`Vous ne détenez que ${sellTarget.quantity} action(s).`)
      const cours = sellTarget.cours ?? sellTarget.avg_buy_price
      const proceeds = await sim.sell({ ticker: sellTarget.ticker, quantity: n, cours })
      if (capital != null) await updateCapital(capital + proceeds)
      setSellTarget(null)
      setQuantity('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-textSub" aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-sm">Actions recommandées — récapitulatif</h1>
        <div style={{ width: 20 }} />
      </div>

      <div className="px-4">
        {rows.length === 0 ? (
          <p className="text-textMuted text-sm text-center py-10">
            Aucune position pour le moment — achetez une valeur depuis Marché ou Portefeuille pour la voir apparaître ici.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((r) => {
              const up = r.gainFcfa >= 0
              const upDay = (r.variation_pct ?? 0) >= 0
              return (
                <div key={r.id} className="rounded-2xl p-3.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="min-w-0 pr-2">
                      <p className="text-white font-bold text-sm truncate">{r.stock_name}</p>
                      <p className="text-textMuted text-[11px]">
                        {r.quantity} action{r.quantity > 1 ? 's' : ''} · CMP {formatPrice(r.avg_buy_price)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSellTarget(r)}
                      className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold shrink-0 tappable"
                      style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                    >
                      Vendre
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <p className="text-textMuted text-[9px] uppercase tracking-wide mb-0.5">Cours actuel</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-extrabold text-base">{formatPrice(r.cours)}</span>
                        <span className="text-[11px] font-bold" style={{ color: upDay ? '#22C55E' : '#EF4444' }}>
                          {r.variation_pct != null ? `${upDay ? '+' : ''}${r.variation_pct.toFixed(2)}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-textMuted text-[9px] uppercase tracking-wide mb-0.5">Gain</p>
                      <p className="font-extrabold text-base" style={{ color: up ? '#22C55E' : '#EF4444' }}>
                        {up ? '+' : ''}
                        {r.gainPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid #1E1E2A' }}>
                    <div>
                      <p className="text-textMuted text-[9px] uppercase tracking-wide mb-0.5">Capital initial</p>
                      <p className="text-textSub text-xs font-semibold">{formatPrice(r.capitalInitial)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-textMuted text-[9px] uppercase tracking-wide mb-0.5">Gain (FCFA)</p>
                      <p className="text-xs font-extrabold" style={{ color: up ? '#22C55E' : '#EF4444' }}>
                        {up ? '+' : ''}
                        {Math.round(r.gainFcfa).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-5">
            <p className="text-textMuted text-[11px] font-bold uppercase tracking-wide mb-2 px-1">Résumé</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2A3A' }}>
              <SummaryRow label="Titres" value={format(titres)} extra={`${titresGain >= 0 ? '+' : ''}${Math.round(titresGain).toLocaleString('fr-FR')}`} extraColor={titresGain >= 0 ? '#22C55E' : '#EF4444'} />
              <SummaryRow label="Liquidités" value={capital != null ? format(liquidites) : '—'} />
              <SummaryRow
                label="Totaux"
                value={format(totaux)}
                extra={`${titresGain >= 0 ? '+' : ''}${Math.round(titresGain).toLocaleString('fr-FR')}`}
                extraColor={titresGain >= 0 ? '#22C55E' : '#EF4444'}
                bold
                last
              />
            </div>
          </div>
        )}
      </div>

      {sellTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setSellTarget(null)}>
          <div className="w-full rounded-t-3xl p-5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-extrabold text-base">Vendre — {sellTarget.stock_name}</h3>
              <button onClick={() => setSellTarget(null)} aria-label="Fermer">
                <X size={20} color="#8A8A9A" />
              </button>
            </div>
            <p className="text-textSub text-xs mb-3">
              Cours actuel réel : <span className="text-primary font-bold">{formatPrice(sellTarget.cours ?? sellTarget.avg_buy_price)}</span>
            </p>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Quantité (max ${sellTarget.quantity})`}
              className="w-full rounded-xl px-3 py-3 text-white text-sm outline-none mb-3"
              style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
              autoFocus
            />
            {error && <p className="text-sell text-xs mb-3">{error}</p>}
            <button
              onClick={handleSell}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-40"
              style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
            >
              {submitting ? 'Traitement…' : 'Confirmer la vente'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, extra, extraColor, bold, last }: { label: string; value: string; extra?: string; extraColor?: string; bold?: boolean; last?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: bold ? '#1A1A24' : '#111118', borderBottom: last ? undefined : '1px solid #1E1E2A' }}>
      <span className={`text-textSub text-xs ${bold ? 'font-extrabold text-white' : ''}`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${bold ? 'font-extrabold' : 'font-bold'}`} style={{ color: bold ? '#FFFFFF' : '#FFFFFF' }}>
          {value}
        </span>
        {extra && (
          <span className="text-xs font-extrabold" style={{ color: extraColor }}>
            {extra}
          </span>
        )}
      </div>
    </div>
  )
}
