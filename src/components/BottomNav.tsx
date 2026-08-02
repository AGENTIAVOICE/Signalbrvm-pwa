import { NavLink } from 'react-router-dom'
import { Bell, BarChart2, Activity, Briefcase, User } from 'lucide-react'
import { useAppStore } from '../lib/store'

const TABS = [
  { to: '/alertes', label: 'Alertes', icon: Bell },
  { to: '/analyses', label: 'Analyses', icon: BarChart2 },
  { to: '/marche', label: 'Marché', icon: Activity },
  { to: '/portefeuille', label: 'Portefeuille', icon: Briefcase },
  { to: '/profil', label: 'Profil', icon: User },
]

export function BottomNav() {
  const unread = useAppStore((s) => s.unreadAlertsCount)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        backgroundColor: '#0F0F18',
        borderTop: '1px solid #1E1E2A',
        height: '76px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex-1 flex flex-col items-center justify-center gap-1 relative"
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={22} color={isActive ? '#F5C842' : '#4A4A5A'} strokeWidth={isActive ? 2.5 : 1.8} />
                {to === '/alertes' && unread > 0 && (
                  <span
                    className="absolute -top-1 -right-2 flex items-center justify-center rounded-full text-white font-extrabold"
                    style={{
                      backgroundColor: '#EF4444',
                      minWidth: '16px',
                      height: '16px',
                      fontSize: '9px',
                      border: '1.5px solid #0F0F18',
                      padding: '0 3px',
                    }}
                  >
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span
                className="font-semibold"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.3px',
                  color: isActive ? '#F5C842' : '#4A4A5A',
                }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
