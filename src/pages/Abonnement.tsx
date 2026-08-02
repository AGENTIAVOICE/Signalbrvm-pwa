import { useNavigate } from 'react-router-dom'
import { X, Crown, Check, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CHARIOW_URL = 'https://xfhlbaph.mychariow.shop/prd_l70mv5q9'

const FEATURES = [
  'Alertes achat/vente en temps réel',
  'Analyses détaillées illimitées',
  'Market Map BRVM en direct',
  'Portefeuille & suivi de positions',
  'Assistant IA BRVM',
  'Toutes les formations (Niveaux 1, 2 & 3)',
  'Conseils personnalisés par IA',
]

export default function Abonnement() {
  const navigate = useNavigate()
  const { isPro } = useAuth()

  function close() {
    navigate('/profil')
  }

  function pay() {
    window.open(CHARIOW_URL, '_blank', 'noopener,noreferrer')
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
        <h2 className="text-white font-bold text-lg">Passer à Pro</h2>
        <button onClick={close} className="text-textSub">
          <X size={22} />
        </button>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#1F1A0A', border: '1.5px solid #F5C842' }}>
          <Crown size={32} color="#F5C842" className="mx-auto mb-3" />
          <p className="text-white font-extrabold text-2xl">100 000 FCFA</p>
          <p className="text-textSub text-sm mt-1">par an · accès Pro complet</p>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <p className="text-white font-bold text-sm mb-3">Inclus dans le plan Pro</p>
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
          <ExternalLink size={18} /> Payer 100 000 FCFA
        </button>

        <p className="text-textMuted text-xs text-center leading-relaxed">
          Le paiement s'effectue sur une page sécurisée Chariow (carte bancaire ou mobile money).
          Après confirmation de votre paiement, votre accès Pro est activé manuellement par un
          administrateur — généralement sous 24h.
        </p>
      </div>
    </div>
  )
}
