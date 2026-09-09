import type { ReactNode } from 'react'

// Rendu d'un mini-langage de mise en forme : **gras** et [[c:couleur]]texte[[/c]].
// Volontairement minimaliste (pas de vraie librairie markdown) pour rester
// simple à taper depuis la barre d'outils admin et à parser de façon sûre.
const COLOR_MAP: Record<string, string> = {
  green: '#22C55E',
  red: '#EF4444',
  gold: '#F5C842',
  blue: '#3B82F6',
  white: '#FFFFFF',
  gray: '#9A9AA8',
}

// Convertit les retours à la ligne d'un segment de texte en <br/> — appelé à
// chaque niveau (texte simple, gras, coloré) pour qu'une balise puisse
// contenir plusieurs lignes sans casser son propre style, contrairement à
// un découpage ligne par ligne fait AVANT de repérer les balises.
function withLineBreaks(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split('\n')
  const nodes: ReactNode[] = []
  parts.forEach((part, i) => {
    if (part) nodes.push(part)
    if (i < parts.length - 1) nodes.push(<br key={`${keyPrefix}-br-${i}`} />)
  })
  return nodes
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let remaining = text
  let i = 0

  // [\s\S] (au lieu de .) pour que le contenu d'une balise **gras** ou
  // [[c:...]] puisse s'étendre sur plusieurs lignes sans casser le style.
  const pattern = /\*\*([\s\S]+?)\*\*|\[\[c:(\w+)\]\]([\s\S]+?)\[\[\/c\]\]/
  while (remaining.length > 0) {
    const match = pattern.exec(remaining)
    if (!match) {
      nodes.push(...withLineBreaks(remaining, `${keyPrefix}-t${i++}`))
      break
    }
    if (match.index > 0) nodes.push(...withLineBreaks(remaining.slice(0, match.index), `${keyPrefix}-t${i++}`))
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{withLineBreaks(match[1], `${keyPrefix}-b${i}`)}</strong>)
    } else {
      const color = COLOR_MAP[match[2]] ?? undefined
      nodes.push(
        <span key={`${keyPrefix}-${i++}`} style={{ color, fontWeight: 700 }}>
          {withLineBreaks(match[3], `${keyPrefix}-c${i}`)}
        </span>
      )
    }
    remaining = remaining.slice(match.index + match[0].length)
  }
  return nodes
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {renderInline(text, 'r')}
    </p>
  )
}

// Retire toute la mise en forme — utilisé pour les aperçus tronqués (mode
// gratuit) où un balisage coupé en plein milieu casserait le rendu.
// [\s\S] ici aussi, pour les mêmes balises pouvant s'étendre sur plusieurs lignes.
export function stripRichText(text: string): string {
  return text.replace(/\*\*([\s\S]+?)\*\*/g, '$1').replace(/\[\[c:\w+\]\]([\s\S]+?)\[\[\/c\]\]/g, '$1')
}
