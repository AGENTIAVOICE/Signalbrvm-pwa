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
