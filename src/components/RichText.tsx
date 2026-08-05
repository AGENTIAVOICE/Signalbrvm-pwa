import type { ReactNode } from 'react'

// Rendu d'un mini-langage de mise en forme : **gras** et [[c:couleur]]texte[[/c]].
// Volontairement minimaliste (pas de vraie librairie markdown) pour rester
// simple à taper depuis la barre d'outils admin et à parser de façon sûre.
const COLOR_MAP: Record<string, string> = {
  green: '#22C55E',
  red: '#EF4444',
  gold: '#F5C842',
  blue: '#3B82F6',
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
  const lines = text.split('\n')
  return (
    <p className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {lines.map((line, idx) => (
        <span key={idx}>
          {renderInline(line, `l${idx}`)}
          {idx < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  )
}

// Retire toute la mise en forme — utilisé pour les aperçus tronqués (mode
// gratuit) où un balisage coupé en plein milieu casserait le rendu.
export function stripRichText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[c:\w+\]\](.+?)\[\[\/c\]\]/g, '$1')
}
