import { useEffect, useRef } from 'react'
// @ts-expect-error - module virtuel généré par vite-plugin-pwa au build
import { registerSW } from 'virtual:pwa-register'

// Mise à jour silencieuse et vraiment automatique : dès qu'une nouvelle
// version est détectée, elle s'applique toute seule, sans jamais demander
// quoi que ce soit au client — sans bannière ni clic.
//
// Sur mobile, l'usage typique n'est PAS de laisser l'app ouverte en continu
// (l'intervalle de 15 min ne se déclencherait alors presque jamais) mais de
// la fermer et la rouvrir — il faut donc explicitement revérifier une
// nouvelle version à chaque réouverture (retour au premier plan), en plus
// du contrôle périodique pour les sessions longues.
//
// Le rechargement se déclenche à l'un des moments "sûrs" suivants, pour ne
// jamais couper l'utilisateur en pleine action :
// 1. L'onglet/l'appli part en arrière-plan (écran verrouillé, changement
//    d'appli) — le cas le plus fréquent sur mobile.
// 2. L'onglet reste ouvert et visible mais sans aucune interaction pendant
//    un moment (30s) — couvre le cas d'un onglet desktop laissé ouvert.
// 3. L'appli vient d'être rouverte (retour au premier plan) et une
//    vérification immédiate révèle une nouvelle version — appliquée tout de
//    suite, avant que l'utilisateur n'ait eu le temps d'interagir.
const IDLE_DELAY_MS = 30_000

export function UpdateBanner() {
  const pendingUpdate = useRef<((reload?: boolean) => Promise<void>) | null>(null)
  const needRefresh = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

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
        registrationRef.current = registration ?? null
        if (!registration) return
        // Contrôle périodique pour les sessions longues laissées ouvertes.
        setInterval(() => registration.update(), 15 * 60 * 1000)
      },
    })
    pendingUpdate.current = update

    function handleVisibilityChange() {
      applyIfHidden()
      resetIdleTimer()
      if (document.visibilityState === 'visible') {
        // L'appli vient d'être ramenée au premier plan (rouverte après
        // avoir été fermée/mise en arrière-plan) — on force une
        // vérification immédiate plutôt que d'attendre le prochain
        // contrôle périodique, qui pourrait ne jamais arriver si la
        // session est courte.
        registrationRef.current?.update()
      }
    }

    const activityEvents: (keyof DocumentEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'scroll']
    activityEvents.forEach((evt) => document.addEventListener(evt, resetIdleTimer, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // 'pageshow' se déclenche aussi quand la page est restaurée depuis le
    // cache de navigation (bfcache) — un cas fréquent au retour dans une
    // PWA installée que 'visibilitychange' seul peut manquer.
    window.addEventListener('pageshow', () => registrationRef.current?.update())

    return () => {
      activityEvents.forEach((evt) => document.removeEventListener(evt, resetIdleTimer))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  return null
}
