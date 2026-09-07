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
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2A3A' }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 820, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1F1A0A' }}>
                    {['', 'Valeur', 'Quantité', 'Prix de revient', 'Cours', 'Var. jour', 'Capital initial', 'Gain (FCFA)', 'Gain (%)'].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#F5C842', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const up = r.gainFcfa >= 0
                    const upDay = (r.variation_pct ?? 0) >= 0
                    return (
                      <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#111118' : '#0D0D13', borderTop: '1px solid #1E1E2A' }}>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setSellTarget(r)}
                            className="rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold tappable"
                            style={{ backgroundColor: '#EF4444', color: '#FFFFFF', whiteSpace: 'nowrap' }}
                          >
                            VENDRE
                          </button>
                        </td>
                        <td className="px-3 py-3 text-white text-xs font-bold" style={{ whiteSpace: 'nowrap' }}>{r.stock_name}</td>
                        <td className="px-3 py-3 text-textSub text-xs">{r.quantity}</td>
                        <td className="px-3 py-3 text-white text-xs font-semibold">{formatPrice(r.avg_buy_price)}</td>
                        <td className="px-3 py-3 text-white text-xs font-bold">{formatPrice(r.cours)}</td>
                        <td className="px-3 py-3 text-xs font-bold" style={{ color: upDay ? '#22C55E' : '#EF4444' }}>
                          {r.variation_pct != null ? `${upDay ? '+' : ''}${r.variation_pct.toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-3 py-3 text-textSub text-xs">{formatPrice(r.capitalInitial)}</td>
                        <td className="px-3 py-3 text-xs font-bold" style={{ color: up ? '#22C55E' : '#EF4444' }}>
                          {up ? '+' : ''}
                          {Math.round(r.gainFcfa).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-3 py-3 text-xs font-bold" style={{ color: up ? '#22C55E' : '#EF4444' }}>
                          {up ? '+' : ''}
                          {r.gainPct.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="rounded-2xl mt-4 overflow-hidden" style={{ border: '1px solid #2A2A3A' }}>
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
