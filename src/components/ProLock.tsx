import { useNavigate } from 'react-router-dom'
import { Lock, Check, Crown } from 'lucide-react'

const PRO_FEATURES = [
  'Alertes en temps réel',
  'Analyses détaillées',
  'Market Map BRVM',
  'Portefeuille avancé',
  'Assistant IA',
]

export function ProLock() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#0A0A0F' }}>
      <div
        className="flex items-center justify-center rounded-full mb-6"
        style={{ width: 88, height: 88, backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
      >
        <Lock size={36} color="#F5C842" />
      </div>
      <h2 className="text-white font-extrabold text-xl mb-2 text-center">Fonctionnalité Pro</h2>
      <p className="text-textSub text-sm text-center mb-6 max-w-xs">
        Débloquez cette fonctionnalité et bien plus avec le plan Pro.
      </p>

      <div className="w-full max-w-sm rounded-2xl p-5 mb-6" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
        {PRO_FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
            <Check size={16} color="#22C55E" />
            <span className="text-white text-sm">{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/abonnement')}
        className="w-full max-w-sm py-3.5 rounded-xl font-extrabold text-base flex items-center justify-center gap-2"
        style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
      >
        <Crown size={18} /> Passer à Pro
      </button>
    </div>
  )
}
