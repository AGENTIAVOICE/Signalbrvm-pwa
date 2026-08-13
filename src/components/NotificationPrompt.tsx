import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { getBrowserNotificationPermission, setOneSignalSubscription } from '../lib/onesignal'

const DISMISSED_KEY = 'signalbrvm_notif_prompt_dismissed'

// Les navigateurs bloquent silencieusement toute demande de permission de
// notification qui n'est pas déclenchée par un vrai geste utilisateur — pas
// question donc de la demander automatiquement au chargement. Cette
// bannière s'affiche à la place, dès la connexion, avec un vrai bouton :
// c'est le clic sur ce bouton qui déclenche la vraie demande.
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    const permission = getBrowserNotificationPermission()
    const dismissed = localStorage.getItem(DISMISSED_KEY) === '1'
    // Ne s'affiche que si l'utilisateur n'a encore jamais tranché (ni
    // autorisé, ni bloqué) et n'a pas déjà fermé la bannière lui-même.
    setVisible(permission === 'default' && !dismissed)
  }, [])

  async function handleActivate() {
    setAsking(true)
    await setOneSignalSubscription(true)
    setAsking(false)
    setVisible(false)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed left-4 right-4 z-50 flex items-center gap-3 rounded-2xl px-4 py-3.5 sheet-transition"
      style={{ bottom: 92, backgroundColor: '#1F1A0A', border: '1px solid #F5C842' }}
    >
      <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 34, height: 34, backgroundColor: '#F5C842' }}>
        <Bell size={16} color="#0A0A0F" />
      </div>
      <p className="flex-1 text-white text-xs font-semibold leading-snug">
        Activez les notifications pour ne rater aucune alerte, analyse ou formation.
      </p>
      <button
        onClick={handleActivate}
        disabled={asking}
        className="rounded-lg px-3 py-2 text-xs font-extrabold shrink-0 disabled:opacity-50"
        style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
      >
        {asking ? '...' : 'Activer'}
      </button>
      <button onClick={handleDismiss} className="text-textSub shrink-0" aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  )
}
