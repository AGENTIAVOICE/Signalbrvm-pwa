// Intégration OneSignal — remplace l'ancien interrupteur "Notifications"
// purement cosmétique par un vrai abonnement push navigateur.

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>
  }
}

interface OneSignalSdk {
  init: (options: { appId: string; serviceWorkerParam: { scope: string }; serviceWorkerPath: string }) => Promise<void>
  login: (externalId: string) => Promise<void>
  User: {
    PushSubscription: {
      optedIn: boolean
      optIn: () => Promise<void>
      optOut: () => Promise<void>
      addEventListener: (event: 'change', cb: (e: { current: { optedIn: boolean } }) => void) => void
    }
  }
}

const ONESIGNAL_APP_ID = '1c69d75a-5af4-43f8-9b75-40179316f764'
const SDK_TIMEOUT_MS = 4000

// Le SDK OneSignal peut échouer à se charger (bloqueur de pub, réseau,
// domaine bloqué...) — sans filet de sécurité, tout ce qui attend le SDK
// resterait bloqué indéfiniment (bouton grisé pour toujours). Ce petit
// utilitaire garantit qu'on abandonne proprement après quelques secondes.
function withTimeout<T>(promise: Promise<T>, fallback: T, ms = SDK_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then((v) => {
      clearTimeout(timer)
      resolve(v)
    })
  })
}

// État brut de la permission navigateur (indépendant de OneSignal) — permet
// de savoir s'il faut encore proposer la bannière ("default") ou si
// l'utilisateur a déjà tranché ("granted"/"denied").
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

let initialized = false

export function initOneSignal() {
  if (initialized) return
  initialized = true
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: 'sw.js',
    })
  })
}

// Associe l'abonnement push à l'identité réelle de l'utilisateur connecté,
// pour pouvoir cibler des personnes précises plus tard si besoin. NE
// déclenche PAS la demande de permission ici : les navigateurs bloquent
// silencieusement toute demande de notification qui ne part pas d'un vrai
// geste utilisateur (clic/tap) — voir NotificationPrompt.tsx pour ça.
export function identifyOneSignalUser(userId: string) {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.login(userId)
    } catch {
      // best-effort — ne doit jamais bloquer le reste de l'app
    }
  })
}

export function getOneSignalSubscriptionState(): Promise<boolean> {
  const raw = new Promise<boolean>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push((OneSignal) => {
      resolve(Boolean(OneSignal.User?.PushSubscription?.optedIn))
    })
  })
  return withTimeout(raw, false)
}

export function setOneSignalSubscription(enabled: boolean): Promise<boolean> {
  const raw = new Promise<boolean>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (enabled) await OneSignal.User.PushSubscription.optIn()
        else await OneSignal.User.PushSubscription.optOut()
        resolve(true)
      } catch {
        resolve(false)
      }
    })
  })
  return withTimeout(raw, false)
}
