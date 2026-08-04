import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, X, Calendar, Percent, TrendingUp } from 'lucide-react'
import { useAnalyses } from '../hooks/useData'
import type { DbAnalysis } from '../lib/supabase'
import { RiskBadge } from '../components/RiskBadge'
import { RefreshButton } from '../components/RefreshButton'
import { formatGMTDate } from '../lib/theme'
import { markAnalysisRead } from '../hooks/useProfileStats'

export default function Analyses() {
  const navigate = useNavigate()
  const { analyses, loading, error, refetch } = useAnalyses()
  const [selected, setSelected] = useState<DbAnalysis | null>(null)

  function openAnalysis(a: DbAnalysis) {
    setSelected(a)
    markAnalysisRead(a.id)
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-3 flex items-end justify-between">
        <div>
          <p className="text-textSub text-[11px] font-semibold tracking-widest uppercase">Marché BRVM</p>
          <h1 className="text-white font-extrabold text-[26px] tracking-tight mt-0.5">Analyses</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={refetch} loading={loading} />
          <BarChart2 size={22} color="#F5C842" />
        </div>
      </div>

      <button
        onClick={() => navigate('/formations')}
        className="flex items-center gap-1.5 px-5 pb-3 text-xs font-bold"
        style={{ color: '#F5C842' }}
      >
        <TrendingUp size={14} /> BRVM · Nos Formations
      </button>
      <div style={{ borderBottom: '1px solid #1E1E2A' }} />


      <div className="px-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: '#111118' }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-sell text-sm mb-3">{error}</p>
            <button onClick={refetch} className="text-primary text-sm font-semibold">Réessayer</button>
          </div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div className="text-center py-20">
            <BarChart2 size={40} color="#4A4A5A" className="mx-auto mb-3" />
            <p className="text-textSub text-sm">Aucune analyse publiée</p>
          </div>
        )}

        {!loading && !error && analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => openAnalysis(a)}
            className="w-full text-left rounded-2xl p-4 mb-3 tappable"
            style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
          >
            <div className="flex items-center justify-between mb-2">
              {a.stock_name && <span className="text-primary font-bold text-xs uppercase tracking-wide">{a.stock_name}</span>}
              {a.risk_level && <RiskBadge level={a.risk_level} size="sm" />}
            </div>
            <h3 className="text-white font-bold text-base mb-1">{a.title}</h3>
            <div className="flex items-center gap-4 mt-2">
              {a.potential_percent != null && (
                <span className="flex items-center gap-1 text-buy text-xs font-semibold">
                  <Percent size={12} /> +{a.potential_percent}% potentiel
                </span>
              )}
              <span className="flex items-center gap-1 text-textMuted text-xs">
                <Calendar size={12} /> {formatGMTDate(new Date(a.created_at))}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0A0A0F' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
            <h2 className="text-white font-bold text-lg">Analyse</h2>
            <button onClick={() => setSelected(null)} className="text-textSub">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {selected.stock_name && (
              <span className="text-primary font-bold text-sm uppercase tracking-wide">{selected.stock_name}</span>
            )}
            <h1 className="text-white font-extrabold text-2xl mt-2 mb-3">{selected.title}</h1>
            <div className="flex items-center gap-3 mb-5">
              {selected.risk_level && <RiskBadge level={selected.risk_level} />}
              {selected.potential_percent != null && (
                <span className="text-buy text-sm font-bold">+{selected.potential_percent}% potentiel</span>
              )}
            </div>
            <p className="text-textSub text-sm leading-7 whitespace-pre-wrap">{selected.content}</p>
          </div>
        </div>
      )}
    </div>
  )
}
