import { useEffect, useMemo } from 'react'
import { Bell, Calendar, Target, Zap } from 'lucide-react'
import { useAlerts } from '../hooks/useData'
import type { DbAlert } from '../lib/supabase'
import { SignalBadge } from '../components/SignalBadge'
import { RefreshButton } from '../components/RefreshButton'
import { markAlertRead } from '../hooks/useProfileStats'
import { formatRelativeTime, formatPrice } from '../lib/theme'
import { useAppStore } from '../lib/store'

function parseContent(raw: string | null) {
  if (!raw) return { message: '', priceMax: null as number | null, gainPotential: null as string | null }
  try {
    const p = JSON.parse(raw)
    if (typeof p === 'object' && p !== null && 'message' in p) {
      return { message: p.message || '', priceMax: p.price_max ?? null, gainPotential: p.gain_potential ?? null }
    }
  } catch {
    /* plain text content */
  }
  return { message: raw, priceMax: null, gainPotential: null }
}

function AlertCard({ alert }: { alert: DbAlert }) {
  const content = parseContent(alert.content)
  const signal = alert.type === 'achat' ? 'ACHAT' : 'VENDRE'
  const accent = alert.type === 'achat' ? '#22C55E' : '#EF4444'

  return (
    <div
      onClick={() => markAlertRead(alert.id)}
      className="rounded-2xl p-4 mb-3 cursor-pointer"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A', borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <SignalBadge signal={signal} size="sm" />
          <span className="text-white font-bold text-sm">{alert.stock_name}</span>
        </div>
        <span className="text-textMuted text-xs flex items-center gap-1">
          <Calendar size={12} /> {formatRelativeTime(new Date(alert.created_at))}
        </span>
      </div>

      {content.message && <p className="text-textSub text-sm leading-relaxed mb-3">{content.message}</p>}

      <div className="flex flex-wrap gap-4 mt-2">
        {alert.price_target != null && (
          <div className="flex items-center gap-1.5">
            <Target size={14} color="#F5C842" />
            <span className="text-white text-xs font-semibold">{formatPrice(alert.price_target)}</span>
          </div>
        )}
        {content.gainPotential && (
          <div className="flex items-center gap-1.5">
            <Zap size={14} color="#22C55E" />
            <span className="text-buy text-xs font-semibold">{content.gainPotential}</span>
          </div>
        )}
        {alert.horizon && (
          <span className="text-textMuted text-xs uppercase tracking-wide">
            Horizon {alert.horizon === 'long' ? 'long terme' : 'court terme'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Alertes() {
  const { alerts, loading, error, refetch } = useAlerts()
  const setUnread = useAppStore((s) => s.setUnreadAlertsCount)

  const sorted = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [alerts]
  )

  useEffect(() => {
    setUnread(alerts.length)
  }, [alerts, setUnread])

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Aujourd'hui</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Alertes</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={refetch} loading={loading} />
          <Bell size={22} color="#F5C842" />
        </div>
      </div>

      <div className="px-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: '#111118' }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-sell text-sm mb-3">{error}</p>
            <button onClick={refetch} className="text-primary text-sm font-semibold">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-20">
            <Bell size={40} color="#4A4A5A" className="mx-auto mb-3" />
            <p className="text-textSub text-sm">Aucune alerte pour le moment</p>
          </div>
        )}

        {!loading && !error && sorted.map((a) => <AlertCard key={a.id} alert={a} />)}
      </div>
    </div>
  )
}
