import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { registerUser } from '../lib/api'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'error' | 'warning'>('error')

  // Accès admin secret : taper le logo 7 fois
  const [logoTapCount, setLogoTapCount] = useState(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleLogoTap() {
    const newCount = logoTapCount + 1
    setLogoTapCount(newCount)
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => setLogoTapCount(0), 2000)
    if (newCount >= 7) {
      setLogoTapCount(0)
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
      navigate('/admin/login')
    }
  }

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs')
      setErrorType('error')
      return
    }
    if (mode === 'register' && (!name.trim() || !phone.trim())) {
      setError('Veuillez remplir tous les champs')
      setErrorType('error')
      return
    }

    setError('')
    setIsLoading(true)
    try {
      if (mode === 'register') {
        await registerUser({
          email: email.trim(),
          password,
          full_name: name.trim(),
          phone: phone.trim(),
        })
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError('Compte créé ! Veuillez vous connecter.')
          setErrorType('warning')
          setMode('login')
          return
        }
        navigate('/alertes')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError('Email ou mot de passe incorrect')
          setErrorType('error')
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('status')
          .eq('email', email.trim())
          .single()

        if (profile?.status === 'pending') {
          setError("Votre compte est en attente d'approbation par un administrateur.")
          setErrorType('warning')
          await supabase.auth.signOut()
          return
        }
        if (profile?.status === 'rejected') {
          setError('Votre accès a été refusé. Veuillez contacter le support.')
          setErrorType('error')
          await supabase.auth.signOut()
          return
        }

        navigate('/alertes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setErrorType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const errColors =
    errorType === 'warning'
      ? { bg: '#1A1400', border: '#F5C842', text: '#F5C842' }
      : { bg: '#200A0A', border: '#EF4444', text: '#EF4444' }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0A0A0F, #0F0F1A, #0A0A0F)' }}
      />
      <div
        className="absolute rounded-full"
        style={{ top: -80, right: -80, width: 280, height: 280, backgroundColor: '#F5C842', opacity: 0.06 }}
      />
      <div
        className="absolute rounded-full"
        style={{ top: 20, right: 20, width: 180, height: 180, backgroundColor: '#F5C842', opacity: 0.04 }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pb-10">
        <div className="flex flex-col items-center pt-20 mb-10">
          <div
            onClick={handleLogoTap}
            className="flex items-center justify-center rounded-full mb-4 cursor-pointer select-none"
            style={{ width: 80, height: 80, backgroundColor: '#F5C842' }}
          >
            <TrendingUp size={40} color="#0A0A0F" strokeWidth={2.5} />
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight">SignalBrvm</h1>
          <p className="text-textSub text-sm mt-1">Investir sur la BRVM, simplement</p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex rounded-xl p-1" style={{ backgroundColor: '#111118' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setError('')
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors"
                style={{
                  backgroundColor: mode === m ? '#F5C842' : 'transparent',
                  color: mode === m ? '#0A0A0F' : '#8A8A9A',
                }}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <>
              <Field label="NOM COMPLET" value={name} onChange={setName} placeholder="Votre nom" />
              <Field label="TÉLÉPHONE" value={phone} onChange={setPhone} placeholder="+225 07 00 00 00 00" />
            </>
          )}
          <Field label="EMAIL" value={email} onChange={setEmail} placeholder="vous@exemple.com" type="email" />

          <div>
            <label className="text-textSub text-xs font-semibold tracking-wide">MOT DE PASSE</label>
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

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: errColors.bg, border: `1px solid ${errColors.border}`, color: errColors.text }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-extrabold text-base mt-2 disabled:opacity-60"
            style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
          >
            {isLoading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="text-textSub text-xs font-semibold tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl px-4 py-3 text-white outline-none placeholder:text-textMuted"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
      />
    </div>
  )
}
