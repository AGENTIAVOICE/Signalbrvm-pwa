import { useEffect, useMemo, useRef, useState } from 'react'
import { Users, Search, Shield, Crown, UserCheck, CheckCircle2, XCircle, Trash2, ChevronDown, GraduationCap } from 'lucide-react'
import { adminApi, listFormationAccess, grantFormationAccess, setPlanDuration, type AdminUser, type ExtraUserFields } from '../../lib/adminApi'
import { ScreenHeader } from '../../components/admin/AdminUI'

const PLAN_NAMES: Record<number, string> = {
  1: 'Découverte (1 mois)',
  3: 'Croissance (3 mois)',
  6: 'Performance (6 mois)',
  12: 'Élite (12 mois)',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [extraFields, setExtraFields] = useState<Record<string, ExtraUserFields>>({})
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
      const [data] = await Promise.all([adminApi.get<AdminUser[]>('/users'), listFormationAccess().then(setExtraFields)])
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

  async function toggleFormationAccess(id: string, access: boolean) {
    setExtraFields((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { plan_duration_months: null, plan_expires_at: null }), formation_access: access } }))
    try {
      await grantFormationAccess(id, access)
    } catch (err) {
      setExtraFields((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { plan_duration_months: null, plan_expires_at: null }), formation_access: !access } }))
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  async function activatePlan(id: string, months: 1 | 3 | 6 | 12) {
    setPlan(id, 'pro')
    await setPlanDuration(id, months)
    load(true)
  }

  async function deactivatePlan(id: string) {
    setPlan(id, 'free')
    await setPlanDuration(id, null)
    load(true)
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
          <ClientCard key={u.id} user={u} extra={extraFields[u.id]} onSetStatus={setStatus} onActivatePlan={activatePlan} onDeactivatePlan={deactivatePlan} onToggleFormation={toggleFormationAccess} onRemove={removeUser} />
        ))}
      </Section>

      <Section icon={<UserCheck size={16} color="#94A3B8" />} label="Clients Gratuits" color="#94A3B8" count={freeClients.length}>
        {freeClients.map((u) => (
          <ClientCard key={u.id} user={u} extra={extraFields[u.id]} onSetStatus={setStatus} onActivatePlan={activatePlan} onDeactivatePlan={deactivatePlan} onToggleFormation={toggleFormationAccess} onRemove={removeUser} />
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
  const [open, setOpen] = useState(false)
  if (count === 0) return null
  return (
    <div className="mb-6">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between mb-3 tappable">
        <span className="flex items-center gap-1.5 font-extrabold text-[10px] tracking-widest uppercase" style={{ color }}>
          <span className="flex items-center justify-center rounded-lg" style={{ width: 24, height: 24, backgroundColor: `${color}1A`, border: `1px solid ${color}55` }}>
            {icon}
          </span>
          {label}
        </span>
        <span className="flex items-center gap-2">
          <CountBadge n={count} color={color} />
          <ChevronDown size={16} color={color} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
        </span>
      </button>
      {open && children}
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
  extra,
  onSetStatus,
  onActivatePlan,
  onDeactivatePlan,
  onToggleFormation,
  onRemove,
}: {
  user: AdminUser
  extra?: ExtraUserFields
  onSetStatus: (id: string, status: AdminUser['status']) => void
  onActivatePlan: (id: string, months: 1 | 3 | 6 | 12) => void
  onDeactivatePlan: (id: string) => void
  onToggleFormation: (id: string, access: boolean) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isPro = String(user.subscription_plan).toLowerCase() === 'pro'
  const hasFormationAccess = !!extra?.formation_access
  const expiresAt = extra?.plan_expires_at ? new Date(extra.plan_expires_at) : null
  const startedAt = extra?.plan_started_at ? new Date(extra.plan_started_at) : null
  const planLabel = extra?.plan_duration_months ? PLAN_NAMES[extra.plan_duration_months] : null
  const statusLabel = ({ approved: 'APPROUVÉ', pending: 'EN ATTENTE', rejected: 'REFUSÉ', admin: 'ADMIN' } as Record<string, string>)[user.status] ?? user.status.toUpperCase()
  const statusColor = ({ approved: '#22C55E', pending: '#F5C842', rejected: '#EF4444', admin: '#A78BFA' } as Record<string, string>)[user.status] ?? '#8A8A9A'

  return (
    <div className="rounded-2xl p-3.5 mb-2.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <UserIdentity user={user} />
          </div>
          <ChevronDown size={16} color="#8A8A9A" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }} />
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wider" style={{ backgroundColor: `${statusColor}1A`, border: `1px solid ${statusColor}`, color: statusColor }}>
            {statusLabel}
          </span>
          <span
            className="rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wider"
            style={{ backgroundColor: isPro ? '#052E16' : '#1A1A24', border: `1px solid ${isPro ? '#166534' : '#3A3A4A'}`, color: isPro ? '#22C55E' : '#8A8A9A' }}
          >
            {isPro ? planLabel ?? 'PRO' : 'FREE'}
          </span>
          {hasFormationAccess && (
            <span
              className="rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wider"
              style={{ backgroundColor: '#1A0F2E', border: '1px solid #6D28D9', color: '#A78BFA' }}
            >
              FORMATION
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3">
          {isPro ? (
            <div className="rounded-xl p-3 mb-2.5" style={{ backgroundColor: '#052E16', border: '1px solid #166534' }}>
              <p className="flex items-center gap-1.5 font-bold text-xs mb-1" style={{ color: '#22C55E' }}>
                <Crown size={14} /> Formule {planLabel ?? ''} active
              </p>
              {startedAt && expiresAt && (
                <p className="text-[11px]" style={{ color: '#8AD8A8' }}>
                  Du {startedAt.toLocaleDateString('fr-FR')} au {expiresAt.toLocaleDateString('fr-FR')}
                </p>
              )}
              {!startedAt && expiresAt && <p className="text-[11px]" style={{ color: '#8AD8A8' }}>Expire le {expiresAt.toLocaleDateString('fr-FR')}</p>}
              <button
                onClick={() => onDeactivatePlan(user.id)}
                className="w-full mt-2 py-2 rounded-lg text-[11px] font-bold"
                style={{ backgroundColor: '#200A0A', border: '1px solid #7F1D1D', color: '#EF4444' }}
              >
                Repasser en Gratuit maintenant
              </button>
            </div>
          ) : (
            <div className="rounded-xl p-3 mb-2.5" style={{ backgroundColor: '#1A1400', border: '1px solid #D4A82E' }}>
              <p className="flex items-center gap-1.5 font-bold text-xs mb-2" style={{ color: '#F5C842' }}>
                <Crown size={14} /> Activer une formule payante
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {([1, 3, 6, 12] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onActivatePlan(user.id, m)}
                    className="rounded-lg py-2 text-[11px] font-bold"
                    style={{ backgroundColor: '#0A0A0F', border: '1px solid #3A3A4A', color: '#F5C842' }}
                  >
                    {PLAN_NAMES[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onToggleFormation(user.id, !hasFormationAccess)}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 mb-2.5 font-bold text-xs"
            style={
              hasFormationAccess
                ? { backgroundColor: '#1A0F2E', border: '1px solid #6D28D9', color: '#A78BFA' }
                : { backgroundColor: '#111118', border: '1px solid #2A2A3A', color: '#8A8A9A' }
            }
          >
            <GraduationCap size={14} /> {hasFormationAccess ? 'Accès formation actif (produit payant séparé)' : 'Activer l\u2019accès formation (après paiement Chariow)'}
          </button>

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
      )}
    </div>
  )
}
