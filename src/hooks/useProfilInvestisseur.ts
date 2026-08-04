import { useCallback, useEffect, useState } from 'react'
import { getProfilInvestisseurResult, getCapital, saveCapital, type ProfilInvestisseurResult } from '../lib/profilStorage'

export function useProfilInvestisseur() {
  const [result, setResult] = useState<ProfilInvestisseurResult | null>(null)
  const [capital, setCapital] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [r, c] = await Promise.all([getProfilInvestisseurResult(), getCapital()])
    setResult(r)
    setCapital(c)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function updateCapital(amount: number) {
    await saveCapital(amount)
    setCapital(amount)
  }

  return { result, capital, loading, refresh, updateCapital }
}
