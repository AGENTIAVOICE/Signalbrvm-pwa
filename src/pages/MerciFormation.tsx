import { useNavigate } from 'react-router-dom'
import { CheckCircle2, TrendingUp, Clock, LogIn } from 'lucide-react'

// Page de redirection après un achat réussi sur Chariow (formation BRVM).
// L'activation de l'accès reste manuelle côté admin (après vérification du
// paiement) — cette page l'explique clairement, sans jamais promettre un
// délai qu'on ne maîtrise pas entièrement.
export default function MerciFormation() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0A0A0F, #0F0F1A, #0A0A0F)' }} />
      <div
        className="absolute rounded-full"
        style={{ top: -120, right: -100, width: 320, height: 320, backgroundColor: '#F5C842', opacity: 0.06 }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        <div className="flex items-center justify-center rounded-full mb-5" style={{ width: 72, height: 72, backgroundColor: '#052E16' }}>
          <CheckCircle2 size={36} color="#22C55E" />
        </div>

        <h1 className="text-white font-extrabold text-2xl mb-2">Merci pour votre achat !</h1>
        <p className="text-textSub text-sm leading-relaxed mb-6">
          Votre paiement pour la <span className="text-white font-semibold">Formation BRVM Complète</span> a bien été reçu.
        </p>

        <div className="w-full rounded-2xl p-4 mb-6 flex items-start gap-3 text-left" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <Clock size={18} color="#F5C842" className="mt-0.5 shrink-0" />
          <p className="text-textSub text-xs leading-relaxed">
            Votre accès aux vidéos est activé manuellement après vérification du paiement, généralement en quelques
            heures. Vous recevrez une notification dès qu'il sera disponible dans l'application.
          </p>
        </div>

        <button
          onClick={() => navigate('/auth')}
          className="w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 mb-3"
          style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
        >
          <LogIn size={16} /> Me connecter à SignalBrvm
        </button>

        <p className="text-textMuted text-[11px] leading-relaxed">
          Vous n'avez pas encore de compte ? Créez-en un gratuitement avec le même email utilisé pour l'achat, pour que
          votre accès soit relié correctement.
        </p>

        <div className="flex items-center gap-1.5 mt-8 opacity-60">
          <TrendingUp size={14} color="#F5C842" />
          <span className="text-textMuted text-[11px] font-bold tracking-wide">SIGNALBRVM</span>
        </div>
      </div>
    </div>
  )
}
