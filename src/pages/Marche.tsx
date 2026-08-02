import { Activity } from 'lucide-react'
import { useBrvmMarket } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import { ProLock } from '../components/ProLock'
import { RefreshButton } from '../components/RefreshButton'
import { formatPrice, formatPercent, formatRelativeTime } from '../lib/theme'

function todayLabel() {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function varColor(v: number | null) {
  if (v == null || v === 0) return '#94A3B8'
  return v > 0 ? '#22C55E' : '#EF4444'
}

export default function Marche() {
  const { isPro } = useAuth()
  if (!isPro) return <ProLock />
  return <MarcheInner />
}

function MarcheInner() {
  const { rows, loading, error, refetch } = useBrvmMarket()

  const lastUpdated = rows
    .map((r) => r.updated_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">{todayLabel()}</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Marché</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <RefreshButton onClick={refetch} loading={loading} />
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: '#052E16', border: '1px solid #166534' }}
            >
              <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#22C55E' }} />
              <span className="text-buy text-[11px] font-extrabold tracking-wide">BRVM Live</span>
            </div>
          </div>
          {lastUpdated && (
            <span className="text-textMuted text-[10px]">Mis à jour {formatRelativeTime(new Date(lastUpdated))}</span>
          )}
        </div>
      </div>

      <div className="px-4">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: '#111118' }} />
            ))}
          </div>
        )}

        {error && !loading && <p className="text-sell text-sm text-center py-10">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rows.map((r) => (
              <div
                key={r.ticker}
                className="rounded-xl p-3"
                style={{ backgroundColor: '#111118', border: `1px solid ${varColor(r.variation_pct)}33` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold text-sm">{r.ticker}</span>
                  <Activity size={12} color={varColor(r.variation_pct)} />
                </div>
                {r.company_name && (
                  <p className="text-textMuted text-[10px] truncate mb-1.5">{r.company_name}</p>
                )}
                <p className="text-white text-sm font-semibold">{r.cours != null ? formatPrice(r.cours) : '—'}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: varColor(r.variation_pct) }}>
                  {r.variation_pct != null ? formatPercent(r.variation_pct) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
