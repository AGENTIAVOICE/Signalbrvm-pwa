import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Crown } from 'lucide-react'

// Contrairement à ProLock (écran plein qui cache tout), ce composant laisse
// deviner la valeur réelle du contenu (flouté, toujours en place) plutôt que
// de la masquer entièrement — ça donne envie de payer au lieu de juste
// bloquer, et évite de donner l'impression que la fonctionnalité n'existe pas.
export function ProTeaser({
  children,
  title,
  description,
  compact = false,
}: {
  children: ReactNode
  title: string
  description: string
  compact?: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.5 }} aria-hidden="true">
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-5"
        style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.35), rgba(10,10,15,0.85))' }}
      >
        <div
          className="flex items-center justify-center rounded-full mb-2.5"
          style={{ width: compact ? 34 : 42, height: compact ? 34 : 42, backgroundColor: '#1F1A0A', border: '1px solid #F5C842' }}
        >
          <Lock size={compact ? 15 : 18} color="#F5C842" />
        </div>
        <p className={`text-white font-extrabold ${compact ? 'text-xs' : 'text-sm'} mb-1`}>{title}</p>
        <p className={`text-textSub ${compact ? 'text-[11px]' : 'text-xs'} mb-3 max-w-[240px] leading-relaxed`}>{description}</p>
        <button
          onClick={() => navigate('/abonnement')}
          className="flex items-center gap-1.5 rounded-full font-extrabold"
          style={{ backgroundColor: '#F5C842', color: '#0A0A0F', padding: compact ? '7px 14px' : '9px 18px', fontSize: compact ? 11 : 12.5 }}
        >
          <Crown size={compact ? 12 : 14} /> Passer à Pro
        </button>
      </div>
    </div>
  )
}
