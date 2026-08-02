import { supabase } from './supabase'

const RESULT_PREFIX = 'profil_investisseur_result:'

export interface ProfilInvestisseurResult {
  score: number
  profileKey: string
}

function isValidResult(v: unknown): v is ProfilInvestisseurResult {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as ProfilInvestisseurResult).score === 'number' &&
    typeof (v as ProfilInvestisseurResult).profileKey === 'string'
  )
}

// Source de vérité : Supabase (user_metadata) — survit à un changement
// d'appareil, une réinstallation ou un nettoyage du cache navigateur.
// localStorage sert juste de cache local pour un accès instantané.
export async function getProfilInvestisseurResult(): Promise<ProfilInvestisseurResult | null> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user?.id
  if (!uid) return null

  const remote = data.session?.user?.user_metadata?.profil_investisseur_result
  if (isValidResult(remote)) {
    // Reforme le cache local au passage, au cas où il aurait été vidé.
    localStorage.setItem(RESULT_PREFIX + uid, JSON.stringify(remote))
    return remote
  }

  // Repli : résultat présent seulement en local (ex: l'appel Supabase avait
  // échoué au moment de la sauvegarde).
  const raw = localStorage.getItem(RESULT_PREFIX + uid)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return isValidResult(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function saveProfilInvestisseurResult(result: ProfilInvestisseurResult): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user?.id
  if (!uid) return
  localStorage.setItem(RESULT_PREFIX + uid, JSON.stringify(result))
  // Persiste aussi côté Supabase pour survivre à un changement d'appareil ou
  // un nettoyage du cache navigateur — c'est la source de vérité principale.
  try {
    await supabase.auth.updateUser({ data: { profil_investisseur_result: result } })
  } catch {
    // La persistance locale suffit si l'appel échoue (l'écran Profil pourra
    // quand même l'afficher tant que localStorage n'est pas vidé).
  }
}
