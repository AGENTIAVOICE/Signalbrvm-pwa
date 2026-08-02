import { Crown, Check, PartyPopper } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  'Alertes en temps réel',
  'Analyses détaillées illimitées',
  'Market Map BRVM en direct',
  'Assistant IA BRVM',
  'Toutes les formations',
]

export function WelcomeProModal() {
  const { justUpgradedToPro, dismissUpgradeNotice } = useAuth()

  if (!justUpgradedToPro) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-7 text-center"
        style={{ backgroundColor: '#111118', border: '1.5px solid #F5C842' }}
      >
        <div
          className="mx-auto mb-5 flex items-center justify-center rounded-full"
          style={{ width: 76, height: 76, background: 'linear-gradient(135deg, #F9D468, #F5C842, #D4A82E)' }}
        >
          <Crown size={34} color="#0A0A0F" />
        </div>

        <p className="flex items-center justify-center gap-2 text-white font-extrabold text-xl mb-1.5">
          Bienvenue dans Pro <PartyPopper size={20} color="#F5C842" />
        </p>
        <p className="text-textSub text-sm mb-6">
          Votre paiement a été confirmé et votre compte SignalBrvm est maintenant Pro.
        </p>

        <div className="rounded-2xl p-4 mb-6 text-left" style={{ backgroundColor: '#0A0A0F', border: '1px solid #2A2A3A' }}>
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
              <Check size={16} color="#22C55E" className="flex-shrink-0" />
              <span className="text-white text-sm">{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={dismissUpgradeNotice}
          className="w-full py-3.5 rounded-xl font-extrabold text-base"
          style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
        >
          Commencer 🚀
        </button>
      </div>
    </div>
  )
}
