import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Tag, Target, ShieldOff, Star, Check, Building2, ChevronRight, Lock } from 'lucide-react'
import { useAlerts } from '../hooks/useData'
import { supabase, type DbAlert } from '../lib/supabase'
import { RefreshButton } from '../components/RefreshButton'
import { NotificationBell } from '../components/NotificationBell'
import { markAlertRead, useAlertAction, useReadIds } from '../hooks/useProfileStats'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../lib/theme'
import { useAppStore } from '../lib/store'

// Petit indicateur "verrouillé Pro" — remplace une valeur sensible (type
// d'ordre, cours limite, objectifs) sans jamais laisser deviner sa couleur
// ou sa valeur réelle, contrairement à un simple flou.
function LockedValue({ compact }: { compact?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigate('/abonnement')
      }}
      className="inline-flex items-center gap-1 rounded-md font-extrabold"
      style={{ backgroundColor: '#1F1A0A', color: '#F5C842', border: '1px solid #F5C842', fontSize: compact ? 9.5 : 10.5, padding: compact ? '2px 6px' : '3px 8px' }}
    >
      <Lock size={compact ? 9 : 10} /> Pro
    </button>
  )
}

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

// Petit historique réel + cours actuel réel pour le mini-graphique de la
// carte — une seule lecture (pas de temps réel ici, le bouton "Actualiser"
// de la liste suffit à rafraîchir).
function useCardMarketSnapshot(ticker: string | null) {
  const [closes, setCloses] = useState<number[]>([])
  const [cours, setCours] = useState<number | null>(null)

  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    Promise.all([
      supabase.from('brvm_history').select('cours').eq('ticker', ticker).order('day', { ascending: true }),
      supabase.from('brvm_cours').select('cours').eq('ticker', ticker).maybeSingle(),
    ]).then(([hist, live]) => {
      if (cancelled) return
      setCloses((hist.data ?? []).map((h) => h.cours))
      setCours(live.data?.cours ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [ticker])

  return { closes, cours }
}

function Row({ icon: Icon, label, value, valueColor, last }: { icon: typeof Tag; label: string; value: ReactNode; valueColor?: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2" style={!last ? { borderBottom: undefined } : undefined}>
      <span className="flex items-center gap-2 text-[11.5px] text-textSub">
        <Icon size={13} color="#8A8A9A" /> {label}
      </span>
      <span className="font-bold text-xs" style={{ color: valueColor ?? '#FFFFFF' }}>
        {value}
      </span>
    </div>
  )
}

function AlertCard({ alert, isNew }: { alert: DbAlert; isNew: boolean }) {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const content = parseContent(alert.content)
  const { saved, toggleSaved } = useAlertAction(alert.id)
  const { closes, cours } = useCardMarketSnapshot(alert.ticker)
  const isBuy = alert.type === 'achat'
  const signal = isBuy ? 'ACHAT' : 'VENDRE'
  const accent = isBuy ? '#22C55E' : '#EF4444'
  const accentDark = isBuy ? '#04210E' : '#2A0808'

  const gainValue = content.gainPotential ? parseFloat(content.gainPotential) : null
  const gainPct = gainValue != null && Number.isFinite(gainValue) ? Math.min(Math.max(gainValue, 0), 100) : null

  // Sparkline SVG à partir de l'historique réel (+ cours du jour si absent).
  const values = closes.length && cours != null && closes[closes.length - 1] !== cours ? [...closes, cours] : closes
  let sparkPoints = ''
  if (values.length > 1) {
    const mn = Math.min(...values)
    const mx = Math.max(...values)
    const range = mx - mn || 1
    sparkPoints = values
      .map((v, i) => {
        const x = 2 + (i * 106) / (values.length - 1)
        const y = 30 - ((v - mn) / range) * 24 - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  return (
    <div
      onClick={() => navigate(`/alertes/${alert.id}`)}
      className={`rounded-3xl p-4 mb-4 cursor-pointer tappable relative ${isNew ? 'new-item-glow' : ''}`}
      style={isNew ? { backgroundColor: '#111118', border: '1.5px solid #F5C842' } : { backgroundColor: '#111118', border: '1px solid #23232E' }}
    >
      {isNew && (
        <span
          className="absolute -top-2 left-4 rounded-full font-extrabold uppercase"
          style={{ backgroundColor: '#F5C842', color: '#0A0A0F', fontSize: 9, padding: '2px 8px', letterSpacing: 0.4 }}
        >
          Nouveau
        </span>
      )}
      <div className="flex items-center gap-3 mb-3.5">
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 38, height: 38, border: '1px solid #2A2A3A' }}
        >
          <Building2 size={16} color="#F5C842" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm text-white truncate">{alert.stock_name}</p>
          <span className="flex items-center gap-1 text-[10px] text-textMuted">
            <Calendar size={11} /> {formatAlertDateTime(new Date(alert.created_at))} · {alert.horizon === 'long' ? 'Long terme' : 'Court terme'}
          </span>
        </div>
        {isPro ? (
          <span
            className="shrink-0 rounded-[9px] font-extrabold"
            style={{ backgroundColor: accent, color: accentDark, fontSize: 11.5, padding: '6px 12px', letterSpacing: 0.3 }}
          >
            {signal}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/abonnement')
            }}
            className="shrink-0 flex items-center gap-1 rounded-[9px] font-extrabold"
            style={{ backgroundColor: '#1F1A0A', color: '#F5C842', border: '1px solid #F5C842', fontSize: 10.5, padding: '6px 10px' }}
          >
            <Lock size={11} /> Signal verrouillé
          </button>
        )}
        <ChevronRight size={16} color="#4A4A5A" className="shrink-0" />
      </div>

      {cours != null && (
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <p className="text-textMuted text-[9px] uppercase tracking-wide mb-0.5">Cours actuel</p>
            <p className="font-extrabold text-lg text-white">{formatPrice(cours)}</p>
          </div>
          {sparkPoints && (
            <svg width={110} height={36} viewBox="0 0 110 36">
              <polyline points={sparkPoints} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      {gainPct != null && (
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-textSub text-[10.5px] font-bold">Potentiel de gain moyen</span>
            <span className="font-extrabold text-[13px]" style={{ color: accent }}>
              {content.gainPotential}
              {content.gainPotential?.includes('%') ? '' : '%'}
            </span>
          </div>
          <div className="h-1.5 rounded" style={{ backgroundColor: '#1A1A24' }}>
            <div className="h-full rounded" style={{ width: `${gainPct}%`, backgroundColor: accent }} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0.5 mb-3.5">
        {alert.price_target != null && <Row icon={Tag} label="Cours limite" value={isPro ? formatPrice(alert.price_target) : <LockedValue compact />} />}
        {(alert.objectif_1 != null || alert.objectif_2 != null) && (
          <Row
            icon={Target}
            label="Objectifs"
            value={
              isPro
                ? [alert.objectif_1, alert.objectif_2].filter((v) => v != null).map((v) => formatPrice(v as number)).join(' · ')
                : <LockedValue compact />
            }
            valueColor={isPro ? accent : undefined}
          />
        )}
        {alert.stop_loss != null && (
          <Row icon={ShieldOff} label="Stop loss" value={isPro ? formatPrice(alert.stop_loss) : <LockedValue compact />} valueColor={isPro ? '#EF4444' : undefined} last />
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          markAlertRead(alert.id)
          toggleSaved()
        }}
        className="w-full rounded-xl py-3 flex items-center justify-center gap-2 font-extrabold text-[12.5px]"
        style={saved ? { backgroundColor: '#052E16', color: '#22C55E', border: '1px solid #166534' } : { backgroundColor: '#1F1A0A', color: '#F5C842', border: '1px solid #F5C842' }}
      >
        {saved ? (
          <>
            <Check size={14} /> Ajouté au suivi
          </>
        ) : (
          <>
            <Star size={14} /> Ajouter au suivi
          </>
        )}
      </button>
    </div>
  )
}

export default function Alertes() {
  const { alerts, loading, error, refetch } = useAlerts()
  const setUnread = useAppStore((s) => s.setUnreadAlertsCount)
  const { ids: readIds, loaded: readsLoaded } = useReadIds('alert')

  const sorted = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [alerts]
  )

  useEffect(() => {
    if (!readsLoaded) return
    const unread = alerts.filter((a) => !readIds.has(a.id)).length
    setUnread(unread)
  }, [alerts, readIds, readsLoaded, setUnread])

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

        {!loading && !error && sorted.map((a) => <AlertCard key={a.id} alert={a} isNew={readsLoaded && !readIds.has(a.id)} />)}
      </div>
    </div>
  )
}
