type RiskLevel = 'Faible' | 'Modéré' | 'Élevé'

const CONFIG: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Faible: { bg: '#0F2918', text: '#22C55E', border: '#166534' },
  Modéré: { bg: '#1F1A0A', text: '#F5C842', border: '#854D0E' },
  Élevé: { bg: '#200A0A', text: '#EF4444', border: '#7F1D1D' },
}

export function RiskBadge({ level, size = 'md' }: { level: RiskLevel; size?: 'sm' | 'md' }) {
  const c = CONFIG[level]
  const small = size === 'sm'
  return (
    <span
      className="inline-block rounded-md font-bold"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        padding: small ? '2px 6px' : '4px 8px',
        fontSize: small ? '10px' : '11px',
        letterSpacing: '0.5px',
      }}
    >
      {level.toUpperCase()}
    </span>
  )
}
