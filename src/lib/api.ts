import { supabase } from './supabase'

const baseUrl = import.meta.env.VITE_BACKEND_URL as string

interface ApiResponse<T> {
  data?: T
  error?: { message: string; code?: string }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body) headers['Content-Type'] = 'application/json'
  if (options.auth) Object.assign(headers, await authHeader())

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const json: ApiResponse<T> = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Erreur ${res.status}`)
  }
  return json.data as T
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { auth }),
  post: <T>(path: string, body: unknown, auth = false) =>
    request<T>(path, { method: 'POST', body, auth }),
}

// ── Endpoints spécifiques (mêmes routes que le backend TradeHome) ──────────
export const registerUser = (payload: {
  email: string
  password: string
  full_name: string
  phone: string
}) => api.post<{ success: boolean }>('/api/auth/register', payload)

export const getMyPlan = () => api.get<{ plan: 'free' | 'pro' }>('/api/me', true)

// ── Conseils IA ─────────────────────────────────────────────────────────────
export const getConseils = (profil: string) =>
  api.post<{ conseils: string; profil: string }>('/api/conseils', { profil }, true)

// ── Chat IA (BRVM) ──────────────────────────────────────────────────────────
// Branché sur une fonction serverless Netlify (netlify/functions/chat-brvm.mts)
// qui garde la clé ANTHROPIC_API_KEY côté serveur — jamais dans le code envoyé
// au navigateur. Cette fonction ne dépend pas du backend Vibecode.
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
export const sendChatMessage = async (messages: ChatMessage[]): Promise<{ reply: string }> => {
  const res = await fetch('/.netlify/functions/chat-brvm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  const json: { data?: { reply: string }; error?: { message: string } } = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Erreur ${res.status}`)
  return json.data as { reply: string }
}

// ── Analyse de marché IA (page Marché) ──────────────────────────────────────
export interface MarketMetrics {
  stockName: string
  ticker: string
  sector?: string | null
  cours: number
  dayChangePct?: number | null
  trendPct?: number | null
  rsi?: number | null
  rangeLowPct?: number | null
  rangeHighPct?: number | null
}
export const getMarketAnalysis = async (metrics: MarketMetrics): Promise<{ analysis: string }> => {
  const res = await fetch('/.netlify/functions/market-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics),
  })
  const json: { data?: { analysis: string }; error?: { message: string } } = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Erreur ${res.status}`)
  return json.data as { analysis: string }
}

// ── Formations ───────────────────────────────────────────────────────────────
// Note : l'achat individuel par niveau (Wave/mobile money) a été retiré —
// le plan Pro (paiement unique via Chariow) débloque désormais tout.
export interface DbVideo {
  id: string
  title: string
  description: string | null
  video_url: string
  level: number
  is_published: boolean
  created_at: string
}

export const getAllVideos = () => api.get<DbVideo[]>('/api/formations/all-videos', true)
