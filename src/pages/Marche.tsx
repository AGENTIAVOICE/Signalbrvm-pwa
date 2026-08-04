import { Activity, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { rows, loading, error, refetch } = useBrvmMarket()

  const lastUpdated = rows
    .map((r) => r.updated_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  // Les 3 meilleures performances du jour, mises en avant à part — le reste
  // du marché est trié par ordre de croissance (variation du jour, du plus
  // faible au plus fort).
  const { top3, rest } = useMemo(() => {
    const withVar = rows.filter((r) => r.variation_pct != null)
    const sortedDesc = [...withVar].sort((a, b) => (b.variation_pct ?? 0) - (a.variation_pct ?? 0))
    const bestTickers = new Set(sortedDesc.slice(0, 3).map((r) => r.ticker))
    const remaining = rows.filter((r) => !bestTickers.has(r.ticker)).sort((a, b) => (a.variation_pct ?? -Infinity) - (b.variation_pct ?? -Infinity))
    return { top3: sortedDesc.slice(0, 3), rest: remaining }
  }, [rows])

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

        {!loading && !error && top3.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Trophy size={14} color="#F5C842" />
              <p className="text-white font-bold text-xs uppercase tracking-wide">Meilleures performances du jour</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {top3.map((r, i) => (
                <button
                  key={r.ticker}
                  onClick={() => navigate(`/marche/${r.ticker}`)}
                  className="rounded-xl p-2.5 text-left tappable relative"
                  style={{ backgroundColor: '#1F1A0A', border: '1px solid #F5C842' }}
                >
                  <span
                    className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full font-extrabold"
                    style={{ width: 15, height: 15, fontSize: 9, backgroundColor: '#F5C842', color: '#0A0A0F' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-white font-bold text-xs mb-1">{r.ticker}</p>
                  <p className="text-white text-xs font-semibold">{r.cours != null ? formatPrice(r.cours) : '—'}</p>
                  <p className="text-buy text-[11px] font-extrabold mt-0.5">{r.variation_pct != null ? formatPercent(r.variation_pct) : '—'}</p>
                </button>
              ))}
            </div>
            <div className="h-px mt-4" style={{ backgroundColor: '#1E1E2A' }} />
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rest.map((r) => (
              <button
                key={r.ticker}
                onClick={() => navigate(`/marche/${r.ticker}`)}
                className="rounded-xl p-3 text-left tappable"
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
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
