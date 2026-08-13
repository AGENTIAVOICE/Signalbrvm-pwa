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
// pour pouvoir cibler des personnes précises plus tard si besoin.
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
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push((OneSignal) => {
      resolve(Boolean(OneSignal.User?.PushSubscription?.optedIn))
    })
  })
}

export function setOneSignalSubscription(enabled: boolean): Promise<void> {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (enabled) await OneSignal.User.PushSubscription.optIn()
        else await OneSignal.User.PushSubscription.optOut()
      } catch {
        // best-effort
      }
      resolve()
    })
  })
}
