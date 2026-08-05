import { useRef } from 'react'
import { Bold } from 'lucide-react'

const COLORS: { key: string; hex: string; label: string }[] = [
  { key: 'green', hex: '#22C55E', label: 'Vert' },
  { key: 'red', hex: '#EF4444', label: 'Rouge' },
  { key: 'gold', hex: '#F5C842', label: 'Or' },
  { key: 'blue', hex: '#3B82F6', label: 'Bleu' },
]

export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function wrapSelection(before: string, after: string, placeholderText: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || placeholderText
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length + selected.length + after.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => wrapSelection('**', '**', 'texte en gras')}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 30, height: 30, backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
          title="Gras"
        >
          <Bold size={13} color="#F5C842" />
        </button>
        <div className="w-px h-5" style={{ backgroundColor: '#2A2A3A' }} />
        {COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => wrapSelection(`[[c:${c.key}]]`, '[[/c]]', 'texte en couleur')}
            className="rounded-full"
            style={{ width: 22, height: 22, backgroundColor: c.hex, border: '1.5px solid #2A2A3A' }}
            title={c.label}
          />
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none resize-none"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
      />
      <p className="text-textMuted text-[10px] mt-1.5">Sélectionnez du texte puis cliquez sur Gras ou une couleur pour le mettre en valeur.</p>
    </div>
  )
}
