import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function ModalSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div
        className="w-full max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ backgroundColor: '#0A0A0F', border: '1px solid #2A2A3A' }}
      >
        <div
          className="flex items-center justify-between px-4 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#0A0A0F', borderBottom: '1px solid #1E1E2A' }}
        >
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-textSub text-xs font-medium">
            Annuler
          </button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <p className="text-textSub text-[10px] font-bold tracking-wider mb-1.5">
      {children} {required && <span className="text-primary">*</span>}
    </p>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-3.5 py-3 text-white text-sm outline-none placeholder:text-textMuted"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl px-3.5 py-3 text-white text-sm outline-none resize-none placeholder:text-textMuted"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    />
  )
}

export function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
  colors,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  colors?: Partial<Record<string, string>>
}) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => {
        const active = value === opt.value
        const c = colors?.[String(opt.value)] ?? '#F5C842'
        const lines = opt.label.split('\n')
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="flex-1 py-3 rounded-xl text-xs font-extrabold tracking-wide flex flex-col items-center gap-0.5"
            style={{
              backgroundColor: active ? `${c}1A` : '#111118',
              border: active ? `1.5px solid ${c}` : '1px solid #2A2A3A',
              color: active ? c : '#8A8A9A',
            }}
          >
            {lines.map((line, i) => (
              <span key={i} style={i === 1 ? { fontSize: 10, fontWeight: 600, opacity: 0.85 } : undefined}>
                {line}
              </span>
            ))}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative rounded-full flex-shrink-0"
      style={{ width: 50, height: 30, backgroundColor: checked ? '#D4A82E' : '#2A2A3A' }}
    >
      <span
        className="absolute rounded-full bg-white transition-transform"
        style={{ width: 24, height: 24, top: 3, left: 3, transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

export function UploadBox({
  icon,
  label,
  sublabel,
  accept,
  onFile,
  previewUrl,
}: {
  icon: ReactNode
  label: string
  sublabel: string
  accept: string
  onFile: (file: File) => void
  previewUrl?: string | null
}) {
  return (
    <label
      className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl py-7 cursor-pointer text-center"
      style={{ border: '1.5px dashed #3A3A4A', backgroundColor: '#0D0D14' }}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="" className="w-20 h-20 object-cover rounded-xl mb-1" />
      ) : (
        <div className="flex items-center justify-center rounded-full" style={{ width: 46, height: 46, backgroundColor: '#1A1A24' }}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-white font-bold text-xs">{label}</p>
        <p className="text-textMuted text-[11px] mt-1">{sublabel}</p>
      </div>
    </label>
  )
}

export function ScreenHeader({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-white font-extrabold text-lg tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center rounded-2xl mb-3" style={{ width: 60, height: 60, backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
        {icon}
      </div>
      <p className="text-textSub font-semibold text-sm">{title}</p>
      {subtitle && <p className="text-textMuted text-xs mt-1 max-w-xs">{subtitle}</p>}
    </div>
  )
}

export { X }
