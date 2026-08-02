import { formatPrice } from '../lib/theme'

// Version simplifiée du CurrencyProvider mobile — FCFA par défaut.
// EUR/USD peuvent être ajoutés plus tard si besoin (peg XOF exact : 655.957).
export function useCurrencyFormat() {
  const format = (amountFcfa: number) => formatPrice(amountFcfa)
  return { format, currency: 'FCFA' as const }
}
