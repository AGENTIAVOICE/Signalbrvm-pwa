import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
// @ts-expect-error - module virtuel généré par vite-plugin-pwa au build
import { registerSW } from 'virtual:pwa-register'

export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateFn, setUpdateFn] = useState<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
        // Revérifie s'il existe une nouvelle version toutes les 60 minutes,
        // pour ne pas dépendre uniquement du rechargement de page.
        if (!registration) return
        setInterval(() => registration.update(), 60 * 60 * 1000)
      },
    })
    setUpdateFn(update)
  }, [])

  if (!needRefresh) return null

  return (
    <div
      className="fixed left-4 right-4 z-[60] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
      style={{ bottom: 92, backgroundColor: '#1F1A0A', border: '1px solid #F5C842' }}
    >
      <RefreshCw size={18} color="#F5C842" className="flex-shrink-0" />
      <p className="flex-1 text-white text-xs font-semibold">Une nouvelle version de SignalBrvm est disponible.</p>
      <button
        onClick={() => updateFn?.(true)}
        className="rounded-lg px-3 py-1.5 text-xs font-extrabold flex-shrink-0"
        style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
      >
        Actualiser
      </button>
      <button onClick={() => setNeedRefresh(false)} className="text-textSub flex-shrink-0" aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  )
}
