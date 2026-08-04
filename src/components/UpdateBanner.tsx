import { useEffect, useRef } from 'react'
// @ts-expect-error - module virtuel généré par vite-plugin-pwa au build
import { registerSW } from 'virtual:pwa-register'

// Mise à jour silencieuse : dès qu'une nouvelle version est détectée, on
// l'applique automatiquement — sans bannière ni clic. Pour ne jamais couper
// l'utilisateur en pleine action (saisie, lecture), on n'applique le
// rechargement que lorsque l'onglet repasse en arrière-plan ou reprend le
// focus (changement d'appli, verrouillage d'écran, retour sur l'onglet) :
// à ce moment-là il n'y a rien à perdre visuellement.
export function UpdateBanner() {
  const pendingUpdate = useRef<((reload?: boolean) => Promise<void>) | null>(null)
  const needRefresh = useRef(false)

  useEffect(() => {
    function applyIfPending() {
      if (needRefresh.current && pendingUpdate.current) {
        pendingUpdate.current(true)
      }
    }

    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh.current = true
        // Si l'utilisateur n'est pas en train de regarder l'écran
        // maintenant (onglet déjà en arrière-plan), on applique tout de
        // suite plutôt que d'attendre un futur changement de visibilité.
        if (document.visibilityState === 'hidden') applyIfPending()
      },
      onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
        // Revérifie s'il existe une nouvelle version toutes les 60 minutes,
        // pour ne pas dépendre uniquement du rechargement de page.
        if (!registration) return
        setInterval(() => registration.update(), 60 * 60 * 1000)
      },
    })
    pendingUpdate.current = update

    document.addEventListener('visibilitychange', applyIfPending)
    return () => document.removeEventListener('visibilitychange', applyIfPending)
  }, [])

  return null
}
