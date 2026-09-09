import type { ReactNode } from 'react'

// Rendu d'un mini-langage de mise en forme : **gras**, [[c:couleur]]texte[[/c]]
// et [[img:URL]] pour une image d'illustration. Volontairement minimaliste
// (pas de vraie librairie markdown) pour rester simple à taper depuis la
// barre d'outils admin et à parser de façon sûre.
const COLOR_MAP: Record<string, string> = {
  green: '#22C55E',
  red: '#EF4444',
  gold: '#F5C842',
  blue: '#3B82F6',
  white: '#FFFFFF',
  gray: '#9A9AA8',
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let remaining = text
  let i = 0

  const pattern = /\*\*(.+?)\*\*|\[\[c:(\w+)\]\](.+?)\[\[\/c\]\]/
  while (remaining.length > 0) {
    const match = pattern.exec(remaining)
    if (!match) {
      nodes.push(remaining)
      break
    }
    if (match.index > 0) nodes.push(remaining.slice(0, match.index))
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[1]}</strong>)
    } else {
      const color = COLOR_MAP[match[2]] ?? undefined
      nodes.push(
        <span key={`${keyPrefix}-${i++}`} style={{ color, fontWeight: 700 }}>
          {match[3]}
        </span>
      )
    }
    remaining = remaining.slice(match.index + match[0].length)
  }
  return nodes
}

export function RichText({ text, className }: { text: string; className?: string }) {
  // On sépare d'abord les images (qui forment leur propre bloc, jamais en
  // ligne dans une phrase) du reste du texte, ligne par ligne.
  const blocks = text.split(/(\[\[img:[^\]]+\]\])/g).filter((b) => b.length > 0)

  return (
    <div className={className}>
      {blocks.map((block, blockIdx) => {
        const imgMatch = block.match(/^\[\[img:([^\]]+)\]\]$/)
        if (imgMatch) {
          return <img key={`img-${blockIdx}`} src={imgMatch[1]} alt="" className="w-full rounded-xl my-2.5" style={{ maxHeight: 320, objectFit: 'cover' }} />
        }
        const lines = block.split('\n').filter((_, idx, arr) => !(idx === arr.length - 1 && arr[idx] === '' && arr.length > 1))
        return (
          <p key={`text-${blockIdx}`} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {lines.map((line, idx) => (
              <span key={idx}>
                {renderInline(line, `l${blockIdx}-${idx}`)}
                {idx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

// Retire toute la mise en forme — utilisé pour les aperçus tronqués (mode
// gratuit) où un balisage coupé en plein milieu casserait le rendu.
export function stripRichText(text: string): string {
  return text
    .replace(/\[\[img:[^\]]+\]\]/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[\[c:\w+\]\](.+?)\[\[\/c\]\]/g, '$1')
}
