import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Lock,
  TrendingUp,
  HelpCircle,
  Star,
  Shield,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Check,
  Mail,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { InfoModal } from '../components/InfoModal'
import { PRIVACY_TITLE, PRIVACY_TEXT, TERMS_TITLE, TERMS_TEXT } from '../lib/legal'

type ModalKind = 'security' | 'market_prefs' | 'help' | 'rate' | 'privacy' | 'terms' | null

export default function ProfilParametres() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [modal, setModal] = useState<ModalKind>(null)

  async function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await signOut()
      navigate('/auth')
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profil')} className="text-textSub">
            <ChevronLeft size={22} />
          </button>
          <div>
            <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Mon Compte</p>
            <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Profil</h1>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase mb-2 px-1">Paramètres</p>
          <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <div className="w-full flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid #1E1E2A' }}>
              <span className="flex items-center gap-3 text-white text-sm">
                <IconBox icon={Bell} color="#F5C842" /> Notifications
              </span>
              <button
                onClick={() => setNotifications((v) => !v)}
                className="relative rounded-full transition-colors"
                style={{ width: 44, height: 26, backgroundColor: notifications ? '#D4A82E' : '#2A2A3A' }}
              >
                <span
                  className="absolute rounded-full bg-white transition-transform"
                  style={{ width: 20, height: 20, top: 3, left: 3, transform: notifications ? 'translateX(18px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            <MenuItem icon={Lock} color="#3B82F6" label="Sécurité" onClick={() => setModal('security')} />
            <MenuItem icon={TrendingUp} color="#22C55E" label="Préférences marché" onClick={() => setModal('market_prefs')} last />
          </section>
        </div>

        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase mb-2 px-1">Support</p>
          <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <MenuItem icon={HelpCircle} color="#A78BFA" label="Centre d'aide" onClick={() => setModal('help')} />
            <MenuItem icon={Star} color="#F5C842" label="Évaluer l'app" onClick={() => setModal('rate')} last />
          </section>
        </div>

        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase mb-2 px-1">Légal</p>
          <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <MenuItem icon={Shield} color="#8A8A9A" label="Politique de confidentialité" onClick={() => setModal('privacy')} />
            <MenuItem icon={Shield} color="#8A8A9A" label="Conditions d'utilisation" onClick={() => setModal('terms')} last />
          </section>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-sm"
          style={{ backgroundColor: '#200A0A', border: '1px solid #7F1D1D', color: '#EF4444' }}
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>

      {modal === 'security' && <SecurityModal onClose={() => setModal(null)} />}

      {modal === 'market_prefs' && (
        <InfoModal title="Préférences marché" onClose={() => setModal(null)}>
          <p className="text-textSub text-sm leading-relaxed mb-4">
            Le réglage fin des préférences de marché (secteurs suivis, seuils d'alerte personnalisés) arrive
            bientôt. En attendant, toutes les alertes achat/vente publiées par nos analystes vous sont envoyées.
          </p>
        </InfoModal>
      )}

      {modal === 'help' && (
        <InfoModal title="Centre d'aide" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <FaqItem q="Comment fonctionne le plan Pro ?" a="Le plan Pro (100 000 FCFA/an) débloque les alertes en temps réel, les analyses complètes, le Market Map BRVM, l'assistant IA et toutes les formations." />
            <FaqItem q="Comment activer mon plan Pro après paiement ?" a="Après ton paiement sur Chariow, un administrateur active manuellement ton accès sous 24h." />
            <FaqItem q="J'ai un problème avec mon compte" a="Écris-nous directement, nous répondons rapidement." />
            <a
              href="mailto:support@signalbrvm.com"
              className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm mt-2"
              style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
            >
              <Mail size={16} /> Contacter le support
            </a>
          </div>
        </InfoModal>
      )}

      {modal === 'rate' && (
        <InfoModal title="Évaluer l'app" onClose={() => setModal(null)}>
          <p className="text-textSub text-sm leading-relaxed mb-4">
            SignalBrvm est encore jeune — ton avis compte énormément pour nous aider à l'améliorer.
          </p>
          <a
            href="mailto:support@signalbrvm.com?subject=Mon%20avis%20sur%20SignalBrvm"
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm"
            style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
          >
            <Star size={16} /> Envoyer mon avis
          </a>
        </InfoModal>
      )}

      {modal === 'privacy' && (
        <InfoModal title={PRIVACY_TITLE} onClose={() => setModal(null)}>
          <p className="text-textSub text-sm leading-7 whitespace-pre-wrap">{PRIVACY_TEXT}</p>
        </InfoModal>
      )}

      {modal === 'terms' && (
        <InfoModal title={TERMS_TITLE} onClose={() => setModal(null)}>
          <p className="text-textSub text-sm leading-7 whitespace-pre-wrap">{TERMS_TEXT}</p>
        </InfoModal>
      )}
    </div>
  )
}

function SecurityModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [signingOutAll, setSigningOutAll] = useState(false)

  async function changePassword() {
    setError('')
    setSuccess(false)
    if (newPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function signOutEverywhere() {
    if (!confirm('Se déconnecter de tous les appareils ? Vous devrez vous reconnecter partout.')) return
    setSigningOutAll(true)
    await supabase.auth.signOut({ scope: 'global' })
    window.location.href = '/auth'
  }

  return (
    <InfoModal title="Sécurité" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-white font-bold text-sm mb-3">Changer le mot de passe</p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-textMuted mb-2"
            style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-textMuted mb-3"
            style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
          />
          {error && <p className="text-sell text-xs mb-2">{error}</p>}
          {success && (
            <p className="text-buy text-xs mb-2 flex items-center gap-1">
              <Check size={13} /> Mot de passe mis à jour avec succès
            </p>
          )}
          <button
            onClick={changePassword}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-60"
            style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid #1E1E2A' }} className="pt-4">
          <p className="text-white font-bold text-sm mb-1">Sessions actives</p>
          <p className="text-textMuted text-xs mb-3">
            Si vous avez perdu un appareil, déconnectez toutes les sessions. Vous devrez vous reconnecter partout.
          </p>
          <button
            onClick={signOutEverywhere}
            disabled={signingOutAll}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-60"
            style={{ backgroundColor: '#200A0A', border: '1px solid #7F1D1D', color: '#EF4444' }}
          >
            {signingOutAll ? 'Déconnexion…' : 'Se déconnecter de tous les appareils'}
          </button>
        </div>
      </div>
    </InfoModal>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ backgroundColor: '#1A1A24' }}>
      <p className="text-white font-semibold text-sm mb-1">{q}</p>
      <p className="text-textSub text-xs leading-relaxed">{a}</p>
    </div>
  )
}

function IconBox({ icon: Icon, color }: { icon: typeof Bell; color: string }) {
  return (
    <span className="flex items-center justify-center rounded-xl" style={{ width: 32, height: 32, backgroundColor: `${color}22` }}>
      <Icon size={16} color={color} />
    </span>
  )
}

function MenuItem({
  icon,
  color,
  label,
  last,
  onClick,
}: {
  icon: typeof Bell
  color: string
  label: string
  last?: boolean
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5" style={{ borderBottom: last ? 'none' : '1px solid #1E1E2A' }}>
      <span className="flex items-center gap-3 text-white text-sm">
        <IconBox icon={icon} color={color} /> {label}
      </span>
      <ChevronRight size={16} color="#4A4A5A" />
    </button>
  )
}
