type Signal = 'ACHAT' | 'VENDRE' | 'NEUTRE'

const CONFIG: Record<Signal, { bg: string; text: string; border: string }> = {
  ACHAT: { bg: '#052E16', text: '#22C55E', border: '#166534' },
  VENDRE: { bg: '#200A0A', text: '#EF4444', border: '#7F1D1D' },
  NEUTRE: { bg: '#0F172A', text: '#94A3B8', border: '#334155' },
}

const SIZES = {
  sm: { px: '6px', py: '2px', fontSize: '9px' },
  md: { px: '10px', py: '4px', fontSize: '11px' },
  lg: { px: '14px', py: '6px', fontSize: '13px' },
}

export function SignalBadge({ signal, size = 'md' }: { signal: Signal; size?: 'sm' | 'md' | 'lg' }) {
  const c = CONFIG[signal]
  const s = SIZES[size]
  return (
    <span
      className="inline-block rounded-md font-extrabold tracking-widest"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        border: `1.5px solid ${c.border}`,
        padding: `${s.py} ${s.px}`,
        fontSize: s.fontSize,
        letterSpacing: '1px',
      }}
    >
      {signal}
    </span>
  )
}
