import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { adminLogin, setAdminToken } from '../../lib/adminApi'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(email.trim(), password)
      setAdminToken(res.token)
      navigate('/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0A0A0F, #0F0F1A, #0A0A0F)' }}
      />
      <div
        className="absolute rounded-full"
        style={{ top: -80, left: -80, width: 280, height: 280, backgroundColor: '#F5C842', opacity: 0.08 }}
      />
      <div
        className="absolute rounded-full"
        style={{ bottom: -100, right: -100, width: 260, height: 260, backgroundColor: '#F5C842', opacity: 0.06 }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pb-10">
        <div className="flex flex-col items-center pt-20 mb-8">
          <div
            className="flex items-center justify-center rounded-full mb-6"
            style={{
              width: 88,
              height: 88,
              border: '2px solid #F5C842',
              boxShadow: '0 0 40px rgba(245,200,66,0.35)',
            }}
          >
            <Shield size={38} color="#F5C842" strokeWidth={1.8} />
          </div>
          <h1 className="text-white font-extrabold text-[28px] tracking-tight">Panneau Admin</h1>
          <p className="text-primary text-sm font-bold tracking-[3px] mt-1.5">SIGNALBRVM</p>

          <span
            className="mt-4 rounded-lg px-4 py-2 text-xs font-extrabold tracking-widest"
            style={{ backgroundColor: '#200A0A', border: '1px solid #7F1D1D', color: '#EF4444' }}
          >
            ACCÈS RESTREINT
          </span>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4 mt-4">
          <div>
            <label className="text-textSub text-xs font-semibold tracking-wide">ADRESSE EMAIL</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sikaadvisory.com"
              className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-white outline-none placeholder:text-textMuted"
              style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
            />
          </div>

          <div>
            <label className="text-textSub text-xs font-semibold tracking-wide">MOT DE PASSE</label>
            <div className="mt-1.5 flex items-center rounded-xl px-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-white py-3.5 outline-none placeholder:text-textMuted"
              />
              <button onClick={() => setShowPassword((v) => !v)} className="text-textSub">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: '#200A0A', border: '1px solid #EF4444', color: '#EF4444' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-4 rounded-xl font-extrabold text-base mt-2 disabled:opacity-60"
            style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <button onClick={() => navigate('/auth')} className="text-textSub text-sm text-center mt-2">
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}
