export function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(2)}M FCFA`
  if (price >= 1000) return `${price.toLocaleString('fr-FR')} FCFA`
  return `${price} FCFA`
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Côte d'Ivoire = GMT (UTC+0) — Africa/Abidjan
export function formatGMTDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    timeZone: 'Africa/Abidjan',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelativeTime(date: Date): string {
  const nowUtc = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Abidjan' }))
  const dateUtc = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Abidjan' }))
  const diffMs = nowUtc.getTime() - dateUtc.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return formatGMTDate(date)
}
