import { Activity, Trophy, ArrowUp, ArrowDown, ArrowDownAZ, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrvmMarket } from '../hooks/useData'
import { usePortfolioSimulator } from '../hooks/usePortfolioSimulator'
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

function SortButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof ArrowUp; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tappable"
      style={active ? { backgroundColor: '#1F1A0A', color: '#F5C842', border: '1px solid #F5C842' } : { backgroundColor: '#111118', color: '#8A8A9A', border: '1px solid #2A2A3A' }}
    >
      <Icon size={12} /> {label}
    </button>
  )
}

export default function Marche() {
  return <MarcheInner />
}

function MarcheInner() {
  const navigate = useNavigate()
  const { rows, loading, error, refetch } = useBrvmMarket()
  const { positions } = usePortfolioSimulator()
  const [sortMode, setSortMode] = useState<'asc' | 'desc' | 'name'>('asc')

  const ownedTickers = useMemo(() => new Set(positions.filter((p) => p.quantity > 0).map((p) => p.ticker)), [positions])

  const lastUpdated = rows
    .map((r) => r.updated_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  // Les 3 meilleures performances du jour, mises en avant à part — le reste
  // du marché est trié selon le choix de l'utilisateur (croissant,
  // décroissant, ou par nom).
  const { top3, rest } = useMemo(() => {
    const withVar = rows.filter((r) => r.variation_pct != null)
    const sortedDesc = [...withVar].sort((a, b) => (b.variation_pct ?? 0) - (a.variation_pct ?? 0))
    const bestTickers = new Set(sortedDesc.slice(0, 3).map((r) => r.ticker))
    const remaining = [...rows.filter((r) => !bestTickers.has(r.ticker))]
    if (sortMode === 'asc') remaining.sort((a, b) => (a.variation_pct ?? -Infinity) - (b.variation_pct ?? -Infinity))
    else if (sortMode === 'desc') remaining.sort((a, b) => (b.variation_pct ?? -Infinity) - (a.variation_pct ?? -Infinity))
    else remaining.sort((a, b) => (a.company_name ?? a.ticker).localeCompare(b.company_name ?? b.ticker))
    return { top3: sortedDesc.slice(0, 3), rest: remaining }
  }, [rows, sortMode])

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
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-buy text-[11px] font-extrabold">{r.variation_pct != null ? formatPercent(r.variation_pct) : '—'}</p>
                    <ChevronRight size={12} color="#7A6A2A" />
                  </div>
                </button>
              ))}
            </div>
            <div className="h-px mt-4" style={{ backgroundColor: '#1E1E2A' }} />
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center gap-1.5 mb-3">
            <SortButton active={sortMode === 'asc'} onClick={() => setSortMode('asc')} icon={ArrowUp} label="Flop" />
            <SortButton active={sortMode === 'desc'} onClick={() => setSortMode('desc')} icon={ArrowDown} label="Top" />
            <SortButton active={sortMode === 'name'} onClick={() => setSortMode('name')} icon={ArrowDownAZ} label="Nom" />
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rest.map((r) => {
              const owned = ownedTickers.has(r.ticker)
              return (
                <button
                  key={r.ticker}
                  onClick={() => navigate(`/marche/${r.ticker}`)}
                  className="rounded-xl p-3 text-left tappable"
                  style={
                    owned
                      ? { backgroundColor: '#1F1A0A', border: '1px solid #F5C842' }
                      : { backgroundColor: '#111118', border: `1px solid ${varColor(r.variation_pct)}33` }
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-sm">{r.ticker}</span>
                      {owned && <span className="rounded-full" style={{ width: 5, height: 5, backgroundColor: '#F5C842' }} />}
                    </span>
                    <div className="flex items-center gap-1">
                      <Activity size={12} color={varColor(r.variation_pct)} />
                      <ChevronRight size={13} color="#4A4A5A" />
                    </div>
                  </div>
                  {r.company_name && <p className="text-textMuted text-[10px] truncate mb-1.5">{r.company_name}</p>}
                  <p className="text-white text-sm font-semibold">{r.cours != null ? formatPrice(r.cours) : '—'}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: varColor(r.variation_pct) }}>
                    {r.variation_pct != null ? formatPercent(r.variation_pct) : '—'}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
