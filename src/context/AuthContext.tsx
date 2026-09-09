import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { identifyOneSignalUser } from '../lib/onesignal'
import { clearAllCache } from '../lib/dataCache'

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'admin' | 'unknown'

interface Profile {
  full_name: string | null
  status: UserStatus
  subscription_plan: string
  formation_access: boolean
  plan_duration_months: number | null
  plan_expires_at: string | null
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  plan: 'free' | 'pro'
  isPro: boolean
  hasFormationAccess: boolean
  loading: boolean
  justUpgradedToPro: boolean
  dismissUpgradeNotice: () => void
  refreshPlan: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(true)
  const [justUpgradedToPro, setJustUpgradedToPro] = useState(false)
  const previousPlan = useRef<'free' | 'pro' | null>(null)
  const hasLoadedOnce = useRef(false)

  function applyPlan(next: 'free' | 'pro') {
    // Ne déclenche la bannière de bienvenue que sur une vraie transition
    // free -> pro constatée après le chargement initial (pas au premier rendu).
    if (hasLoadedOnce.current && previousPlan.current === 'free' && next === 'pro') {
      setJustUpgradedToPro(true)
    }
    previousPlan.current = next
    setPlan(next)
  }

  async function loadProfile(email: string) {
    const { data } = await supabase
      .from('users')
      .select('full_name, status, subscription_plan, formation_access, plan_duration_months, plan_expires_at')
      .eq('email', email)
      .single()
    if (data) {
      setProfile(data as Profile)
      // Supabase (public.users.subscription_plan) est l'unique source de
      // vérité du plan — c'est là que passent Chariow, l'admin et
      // l'expiration automatique. Un ancien backend externe séparé donnait
      // parfois une réponse différente (jamais informé d'un paiement
      // Chariow), ce qui provoquait un plan qui clignotait entre Pro et
      // Gratuit selon lequel des deux répondait en dernier.
      applyPlan(String(data.subscription_plan ?? '').toLowerCase() === 'pro' ? 'pro' : 'free')
    }
  }

  async function refreshPlan() {
    const email = session?.user.email
    if (email) await loadProfile(email)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user.email) await loadProfile(data.session.user.email)
      if (data.session?.user.id) identifyOneSignalUser(data.session.user.id)
      hasLoadedOnce.current = true
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user.email) {
        await loadProfile(newSession.user.email)
        if (newSession.user.id) identifyOneSignalUser(newSession.user.id)
      } else {
        setProfile(null)
        previousPlan.current = null
        setPlan('free')
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Écoute en temps réel les changements faits par un admin sur la ligne
  // `users` de la personne connectée (ex: activation du plan Pro) — pour que
  // le passage à Pro soit détecté instantanément, sans attendre un refresh.
  useEffect(() => {
    const email = session?.user.email
    if (!email) return

    const channel = supabase
      .channel(`own_user_row_${session!.user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `email=eq.${email}` },
        (payload) => {
          const newPlan = String(payload.new?.subscription_plan ?? '').toLowerCase() === 'pro' ? 'pro' : 'free'
          applyPlan(newPlan)
          if (payload.new) setProfile(payload.new as Profile)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.email])

  function dismissUpgradeNotice() {
    setJustUpgradedToPro(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    previousPlan.current = null
    setPlan('free')
    // Le service worker met en cache les réponses réseau (portefeuille,
    // notifications, etc.) pour fonctionner hors-ligne — sur un appareil
    // partagé, on les vide à la déconnexion pour qu'aucune donnée
    // personnelle ne reste accessible à la prochaine personne.
    if ('caches' in window) {
      caches.delete('supabase-cache')
      caches.delete('backend-cache')
    }
    clearAllCache()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        plan,
        isPro: plan === 'pro',
        hasFormationAccess: profile?.formation_access ?? false,
        loading,
        justUpgradedToPro,
        dismissUpgradeNotice,
        refreshPlan,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
