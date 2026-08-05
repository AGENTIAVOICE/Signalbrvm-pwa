import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { formatRelativeTime } from '../lib/theme'

export function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) markAllRead()
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative" aria-label="Notifications">
        <Bell size={22} color="#F5C842" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-white font-extrabold"
            style={{ backgroundColor: '#EF4444', minWidth: 16, height: 16, fontSize: 9, border: '1.5px solid #0A0A0F', padding: '0 3px' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-50 rounded-2xl overflow-hidden"
            style={{ width: 300, maxHeight: 360, backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
          >
            <p className="px-4 py-3 text-white font-bold text-sm" style={{ borderBottom: '1px solid #2A2A3A' }}>
              Notifications
            </p>
            <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <BellOff size={26} color="#4A4A5A" />
                  <p className="text-textMuted text-xs px-4 text-center">
                    Aucune notification. Active "Être alerté" sur une alerte pour être prévenu quand son cours limite est atteint.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false)
                      if (n.alert_id) navigate(`/alertes/${n.alert_id}`)
                      else if (n.analysis_id) navigate('/analyses')
                    }}
                    className="w-full text-left px-4 py-3 flex flex-col gap-1"
                    style={{ borderBottom: '1px solid #1E1E2A', backgroundColor: n.is_read ? 'transparent' : '#1F1A0A' }}
                  >
                    <p className="text-white text-xs leading-relaxed">{n.message}</p>
                    <span className="text-textMuted text-[10px]">{formatRelativeTime(new Date(n.created_at))}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
