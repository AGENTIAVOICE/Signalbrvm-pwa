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

// ── Capital investi ──────────────────────────────────────────────────────────
// Sert au test de résistance et au calcul des montants d'allocation cible du
// portefeuille — sans ce chiffre réel, ces sections restent volontairement
// vides plutôt que d'afficher un montant inventé.
const CAPITAL_PREFIX = 'capital_investi:'

export async function getCapital(): Promise<number | null> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user?.id
  if (!uid) return null

  const remote = data.session?.user?.user_metadata?.capital_investi
  if (typeof remote === 'number' && Number.isFinite(remote)) {
    localStorage.setItem(CAPITAL_PREFIX + uid, String(remote))
    return remote
  }

  const raw = localStorage.getItem(CAPITAL_PREFIX + uid)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

export async function saveCapital(amount: number): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user?.id
  if (!uid) return
  localStorage.setItem(CAPITAL_PREFIX + uid, String(amount))
  try {
    await supabase.auth.updateUser({ data: { capital_investi: amount } })
  } catch {
    // idem : le cache local suffit si l'appel échoue
  }
}
