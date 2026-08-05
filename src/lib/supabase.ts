import { createClient } from '@supabase/supabase-js'

// Même projet Supabase que l'app mobile SignalBrvm — connecté aux vraies données.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: { params: { eventsPerSecond: 10 } },
})

export type RiskLevel = 'Faible' | 'Modéré' | 'Élevé'

export interface DbUser {
  id: string
  email: string
  full_name: string | null
  status: 'pending' | 'approved' | 'rejected' | 'admin'
  subscription_plan: string
  created_at: string
}

export interface DbAnalysis {
  id: string
  title: string
  stock_name: string | null
  ticker: string | null
  sector: string | null
  potential_percent: number | null
  risk_level: RiskLevel | null
  content: string | null
  is_published: boolean
  image_url: string | null
  created_at: string
}

export interface DbAlert {
  id: string
  stock_name: string
  type: 'achat' | 'vente'
  price_target: number | null
  horizon: 'court' | 'long' | null
  risk_level: string | null
  content: string | null
  is_active: boolean
  created_at: string
  ticker: string | null
  sector: string | null
  objectif_1: number | null
  objectif_2: number | null
  stop_loss: number | null
}

export interface DbCompany {
  ticker: string
  full_name: string
  short_name: string | null
  sector: string | null
  description: string | null
  logo_url: string | null
  is_active: boolean
}

export interface DbHistoryPoint {
  ticker: string
  day: string
  cours: number
  variation_pct: number | null
}

export interface DbPortfolioPosition {
  id: string
  user_id: string
  stock_id: string
  stock_name: string
  ticker: string
  sector: string | null
  quantity: number
  avg_buy_price: number
  logo_initials: string | null
  logo_color: string | null
  created_at: string
  updated_at: string
}

export interface DbRecommendation {
  id: string
  stock_name: string
  action: 'ACHAT' | 'VENDRE' | 'CONSERVER'
  price_entry: number | null
  price_target: number | null
  horizon: string | null
  risk_level: RiskLevel | null
  is_active: boolean
  created_at: string
}

export interface BrvmRow {
  ticker: string
  company_name?: string | null
  cours: number | null
  variation_pct: number | null
  variation_7j?: number | null
  variation_30j?: number | null
  volume: number | null
  capitalisation: number | null
  updated_at: string | null
}
