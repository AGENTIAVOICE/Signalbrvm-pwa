import { useEffect, useRef } from 'react'
// @ts-expect-error - module virtuel généré par vite-plugin-pwa au build
import { registerSW } from 'virtual:pwa-register'

// Mise à jour silencieuse : dès qu'une nouvelle version est détectée, on
// l'applique automatiquement — sans bannière ni clic. Le rechargement ne se
// déclenche QUE lorsque l'onglet passe en arrière-plan (écran verrouillé,
// changement d'appli) — jamais quand l'utilisateur revient dessus, sinon la
// page se recharge sous ses yeux et toute l'interface (y compris la barre du
// bas) disparaît un instant avant de se reconstruire.
export function UpdateBanner() {
  const pendingUpdate = useRef<((reload?: boolean) => Promise<void>) | null>(null)
  const needRefresh = useRef(false)

  useEffect(() => {
    function applyIfHidden() {
      if (document.visibilityState === 'hidden' && needRefresh.current && pendingUpdate.current) {
        pendingUpdate.current(true)
      }
    }

    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh.current = true
        applyIfHidden()
      },
      onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
        // Revérifie s'il existe une nouvelle version toutes les 60 minutes,
        // pour ne pas dépendre uniquement du rechargement de page.
        if (!registration) return
        setInterval(() => registration.update(), 60 * 60 * 1000)
      },
    })
    pendingUpdate.current = update

    document.addEventListener('visibilitychange', applyIfHidden)
    return () => document.removeEventListener('visibilitychange', applyIfHidden)
  }, [])

  return null
}
