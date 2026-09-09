import { useCallback, useEffect, useState } from 'react'
import { getProfilInvestisseurResult, getCapital, saveCapital, type ProfilInvestisseurResult } from '../lib/profilStorage'
import { getCached, setCached } from '../lib/dataCache'

interface CachedProfil {
  result: ProfilInvestisseurResult | null
  capital: number | null
}

export function useProfilInvestisseur() {
  const cached = getCached<CachedProfil>('profil_investisseur')
  const [result, setResult] = useState<ProfilInvestisseurResult | null>(cached?.result ?? null)
  const [capital, setCapital] = useState<number | null>(cached?.capital ?? null)
  const [loading, setLoading] = useState(cached === undefined)

  const refresh = useCallback(async () => {
    if (getCached('profil_investisseur') === undefined) setLoading(true)
    const [r, c] = await Promise.all([getProfilInvestisseurResult(), getCapital()])
    setResult(r)
    setCapital(c)
    setCached('profil_investisseur', { result: r, capital: c })
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function updateCapital(amount: number) {
    await saveCapital(amount)
    setCapital(amount)
    setCached('profil_investisseur', { result, capital: amount })
  }

  return { result, capital, loading, refresh, updateCapital }
}
