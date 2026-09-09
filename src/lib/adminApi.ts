const baseUrl = import.meta.env.VITE_BACKEND_URL as string
const TOKEN_KEY = 'signalbrvm_admin_token'

interface ApiResponse<T> {
  data?: T
  error?: { message: string; code?: string }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getAdminToken()
  const headers: Record<string, string> = {}
  if (options.body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}/api/admin${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const json: ApiResponse<T> = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    if (res.status === 401) clearAdminToken()
    throw new Error(json.error?.message ?? `Erreur ${res.status}`)
  }
  return json.data as T
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Lie une alerte à sa vraie fiche entreprise (ticker/secteur/objectifs/stop
// loss). Passe par une fonction Supabase dédiée plutôt que par le backend
// externe — celui-ci ignore ces champs et ne les persiste pas. Best-effort :
// une erreur ici ne doit jamais bloquer la sauvegarde de l'alerte elle-même,
// donc les appelants doivent l'utiliser sans faire échouer le flux principal.
const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/link-alert-stock`

// Le backend externe ne connaît pas la colonne formation_access (produit
// payant séparé, ajouté directement dans Supabase) — ces deux fonctions
// passent par des fonctions Supabase dédiées, avec la même vérification du
// token admin que les autres contournements ci-dessus.
const LIST_FORMATION_ACCESS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/list-formation-access`
const GRANT_FORMATION_ACCESS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/grant-formation-access`

export interface ExtraUserFields {
  formation_access: boolean
  plan_duration_months: number | null
  plan_expires_at: string | null
}

export async function listFormationAccess(): Promise<Record<string, ExtraUserFields>> {
  const token = getAdminToken()
  if (!token) return {}
  try {
    const res = await fetch(LIST_FORMATION_ACCESS_URL, { headers: { Authorization: `Bearer ${token}` } })
    const json: { data?: ({ id: string } & ExtraUserFields)[] } = await res.json().catch(() => ({}))
    if (!res.ok || !json.data) return {}
    return Object.fromEntries(json.data.map((r) => [r.id, { formation_access: r.formation_access, plan_duration_months: r.plan_duration_months, plan_expires_at: r.plan_expires_at }]))
  } catch {
    return {}
  }
}

export async function grantFormationAccess(userId: string, access: boolean): Promise<void> {
  const token = getAdminToken()
  if (!token) return
  try {
    const res = await fetch(GRANT_FORMATION_ACCESS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, access }),
    })
    if (!res.ok) console.error('grantFormationAccess: échec', res.status, await res.text().catch(() => ''))
  } catch (err) {
    console.error('grantFormationAccess: erreur réseau', err)
  }
}

const SET_PLAN_DURATION_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/set-plan-duration`
export async function setPlanDuration(userId: string, durationMonths: 1 | 3 | 6 | 12 | null): Promise<void> {
  const token = getAdminToken()
  if (!token) return
  try {
    const res = await fetch(SET_PLAN_DURATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, duration_months: durationMonths }),
    })
    if (!res.ok) console.error('setPlanDuration: échec', res.status, await res.text().catch(() => ''))
  } catch (err) {
    console.error('setPlanDuration: erreur réseau', err)
  }
}

export async function linkAlertStock(
  alertId: string,
  fields: { ticker: string | null; sector: string | null; objectif_1: number | null; objectif_2: number | null; stop_loss: number | null }
): Promise<void> {
  const token = getAdminToken()
  if (!token) {
    console.error('linkAlertStock: pas de token admin, appel annulé')
    return
  }
  try {
    const res = await fetch(SUPABASE_FUNCTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ alert_id: alertId, ...fields }),
    })
    if (!res.ok) {
      console.error('linkAlertStock: échec', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.error('linkAlertStock: erreur réseau', err)
  }
}

// Même souci que pour les alertes : le backend externe ignore le
// ticker/secteur d'une analyse. On les persiste directement via Supabase.
const LINK_ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/link-analysis-stock`
export async function linkAnalysisStock(analysisId: string, fields: { ticker: string | null; sector: string | null }): Promise<void> {
  const token = getAdminToken()
  if (!token) return
  try {
    const res = await fetch(LINK_ANALYSIS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ analysis_id: analysisId, ...fields }),
    })
    if (!res.ok) console.error('linkAnalysisStock: échec', res.status, await res.text().catch(() => ''))
  } catch (err) {
    console.error('linkAnalysisStock: erreur réseau', err)
  }
}

// Le backend externe ne réalise jamais le vrai téléversement d'image (il
// renvoie une URL plausible sans rien enregistrer) — cette fonction fait le
// vrai upload dans le stockage Supabase.
const UPLOAD_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/upload-admin-image`
export async function uploadImageReal(file: File, folder = 'analyses'): Promise<{ url: string }> {
  const token = getAdminToken()
  if (!token) throw new Error('Non authentifié')
  const dataBase64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(file)
  })
  const res = await fetch(UPLOAD_IMAGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg', dataBase64, folder }),
  })
  const json: { data?: { url: string }; error?: string } = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data as { url: string }
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; email: string }> {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json: ApiResponse<{ token: string; email: string }> = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(json.error?.message ?? 'Erreur de connexion')
  return json.data as { token: string; email: string }
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  phone?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'admin'
  subscription_plan: string
  created_at: string
}

export interface AdminSubscription {
  id: string
  user_id: string
  user_email: string
  user_name: string
  user_phone: string | null
  plan: string
  billing_cycle: string
  status: string
  transaction_id: string | null
  phone_number: string | null
  amount: number | null
  started_at: string
  expires_at: string | null
  created_at: string
}

export interface AdminFormationPurchase {
  id: string
  user_id: string
  user_email: string
  user_name: string
  user_phone: string | null
  level: number
  status: string
  transaction_id: string | null
  phone_number: string | null
  amount: number | null
  created_at: string
  updated_at: string
}

export interface AdminVideo {
  id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  is_published: boolean
  level: number
  created_at: string
}

async function uploadFile(path: string, file: File): Promise<{ url: string }> {
  const token = getAdminToken()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${baseUrl}/api/admin${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })
  const json: ApiResponse<{ url: string }> = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Erreur ${res.status}`)
  return json.data as { url: string }
}

export const uploadImage = (file: File) => uploadFile('/upload-image', file)
export const uploadVideo = (file: File) => uploadFile('/upload-video', file)
