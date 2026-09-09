import { useRef, useState } from 'react'
import { Bold, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadImageReal } from '../../lib/adminApi'

const COLORS: { key: string; hex: string; label: string }[] = [
  { key: 'green', hex: '#22C55E', label: 'Vert' },
  { key: 'red', hex: '#EF4444', label: 'Rouge' },
  { key: 'gold', hex: '#F5C842', label: 'Or' },
  { key: 'blue', hex: '#3B82F6', label: 'Bleu' },
  { key: 'white', hex: '#FFFFFF', label: 'Blanc' },
  { key: 'gray', hex: '#9A9AA8', label: 'Gris' },
]

export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Position où insérer l'image une fois téléversée — capturée au moment où
  // "//" est détecté, car le focus/curseur peut bouger pendant l'upload.
  const insertAtRef = useRef<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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

  function openImagePicker(atPosition: number) {
    insertAtRef.current = atPosition
    fileInputRef.current?.click()
  }

  // Déclencheur "//" implémenté au niveau de la touche pressée (keydown),
  // pas de la mise à jour de valeur (onChange) : c'est plus fiable, car on
  // intercepte la frappe AVANT qu'elle ne modifie le texte (preventDefault),
  // au lieu de deviner après coup ce qui vient d'être tapé — indépendant du
  // clavier, du navigateur, ou d'un éventuel correcteur automatique.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== '/') return
    const el = e.currentTarget
    const cursor = el.selectionStart
    if (el.selectionEnd !== cursor) return // pas de sélection active
    const previousChar = value.slice(cursor - 1, cursor)
    if (previousChar === '/') {
      e.preventDefault()
      // On retire le "/" déjà présent (le second ne sera jamais tapé grâce
      // au preventDefault) pour qu'aucun des deux ne reste dans le texte.
      const withoutTrigger = value.slice(0, cursor - 1) + value.slice(cursor)
      onChange(withoutTrigger)
      requestAnimationFrame(() => {
        el.setSelectionRange(cursor - 1, cursor - 1)
      })
      openImagePicker(cursor - 1)
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const { url } = await uploadImageReal(file, 'analyses-inline')
      const pos = insertAtRef.current ?? value.length
      const tag = `[[img:${url}]]`
      const next = value.slice(0, pos) + tag + value.slice(pos)
      onChange(next)
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        const cursor = pos + tag.length
        el.setSelectionRange(cursor, cursor)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'image")
    }
    setUploading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
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
        <div className="w-px h-5" style={{ backgroundColor: '#2A2A3A' }} />
        <button
          type="button"
          onClick={() => openImagePicker(textareaRef.current?.selectionStart ?? value.length)}
          disabled={uploading}
          className="flex items-center justify-center rounded-lg disabled:opacity-50"
          style={{ width: 30, height: 30, backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
          title="Insérer une image"
        >
          {uploading ? <Loader2 size={13} color="#F5C842" className="animate-spin" /> : <ImageIcon size={13} color="#F5C842" />}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={8}
        className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none resize-none"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
      />
      {error && <p className="text-sell text-[11px] mt-1">{error}</p>}
      <p className="text-textMuted text-[10px] mt-1.5">
        Sélectionnez du texte puis cliquez sur Gras ou une couleur pour le mettre en valeur. Tapez{' '}
        <span className="font-bold text-white">//</span> n'importe où pour insérer une image depuis votre galerie
        (ou utilisez le bouton dédié).
      </p>
    </div>
  )
}
