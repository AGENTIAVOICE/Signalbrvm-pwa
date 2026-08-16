import {
  Activity,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowDownAZ,
  ChevronRight,
  Search,
  X,
  Layers,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrvmMarket } from '../hooks/useData'
import { usePortfolioSimulator } from '../hooks/usePortfolioSimulator'
import { supabase } from '../lib/supabase'
import { sectorIcon } from '../lib/sectorIcons'
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
  const [sortMode, setSortMode] = useState<'asc' | 'desc' | 'name' | 'sector'>('asc')
  const [query, setQuery] = useState('')
  const [sectorByTicker, setSectorByTicker] = useState<Record<string, string>>({})
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('companies')
      .select('ticker, sector')
      .then(({ data }) => {
        setSectorByTicker(Object.fromEntries((data ?? []).filter((c) => c.sector).map((c) => [c.ticker, c.sector as string])))
      })
  }, [])

  const ownedTickers = useMemo(() => new Set(positions.filter((p) => p.quantity > 0).map((p) => p.ticker)), [positions])

  const lastUpdated = rows
    .map((r) => r.updated_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  // Les 3 meilleures performances du jour, mises en avant à part — le reste
  // du marché est trié selon le choix de l'utilisateur (croissant,
  // décroissant, ou par nom), ou filtré par recherche/secteur.
  const { top3, rest } = useMemo(() => {
    const withVar = rows.filter((r) => r.variation_pct != null)
    const sortedDesc = [...withVar].sort((a, b) => (b.variation_pct ?? 0) - (a.variation_pct ?? 0))
    const bestTickers = new Set(sortedDesc.slice(0, 3).map((r) => r.ticker))
    let remaining = [...rows.filter((r) => !bestTickers.has(r.ticker))]

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      remaining = remaining.filter((r) => r.ticker.toLowerCase().includes(q) || (r.company_name ?? '').toLowerCase().includes(q))
    }
    if (sortMode === 'sector' && selectedSector) {
      remaining = remaining.filter((r) => sectorByTicker[r.ticker] === selectedSector)
    }

    if (sortMode === 'asc') remaining.sort((a, b) => (a.variation_pct ?? -Infinity) - (b.variation_pct ?? -Infinity))
    else if (sortMode === 'desc') remaining.sort((a, b) => (b.variation_pct ?? -Infinity) - (a.variation_pct ?? -Infinity))
    else remaining.sort((a, b) => (a.company_name ?? a.ticker).localeCompare(b.company_name ?? b.ticker))
    return { top3: sortedDesc.slice(0, 3), rest: remaining }
  }, [rows, sortMode, query, selectedSector, sectorByTicker])

  // Regroupement des entreprises par secteur d'activité, pour la navigation
  // "Secteur d'activité" — calculé une fois que les secteurs sont chargés.
  const sectorGroups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      const sector = sectorByTicker[r.ticker]
      if (!sector) continue
      counts.set(sector, (counts.get(sector) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows, sectorByTicker])

  const showingSectors = sortMode === 'sector' && !selectedSector && !query.trim()

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
        {!loading && !error && (
          <div className="relative mb-3">
            <Search size={15} color="#4A4A5A" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une entreprise (nom ou ticker)..."
              className="w-full rounded-xl py-2.5 pl-9 pr-9 text-sm text-white outline-none"
              style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Effacer">
                <X size={15} color="#4A4A5A" />
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: '#111118' }} />
            ))}
          </div>
        )}

        {error && !loading && <p className="text-sell text-sm text-center py-10">{error}</p>}

        {!loading && !error && top3.length > 0 && !query.trim() && !selectedSector && !showingSectors && (
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

        {!loading && !error && !query.trim() && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <SortButton active={sortMode === 'asc'} onClick={() => { setSortMode('asc'); setSelectedSector(null) }} icon={ArrowDown} label="Flop" />
            <SortButton active={sortMode === 'desc'} onClick={() => { setSortMode('desc'); setSelectedSector(null) }} icon={ArrowUp} label="Top" />
            <SortButton active={sortMode === 'name'} onClick={() => { setSortMode('name'); setSelectedSector(null) }} icon={ArrowDownAZ} label="Nom" />
            <SortButton active={sortMode === 'sector'} onClick={() => setSortMode('sector')} icon={Layers} label="Secteur d'activité" />
          </div>
        )}

        {sortMode === 'sector' && selectedSector && !query.trim() && (
          <button
            onClick={() => setSelectedSector(null)}
            className="flex items-center gap-1.5 mb-3 rounded-full px-3 py-1.5 text-[11px] font-bold tappable"
            style={{ backgroundColor: '#1F1A0A', color: '#F5C842', border: '1px solid #F5C842' }}
          >
            <X size={12} /> {selectedSector}
          </button>
        )}

        {showingSectors && (
          <div className="grid grid-cols-2 gap-2.5">
            {sectorGroups.map(([sector, count]) => {
              const Icon = sectorIcon(sector)
              return (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className="rounded-xl p-3.5 text-left tappable"
                  style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
                >
                  <div className="flex items-center justify-center rounded-lg mb-2" style={{ width: 28, height: 28, backgroundColor: '#1A1A24' }}>
                    <Icon size={14} color="#F5C842" />
                  </div>
                  <p className="text-white font-bold text-xs mb-0.5">{sector}</p>
                  <p className="text-textMuted text-[10px]">
                    {count} valeur{count > 1 ? 's' : ''}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {!loading && !error && !showingSectors && (
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
