import { useEffect, useMemo, useRef, useState } from 'react'
import { Users, Search, Shield, Crown, UserCheck, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { adminApi, type AdminUser } from '../../lib/adminApi'
import { ScreenHeader } from '../../components/admin/AdminUI'

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminQuery, setAdminQuery] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  const loadedOnce = useRef(false)

  // silent = true -> on ne remet jamais l'écran de chargement plein écran ;
  // la liste déjà affichée reste visible pendant qu'on récupère les données
  // fraîches en arrière-plan, puis on les échange en place, sans à-coup.
  async function load(silent = false) {
    if (!loadedOnce.current && !silent) setLoading(true)
    try {
      const data = await adminApi.get<AdminUser[]>('/users')
      setUsers(data)
      setError('')
    } catch (err) {
      if (!loadedOnce.current) setError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
    loadedOnce.current = true
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(id: string, status: AdminUser['status']) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
    try {
      await adminApi.patch(`/users/${id}`, { status })
      load(true)
    } catch (err) {
      load(true) // resynchronise en cas d'échec pour ne pas laisser un état incohérent
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  async function setPlan(id: string, plan: 'free' | 'pro') {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, subscription_plan: plan } : u)))
    try {
      await adminApi.patch(`/users/${id}`, { subscription_plan: plan })
      load(true)
    } catch (err) {
      load(true)
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  async function removeUser(id: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    const previous = users
    setUsers((prev) => prev.filter((u) => u.id !== id)) // disparaît immédiatement
    try {
      await adminApi.delete(`/users/${id}`)
      load(true)
    } catch (err) {
      setUsers(previous) // on remet l'utilisateur si la suppression a échoué
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const admins = useMemo(
    () =>
      users
        .filter((u) => u.status === 'admin')
        .filter((u) => matchesQuery(u, adminQuery)),
    [users, adminQuery]
  )
  const proClients = useMemo(
    () =>
      users
        .filter((u) => u.status !== 'admin' && String(u.subscription_plan).toLowerCase() === 'pro')
        .filter((u) => matchesQuery(u, clientQuery)),
    [users, clientQuery]
  )
  const freeClients = useMemo(
    () =>
      users
        .filter((u) => u.status !== 'admin' && String(u.subscription_plan).toLowerCase() !== 'pro')
        .filter((u) => matchesQuery(u, clientQuery)),
    [users, clientQuery]
  )

  if (loading) return <p className="text-textSub text-sm">Chargement…</p>
  if (error) return <p className="text-sell text-sm">{error}</p>

  return (
    <div>
      <ScreenHeader
        icon={<Users size={20} color="#F5C842" />}
        title="Utilisateurs"
        action={<CountBadge n={users.length} color="#F5C842" />}
      />

      <div className="flex flex-col gap-3 mb-6">
        <SearchInput value={adminQuery} onChange={setAdminQuery} placeholder="Rechercher un administrateur (nom, email)" />
        <SearchInput value={clientQuery} onChange={setClientQuery} placeholder="Rechercher un client (nom, email, plan)" />
      </div>

      <Section icon={<Shield size={16} color="#A78BFA" />} label="Administrateurs" color="#A78BFA" count={admins.length}>
        {admins.map((u) => (
          <div key={u.id} className="rounded-2xl p-3.5 mb-2.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <UserIdentity user={u} />
            <span
              className="inline-block mt-2 rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wider"
              style={{ backgroundColor: '#1E1B33', border: '1px solid #4C1D95', color: '#A78BFA' }}
            >
              ADMIN
            </span>
          </div>
        ))}
      </Section>

      <Section icon={<Crown size={16} color="#22C55E" />} label="Clients Pro" color="#22C55E" count={proClients.length}>
        {proClients.map((u) => (
          <ClientCard key={u.id} user={u} onSetStatus={setStatus} onSetPlan={setPlan} onRemove={removeUser} />
        ))}
      </Section>

      <Section icon={<UserCheck size={16} color="#94A3B8" />} label="Clients Gratuits" color="#94A3B8" count={freeClients.length}>
        {freeClients.map((u) => (
          <ClientCard key={u.id} user={u} onSetStatus={setStatus} onSetPlan={setPlan} onRemove={removeUser} />
        ))}
      </Section>
    </div>
  )
}

function matchesQuery(u: AdminUser, q: string) {
  if (!q.trim()) return true
  const s = q.toLowerCase()
  return (
    (u.full_name ?? '').toLowerCase().includes(s) ||
    u.email.toLowerCase().includes(s) ||
    String(u.subscription_plan ?? '').toLowerCase().includes(s)
  )
}

function CountBadge({ n, color }: { n: number; color: string }) {
  return (
    <span
      className="flex items-center justify-center rounded-full font-extrabold text-xs"
      style={{ minWidth: 26, height: 26, padding: '0 8px', backgroundColor: `${color}22`, border: `1px solid ${color}`, color }}
    >
      {n}
    </span>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <Search size={15} color="#4A4A5A" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-textMuted"
      />
    </div>
  )
}

function Section({
  icon,
  label,
  color,
  count,
  children,
}: {
  icon: React.ReactNode
  label: string
  color: string
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 font-extrabold text-[10px] tracking-widest uppercase" style={{ color }}>
          <span className="flex items-center justify-center rounded-lg" style={{ width: 24, height: 24, backgroundColor: `${color}1A`, border: `1px solid ${color}55` }}>
            {icon}
          </span>
          {label}
        </span>
        <CountBadge n={count} color={color} />
      </div>
      {children}
    </div>
  )
}

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full font-extrabold text-sm flex-shrink-0"
        style={{ width: 40, height: 40, backgroundColor: '#F5C842', color: '#0A0A0F' }}
      >
        {(user.full_name ?? user.email).charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-white font-bold text-sm truncate">{user.full_name ?? 'Sans nom'}</p>
        <p className="text-textSub text-xs truncate">{user.email}</p>
      </div>
    </div>
  )
}

function ClientCard({
  user,
  onSetStatus,
  onSetPlan,
  onRemove,
}: {
  user: AdminUser
  onSetStatus: (id: string, status: AdminUser['status']) => void
  onSetPlan: (id: string, plan: 'free' | 'pro') => void
  onRemove: (id: string) => void
}) {
  const isPro = String(user.subscription_plan).toLowerCase() === 'pro'
  const statusLabel = ({ approved: 'APPROUVÉ', pending: 'EN ATTENTE', rejected: 'REFUSÉ', admin: 'ADMIN' } as Record<string, string>)[user.status] ?? user.status.toUpperCase()
  const statusColor = ({ approved: '#22C55E', pending: '#F5C842', rejected: '#EF4444', admin: '#A78BFA' } as Record<string, string>)[user.status] ?? '#8A8A9A'

  return (
    <div className="rounded-2xl p-3.5 mb-2.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <UserIdentity user={user} />

      <div className="flex items-center gap-2 mt-3 mb-3">
        <span className="rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wider" style={{ backgroundColor: `${statusColor}1A`, border: `1px solid ${statusColor}`, color: statusColor }}>
          {statusLabel}
        </span>
        <span
          className="rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wider"
          style={{ backgroundColor: isPro ? '#052E16' : '#1A1A24', border: `1px solid ${isPro ? '#166534' : '#3A3A4A'}`, color: isPro ? '#22C55E' : '#8A8A9A' }}
        >
          {isPro ? 'PRO' : 'FREE'}
        </span>
      </div>

      {isPro ? (
        <div
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 mb-2.5 font-bold text-xs"
          style={{ backgroundColor: '#052E16', border: '1px solid #166534', color: '#22C55E' }}
        >
          <Crown size={14} /> Plan Pro actif
        </div>
      ) : (
        <button
          onClick={() => onSetPlan(user.id, 'pro')}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 mb-2.5 font-bold text-xs"
          style={{ backgroundColor: '#1A1400', border: '1px solid #D4A82E', color: '#F5C842' }}
        >
          <Crown size={14} /> Activer plan Pro
        </button>
      )}

      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => onSetStatus(user.id, 'approved')}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold"
          style={{ backgroundColor: '#052E1633', border: '1px solid #166534', color: '#22C55E' }}
        >
          <CheckCircle2 size={13} /> Approuver
        </button>
        <button
          onClick={() => onSetStatus(user.id, 'rejected')}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold"
          style={{ backgroundColor: '#200A0A33', border: '1px solid #7F1D1D', color: '#EF4444' }}
        >
          <XCircle size={13} /> Rejeter
        </button>
      </div>
      <button
        onClick={() => onRemove(user.id)}
        className="w-full flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold"
        style={{ backgroundColor: '#200A0A1A', border: '1px solid #7F1D1D', color: '#EF4444' }}
      >
        <Trash2 size={13} /> Supprimer
      </button>
    </div>
  )
}
