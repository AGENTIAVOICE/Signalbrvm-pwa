import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Crown, Check, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Plan {
  key: string
  name: string
  months: number
  price: number
  barePrice?: number
  perMonth?: string
  url: string
  highlighted?: boolean
}

// Un lien Chariow par formule — remplacer les URL "à créer" une fois les
// produits correspondants créés sur Chariow.
const PLANS: Plan[] = [
  { key: 'decouverte', name: 'Découverte', months: 1, price: 50000, url: 'https://xfhlbaph.mychariow.shop/prd_l924y2px' },
  { key: 'croissance', name: 'Croissance', months: 3, price: 130000, barePrice: 150000, perMonth: '≈ 43 333 FCFA / mois', url: 'https://xfhlbaph.mychariow.shop/PRODUIT-CROISSANCE-A-CREER' },
  { key: 'performance', name: 'Performance', months: 6, price: 250000, barePrice: 300000, perMonth: '≈ 41 667 FCFA / mois', url: 'https://xfhlbaph.mychariow.shop/PRODUIT-PERFORMANCE-A-CREER', highlighted: true },
  { key: 'elite', name: 'Élite', months: 12, price: 400000, barePrice: 600000, perMonth: '≈ 33 333 FCFA / mois — le meilleur tarif', url: 'https://xfhlbaph.mychariow.shop/PRODUIT-ELITE-A-CREER' },
]

// Vocabulaire volontairement prudent : SignalBrvm est présenté comme un
// outil d'information et d'analyse de marché, jamais comme un service de
// "signaux de trading" — certaines plateformes de paiement (dont Chariow)
// assimilent ce dernier terme à un service financier réglementé.
const FEATURES = [
  'Suivi en temps réel des 47 valeurs cotées à la BRVM, par secteur',
  'Analyses de marché détaillées, basées sur des données réelles',
  'Graphiques et indicateurs techniques (RSI) réels sur chaque valeur',
  'Simulateur de portefeuille éducatif, sans risque',
  'Alertes sur les mouvements notables du marché',
  'Allocation intelligente selon votre profil de risque',
]

export default function Abonnement() {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const [selected, setSelected] = useState(PLANS[2].key)

  function close() {
    navigate('/profil')
  }

  function pay() {
    const plan = PLANS.find((p) => p.key === selected)
    if (plan) window.open(plan.url, '_blank', 'noopener,noreferrer')
  }

  if (isPro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: '#0A0A0F' }}>
        <Crown size={40} color="#F5C842" className="mb-4" />
        <p className="text-white font-bold">Vous êtes déjà Pro 🎉</p>
        <button onClick={close} className="text-primary text-sm mt-4 font-semibold">
          Retour au profil
        </button>
      </div>
    )
  }

  const activePlan = PLANS.find((p) => p.key === selected)!

  return (
    <div className="min-h-screen pb-6" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
        <h2 className="text-white font-bold text-lg">Passer à Pro</h2>
        <button onClick={close} className="text-textSub">
          <X size={22} />
        </button>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        <p className="text-textSub text-xs leading-relaxed -mt-2">
          Même contenu Pro pour les 4 formules — seule la durée change. Plus vous vous engagez longtemps, moins ça
          coûte par mois.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {PLANS.map((p) => {
            const active = selected === p.key
            return (
              <button
                key={p.key}
                onClick={() => setSelected(p.key)}
                className="rounded-2xl p-3.5 text-left relative tappable"
                style={{ backgroundColor: active ? '#1F1A0A' : '#111118', border: active ? '1.5px solid #F5C842' : '1px solid #2A2A3A' }}
              >
                {p.highlighted && (
                  <span
                    className="absolute -top-2 right-3 rounded-full font-extrabold uppercase"
                    style={{ backgroundColor: '#F5C842', color: '#0A0A0F', fontSize: 8.5, padding: '2px 7px', letterSpacing: 0.3 }}
                  >
                    Populaire
                  </span>
                )}
                <p className="text-white font-extrabold text-sm mb-0.5">{p.name}</p>
                <p className="text-textMuted text-[10px] mb-2">{p.months} mois</p>
                {p.barePrice && (
                  <p className="text-textMuted text-[10px] mb-0" style={{ textDecoration: 'line-through' }}>
                    {p.barePrice.toLocaleString('fr-FR')} FCFA
                  </p>
                )}
                <p className="font-extrabold text-base" style={{ color: active ? '#F5C842' : '#FFFFFF' }}>
                  {p.price.toLocaleString('fr-FR')} FCFA
                </p>
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <p className="text-white font-bold text-sm mb-3">Inclus dans toutes les formules</p>
          <div className="flex flex-col gap-2.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <Check size={16} color="#22C55E" className="flex-shrink-0" />
                <span className="text-white text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={pay}
          className="w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
        >
          <ExternalLink size={18} /> Payer {activePlan.price.toLocaleString('fr-FR')} FCFA — {activePlan.name}
        </button>

        <p className="text-textMuted text-xs text-center leading-relaxed">
          Le paiement s'effectue sur une page sécurisée Chariow (carte bancaire ou mobile money). Après confirmation de
          votre paiement, votre accès Pro est activé manuellement par un administrateur — généralement sous 24h.
          SignalBrvm est un outil d'information et d'analyse à visée éducative ; il ne constitue pas un conseil en
          investissement personnalisé.
        </p>
      </div>
    </div>
  )
}
