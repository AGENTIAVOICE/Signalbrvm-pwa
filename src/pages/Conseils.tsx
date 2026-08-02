import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles, ShieldCheck, Scale, Rocket } from 'lucide-react'
import { getConseils } from '../lib/api'

type Profile = 'Conservateur' | 'Équilibré' | 'Dynamique'

const PROFILES: { key: Profile; icon: typeof ShieldCheck; desc: string; markets: string[] }[] = [
  {
    key: 'Conservateur',
    icon: ShieldCheck,
    desc: 'Priorité à la sécurité du capital, faible tolérance au risque.',
    markets: ['Obligations UEMOA', 'Fonds monétaires', 'Valeurs à dividendes stables (SONATEL, SIB)'],
  },
  {
    key: 'Équilibré',
    icon: Scale,
    desc: 'Cherche un compromis entre croissance et sécurité.',
    markets: ['Mix actions/obligations', 'Valeurs bancaires (BOA, SGBCI)', 'ETF régionaux'],
  },
  {
    key: 'Dynamique',
    icon: Rocket,
    desc: 'Vise la croissance long terme, accepte la volatilité.',
    markets: ['Valeurs de croissance BRVM', 'Secteurs télécoms & agro-industrie', 'Small caps à fort potentiel'],
  },
]

export default function Conseils() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Profile | null>(null)
  const [conseils, setConseils] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelect(profile: Profile) {
    setSelected(profile)
    setConseils(null)
    setError('')
    setLoading(true)
    try {
      const res = await getConseils(profile)
      setConseils(res.conseils)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération des conseils')
    }
    setLoading(false)
  }

  const activeProfile = PROFILES.find((p) => p.key === selected)

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
        <button onClick={() => navigate(-1)} className="text-textSub">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-bold text-lg">Conseils</h1>
      </div>

      <div className="px-5 py-6">
        <p className="text-textSub text-sm mb-5">Choisissez votre profil de risque pour recevoir un plan d'action personnalisé.</p>

        <div className="flex flex-col gap-3 mb-6">
          {PROFILES.map((p) => {
            const Icon = p.icon
            const active = selected === p.key
            return (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className="w-full text-left rounded-2xl p-4 flex items-start gap-3"
                style={{
                  backgroundColor: active ? '#1F1A0A' : '#111118',
                  border: active ? '1.5px solid #F5C842' : '1px solid #2A2A3A',
                }}
              >
                <Icon size={20} color={active ? '#F5C842' : '#8A8A9A'} className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{p.key}</p>
                  <p className="text-textSub text-xs mt-0.5">{p.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {activeProfile && (
          <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <p className="text-white font-bold text-sm mb-2">Marchés recommandés</p>
            <ul className="flex flex-col gap-1.5">
              {activeProfile.markets.map((m) => (
                <li key={m} className="text-textSub text-xs flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span> {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-textSub text-sm py-6">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Génération de votre plan d'action…
          </div>
        )}

        {error && <p className="text-sell text-sm">{error}</p>}

        {conseils && !loading && (
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} color="#F5C842" />
              <p className="text-primary font-bold text-sm">Votre plan d'action</p>
            </div>
            <p className="text-textSub text-sm leading-7 whitespace-pre-wrap">{conseils}</p>
          </div>
        )}
      </div>
    </div>
  )
}
