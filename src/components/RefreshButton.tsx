import { RefreshCw } from 'lucide-react'

export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label="Actualiser"
      className="flex items-center justify-center rounded-full"
      style={{ width: 36, height: 36, backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <RefreshCw size={16} color="#F5C842" className={loading ? 'animate-spin' : ''} />
    </button>
  )
}
