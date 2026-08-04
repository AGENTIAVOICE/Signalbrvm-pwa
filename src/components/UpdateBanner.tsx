import { useEffect, useRef } from 'react'
// @ts-expect-error - module virtuel généré par vite-plugin-pwa au build
import { registerSW } from 'virtual:pwa-register'

// Mise à jour silencieuse et vraiment automatique : dès qu'une nouvelle
// version est détectée, elle s'applique toute seule, sans jamais demander
// quoi que ce soit au client — sans bannière ni clic.
//
// Le rechargement se déclenche à l'un des deux moments "sûrs" suivants,
// pour ne jamais couper l'utilisateur en pleine action :
// 1. L'onglet part en arrière-plan (écran verrouillé, changement d'appli,
//    changement d'onglet) — le cas le plus fréquent sur mobile.
// 2. L'onglet reste ouvert et visible mais sans aucune interaction pendant
//    un moment (30s) — couvre le cas d'un onglet desktop laissé ouvert en
//    continu, qui ne passerait jamais en arrière-plan autrement.
const IDLE_DELAY_MS = 30_000

export function UpdateBanner() {
  const pendingUpdate = useRef<((reload?: boolean) => Promise<void>) | null>(null)
  const needRefresh = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function applyNow() {
      if (needRefresh.current && pendingUpdate.current) {
        pendingUpdate.current(true)
      }
    }

    function applyIfHidden() {
      if (document.visibilityState === 'hidden') applyNow()
    }

    function resetIdleTimer() {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (document.visibilityState !== 'visible') return
      idleTimer.current = setTimeout(() => {
        if (document.visibilityState === 'visible') applyNow()
      }, IDLE_DELAY_MS)
    }

    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh.current = true
        applyIfHidden()
        resetIdleTimer()
      },
      onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
        // Revérifie plus souvent (15 min) pour ne pas dépendre uniquement
        // d'un rechargement de page.
        if (!registration) return
        setInterval(() => registration.update(), 15 * 60 * 1000)
      },
    })
    pendingUpdate.current = update

    const activityEvents: (keyof DocumentEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'scroll']
    activityEvents.forEach((evt) => document.addEventListener(evt, resetIdleTimer, { passive: true }))
    document.addEventListener('visibilitychange', () => {
      applyIfHidden()
      resetIdleTimer()
    })

    return () => {
      activityEvents.forEach((evt) => document.removeEventListener(evt, resetIdleTimer))
      document.removeEventListener('visibilitychange', applyIfHidden)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  return null
}
