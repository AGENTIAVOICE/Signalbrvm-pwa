import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, FileText, Tag, TrendingUp, TrendingDown, Star, Check, Building2 } from 'lucide-react'
import { useAlerts } from '../hooks/useData'
import type { DbAlert } from '../lib/supabase'
import { RefreshButton } from '../components/RefreshButton'
import { NotificationBell } from '../components/NotificationBell'
import { markAlertRead, useAlertAction } from '../hooks/useProfileStats'
import { formatPrice } from '../lib/theme'
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

// Aujourd'hui / Hier + heure locale (Côte d'Ivoire = GMT/Africa-Abidjan)
function formatAlertDateTime(date: Date): string {
  const tz = 'Africa/Abidjan'
  const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: tz })
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  const time = date.toLocaleTimeString('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit' })

  if (dayKey(date) === dayKey(today)) return `Aujourd'hui • ${time}`
  if (dayKey(date) === dayKey(yesterday)) return `Hier • ${time}`
  return `${date.toLocaleDateString('fr-FR', { timeZone: tz, day: '2-digit', month: 'short' })} • ${time}`
}

function Row({ icon: Icon, label, value, valueColor, last }: { icon: typeof Tag; label: string; value: string; valueColor?: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={!last ? { borderBottom: '1px solid #2A2A3A' } : undefined}
    >
      <span className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase text-textSub">
        <Icon size={14} color="#8A8A9A" /> {label}
      </span>
      <span className="font-extrabold text-sm" style={{ color: valueColor ?? '#FFFFFF' }}>
        {value}
      </span>
    </div>
  )
}

function AlertCard({ alert }: { alert: DbAlert }) {
  const navigate = useNavigate()
  const content = parseContent(alert.content)
  const { saved, toggleSaved } = useAlertAction(alert.id)
  const isBuy = alert.type === 'achat'
  const signal = isBuy ? 'ACHAT' : 'VENDRE'
  const accent = isBuy ? '#22C55E' : '#EF4444'
  const opportunityBg = isBuy ? '#052E16' : '#200A0A'
  const opportunityBorder = isBuy ? '#166534' : '#7F1D1D'
  const OpportunityIcon = isBuy ? TrendingUp : TrendingDown

  const rows: { icon: typeof Tag; label: string; value: string; valueColor?: string }[] = [
    { icon: FileText, label: "Type d'ordre", value: signal, valueColor: accent },
  ]
  if (alert.price_target != null) rows.push({ icon: Tag, label: 'Cours limit', value: formatPrice(alert.price_target) })
  if (alert.horizon) rows.push({ icon: Calendar, label: 'Horizon', value: alert.horizon === 'long' ? 'Long terme' : 'Court terme' })
  if (content.gainPotential) rows.push({ icon: TrendingUp, label: 'Potentiel de gain moyen', value: content.gainPotential, valueColor: '#22C55E' })

  return (
    <div
      onClick={() => navigate(`/alertes/${alert.id}`)}
      className="rounded-3xl p-4 mb-4 cursor-pointer tappable"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold tracking-wide"
          style={{ backgroundColor: opportunityBg, color: accent, border: `1.5px solid ${opportunityBorder}` }}
        >
          {signal}
        </span>
        <span className="flex items-center gap-1 text-xs text-textMuted">
          <Calendar size={12} /> {formatAlertDateTime(new Date(alert.created_at))}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 44, height: 44, backgroundColor: '#1A1A24', border: '1.5px solid #2A2A3A' }}
        >
          <Building2 size={20} color="#F5C842" />
        </div>
        <div>
          <p className="font-extrabold text-[17px] leading-tight text-white">{alert.stock_name}</p>
        </div>
      </div>

      <div>
        {rows.map((r, i) => (
          <Row key={r.label} icon={r.icon} label={r.label} value={r.value} valueColor={r.valueColor} last={i === rows.length - 1} />
        ))}
      </div>

      <div
        className="rounded-2xl p-3 mt-3 flex items-start gap-2.5"
        style={{ backgroundColor: opportunityBg, border: `1px solid ${opportunityBorder}` }}
      >
        <OpportunityIcon size={18} color={accent} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-extrabold text-[11px] tracking-wide uppercase mb-0.5" style={{ color: accent }}>
            {isBuy ? 'Opportunité identifiée' : 'Signal de vente'}
          </p>
          <p className="text-xs leading-relaxed text-textSub">
            {content.message ||
              (isBuy
                ? 'Les signaux techniques et fondamentaux indiquent un potentiel de hausse intéressant.'
                : 'Les signaux techniques et fondamentaux indiquent un risque de baisse sur cette valeur.')}
          </p>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          markAlertRead(alert.id)
          toggleSaved()
        }}
        className="w-full mt-3 rounded-xl py-3 flex items-center justify-center gap-2 font-extrabold text-sm"
        style={{ backgroundColor: saved ? '#22C55E' : '#F5C842', color: '#0A0A0F' }}
      >
        {saved ? (
          <>
            <Check size={16} /> Ajouté au suivi
          </>
        ) : (
          <>
            <Star size={16} /> Ajouter au suivi
          </>
        )}
      </button>
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
          <NotificationBell />
        </div>
      </div>

      {!loading && !error && sorted.length > 0 && (
        <p className="px-5 pb-3 text-white font-bold text-sm">Alerte Recommandée</p>
      )}

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
