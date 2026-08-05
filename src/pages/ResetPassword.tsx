import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Le lien reçu par email crée une session de récupération temporaire —
    // on vérifie juste qu'elle existe avant d'autoriser le changement.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setInvalid(true)
    })
  }, [])

  async function handleSubmit() {
    setError('')
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — recommencez depuis 'Mot de passe oublié'.")
      return
    }
    setDone(true)
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0A0A0F, #0F0F1A, #0A0A0F)' }} />
      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pb-10">
        <div className="flex flex-col items-center pt-20 mb-10">
          <div className="flex items-center justify-center rounded-full mb-4" style={{ width: 80, height: 80, backgroundColor: '#F5C842' }}>
            <TrendingUp size={40} color="#0A0A0F" strokeWidth={2.5} />
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight">Nouveau mot de passe</h1>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4">
          {invalid && (
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
              <p className="text-textSub text-sm mb-4">Ce lien n'est plus valide ou a expiré.</p>
              <button onClick={() => navigate('/auth')} className="text-primary text-sm font-bold">
                Retour à la connexion
              </button>
            </div>
          )}

          {ready && !done && (
            <>
              <div>
                <label className="text-textSub text-xs font-semibold tracking-wide">NOUVEAU MOT DE PASSE</label>
                <div className="mt-1.5 flex items-center rounded-xl px-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-white py-3 outline-none placeholder:text-textMuted"
                  />
                  <button onClick={() => setShowPassword((v) => !v)} className="text-textSub">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-textSub text-xs font-semibold tracking-wide">CONFIRMER LE MOT DE PASSE</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl px-4 py-3 text-white outline-none placeholder:text-textMuted"
                  style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
                />
              </div>
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#200A0A', border: '1px solid #EF4444', color: '#EF4444' }}>
                  {error}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-extrabold text-base mt-1 disabled:opacity-60"
                style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
              >
                {saving ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
              </button>
            </>
          )}

          {done && (
            <div className="rounded-xl p-5 flex flex-col items-center gap-3 text-center" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
              <CheckCircle2 size={32} color="#22C55E" />
              <p className="text-white font-bold text-sm">Mot de passe mis à jour</p>
              <button
                onClick={() => navigate('/alertes')}
                className="w-full py-3 rounded-xl font-extrabold text-sm mt-2"
                style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
