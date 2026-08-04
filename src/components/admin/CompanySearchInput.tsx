import { useEffect, useRef, useState } from 'react'
import { Building2, Search } from 'lucide-react'
import { searchCompanies, type CompanySuggestion } from '../../hooks/useData'
import { formatPrice } from '../../lib/theme'

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (company: CompanySuggestion) => void
}

// Champ de recherche d'entreprise : dès que l'admin tape, on suggère les
// entreprises correspondantes (nom réel + cours réel du jour) tirées de
// Supabase. En cliquant sur une suggestion, le formulaire est pré-rempli.
export function CompanySearchInput({ value, onChange, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchCompanies(value)
      setSuggestions(results)
      setLoading(false)
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} color="#4A4A5A" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Rechercher une entreprise (nom ou ticker)..."
          className="w-full rounded-xl py-3 pl-9 pr-3 text-sm text-white outline-none"
          style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
        />
      </div>

      {open && value.trim() && (
        <div
          className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-xl"
          style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
        >
          {loading && <p className="px-3 py-3 text-xs text-textSub">Recherche…</p>}
          {!loading && suggestions.length === 0 && <p className="px-3 py-3 text-xs text-textSub">Aucune entreprise trouvée.</p>}
          {!loading &&
            suggestions.map((c) => (
              <button
                key={c.ticker}
                type="button"
                onClick={() => {
                  onSelect(c)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                style={{ borderBottom: '1px solid #2A2A3A' }}
              >
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 32, height: 32, backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
                >
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <Building2 size={14} color="#F5C842" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{c.short_name || c.full_name}</p>
                  <p className="text-textMuted text-[10px] truncate">
                    {c.ticker}
                    {c.sector ? ` · ${c.sector}` : ''}
                  </p>
                </div>
                {c.cours != null && <span className="text-primary text-xs font-bold shrink-0">{formatPrice(c.cours)}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
