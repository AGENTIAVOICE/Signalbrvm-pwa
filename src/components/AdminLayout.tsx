import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Users, FileText, Bell, Video, LogOut } from 'lucide-react'
import { getAdminToken, clearAdminToken } from '../lib/adminApi'
import { ErrorBoundary } from './ErrorBoundary'

const TABS = [
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/analyses', label: 'Analyses', icon: FileText },
  { to: '/admin/alerts', label: 'Alertes', icon: Bell },
  { to: '/admin/formations', label: 'Formations', icon: Video },
]

export function AdminProtectedRoute() {
  const token = getAdminToken()
  if (!token) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

export function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    clearAdminToken()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center justify-between px-4 pt-6 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className="rounded-lg px-2 py-0.5 text-[9px] font-extrabold tracking-widest"
            style={{ backgroundColor: '#200A0A', border: '1px solid #7F1D1D', color: '#EF4444' }}
          >
            ADMIN
          </span>
          <span className="text-white font-extrabold text-sm tracking-tight">SIGNALBRVM</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A', color: '#C8C8D4' }}
        >
          <LogOut size={13} /> Déconnexion
        </button>
      </div>
      <div style={{ borderBottom: '1px solid #1E1E2A' }} />

      <div className="px-4 py-4">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{ backgroundColor: '#0F0F18', borderTop: '1px solid #1E1E2A', height: 68 }}
      >
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex-1 flex flex-col items-center justify-center gap-1">
            {({ isActive }) => (
              <>
                <Icon size={19} color={isActive ? '#F5C842' : '#4A4A5A'} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="font-semibold" style={{ fontSize: 9, color: isActive ? '#F5C842' : '#4A4A5A' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
