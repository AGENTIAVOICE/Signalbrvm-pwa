import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Settings, Edit3, X, Check, Clock, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatGMTDate } from '../lib/theme'
import { useProfilInvestisseur } from '../hooks/useProfilInvestisseur'
import { useAnalysisReadCount, useAlertReadCount, useAppOpenCount } from '../hooks/useProfileStats'
import { getProfile, getPercentage, PROFILE_COLORS } from '../lib/profilInvestisseurData'
import { supabase } from '../lib/supabase'

const PLAN_COLORS: Record<string, { border: string; bg: string; text: string; label: string; desc: string }> = {
  free: { border: '#2A2A3A', bg: '#111118', text: '#94A3B8', label: 'Gratuit', desc: 'Passez à Pro pour tout débloquer' },
  pro: { border: '#166534', bg: '#0A1F12', text: '#22C55E', label: 'Pro', desc: 'Accès Pro complet' },
}

export default function Profil() {
  const navigate = useNavigate()
  const { session, profile, plan } = useAuth()
  const { result: quizResult, capital, updateCapital } = useProfilInvestisseur()
  const analysesLues = useAnalysisReadCount()
  const alertesLues = useAlertReadCount()
  const { count: ouvertures } = useAppOpenCount()

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [capitalInput, setCapitalInput] = useState('')
  const [editingCapital, setEditingCapital] = useState(false)

  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.free
  const memberSince = session?.user.created_at ? formatGMTDate(new Date(session.user.created_at)) : null
  const initials = (profile?.full_name ?? session?.user.email ?? '?').charAt(0).toUpperCase()

  const investorProfile = quizResult ? getProfile(quizResult.score) : null
  const investorColor = investorProfile ? PROFILE_COLORS[investorProfile.key] : '#94A3B8'
  const percentage = quizResult ? getPercentage(quizResult.score) : 0

  async function saveName() {
    if (!session?.user.email || !nameInput.trim()) return
    setSaving(true)
    try {
      await supabase.from('users').update({ full_name: nameInput.trim() }).eq('email', session.user.email)
    } catch {
      // Non-bloquant si la RLS refuse la mise à jour côté client.
    }
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Mon Compte</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Profil</h1>
        </div>
        <button
          onClick={() => navigate('/profil/parametres')}
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 44, height: 44, backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
        >
          <Settings size={20} color="#8A8A9A" />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Identité + Plan */}
        <section className="rounded-2xl p-5" style={{ backgroundColor: planStyle.bg, border: `1px solid ${planStyle.border}` }}>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex items-center justify-center rounded-full font-extrabold text-xl flex-shrink-0"
              style={{ width: 64, height: 64, backgroundColor: '#F5C842', color: '#0A0A0F' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-lg truncate">{profile?.full_name ?? 'Utilisateur'}</p>
              <p className="text-textSub text-sm truncate">{session?.user.email}</p>
              {memberSince && <p className="text-textMuted text-xs mt-0.5">Membre depuis {memberSince}</p>}
            </div>
            <button onClick={() => setEditing(true)} className="text-primary flex-shrink-0 p-1">
              <Edit3 size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: '#0A0A0F' }}>
            <span className="flex items-center gap-2 font-bold text-sm" style={{ color: planStyle.text }}>
              <Crown size={16} /> Plan {planStyle.label}
            </span>
            <span className="text-textMuted text-xs">{planStyle.desc}</span>
          </div>
          {plan !== 'pro' && (
            <button
              onClick={() => navigate('/abonnement')}
              className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm"
              style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
            >
              Passer à Pro
            </button>
          )}
        </section>

        {/* Profil investisseur */}
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase mb-2 px-1">Profil investisseur</p>

          {investorProfile && quizResult ? (
            <section className="rounded-2xl p-5" style={{ backgroundColor: `${investorColor}0F`, border: `1px solid ${investorColor}55` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                  <span className="rounded-full" style={{ width: 12, height: 12, backgroundColor: investorColor }} />
                  <span className="text-white font-extrabold text-base">{investorProfile.label}</span>
                </span>
                <button
                  onClick={() => navigate('/profil-investisseur')}
                  className="rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ border: `1px solid ${investorColor}`, color: investorColor }}
                >
                  Refaire
                </button>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-textSub text-xs">Score de risque</span>
                <span className="text-white font-extrabold text-sm">{quizResult.score} / 39</span>
              </div>
              <div className="relative rounded-full overflow-hidden mb-4" style={{ height: 8, background: 'linear-gradient(90deg, #22C55E, #EAB308, #F97316, #EF4444)' }}>
                <div className="absolute top-0 right-0 h-full" style={{ width: `${100 - percentage}%`, backgroundColor: '#1A1A24' }} />
              </div>

              <p className="text-textSub text-sm leading-relaxed mb-4">{investorProfile.identite}</p>

              <div className="flex items-start gap-2 mb-2">
                <Clock size={16} color={investorColor} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm"><span className="text-textSub">Horizon : </span><span className="text-white font-semibold">{investorProfile.horizon}</span></p>
              </div>
              <div className="flex items-start gap-2 mb-4">
                <Shield size={16} color={investorColor} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm"><span className="text-textSub">Tolérance : </span><span className="text-white font-semibold">{investorProfile.tolerance}</span></p>
              </div>

              <div className="pt-3" style={{ borderTop: '1px solid #2A2A3A' }}>
                <p className="text-textSub text-xs mb-2">Capital investi (sert au calcul de votre allocation cible et du test de résistance)</p>
                {editingCapital ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={capitalInput}
                      onChange={(e) => setCapitalInput(e.target.value)}
                      placeholder="ex: 500000"
                      className="flex-1 rounded-lg px-3 py-2 text-white text-sm outline-none"
                      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
                      autoFocus
                    />
                    <button
                      onClick={async () => {
                        const n = Number(capitalInput)
                        if (Number.isFinite(n) && n > 0) await updateCapital(n)
                        setEditingCapital(false)
                      }}
                      className="rounded-lg px-3 py-2 text-xs font-bold"
                      style={{ backgroundColor: investorColor, color: '#0A0A0F' }}
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
                    className="text-sm font-bold"
                    style={{ color: capital != null ? '#FFFFFF' : investorColor }}
                  >
                    {capital != null ? `${capital.toLocaleString('fr-FR')} FCFA — modifier` : 'Renseigner mon capital'}
                  </button>
                )}
              </div>
            </section>
          ) : (
            <button
              onClick={() => navigate('/profil-investisseur')}
              className="w-full rounded-2xl p-5 text-left"
              style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
            >
              <p className="text-white font-bold text-sm mb-1">Découvrez votre profil de risque</p>
              <p className="text-textSub text-xs">Répondez à 12 questions pour recevoir des recommandations adaptées.</p>
            </button>
          )}
        </div>

        {/* Stats */}
        <section className="rounded-2xl p-5 flex items-center justify-around" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
          <Stat value={analysesLues} label="Analyses lues" />
          <Stat value={alertesLues} label="Alertes reçues" />
          <Stat value={ouvertures} label="Ouvertures" />
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full rounded-t-3xl p-5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-base">Modifier le profil</h3>
              <button onClick={() => setEditing(false)} className="text-textSub">
                <X size={20} />
              </button>
            </div>
            <label className="text-textSub text-xs font-semibold">NOM COMPLET</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1.5 w-full rounded-xl px-4 py-3 text-white outline-none mb-4"
              style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
            >
              <Check size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-primary font-extrabold text-2xl">{value}</p>
      <p className="text-textMuted text-[11px] mt-0.5">{label}</p>
    </div>
  )
}
