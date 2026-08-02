import { useCallback, useEffect, useState } from 'react'
import { getProfilInvestisseurResult, type ProfilInvestisseurResult } from '../lib/profilStorage'

export function useProfilInvestisseur() {
  const [result, setResult] = useState<ProfilInvestisseurResult | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setResult(await getProfilInvestisseurResult())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { result, loading, refresh }
}
