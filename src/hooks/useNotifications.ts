import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface DbNotification {
  id: string
  alert_id: string | null
  ticker: string | null
  message: string
  is_read: boolean
  created_at: string
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// Vraies notifications de franchissement de cours limite, déclenchées côté
// base par check_price_target_notifications() — pas une liste statique.
export function useNotifications() {
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(true)
  const channelId = useRef(`notifications_rt_${Math.random().toString(36).slice(2)}`)

  const refetch = useCallback(async () => {
    const uid = await currentUserId()
    if (!uid) {
      setNotifications([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('notifications')
      .select('id, alert_id, ticker, message, is_read, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data ?? []) as DbNotification[])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
    let cleanup = () => {}
    currentUserId().then((uid) => {
      if (!uid) return
      const channel = supabase
        .channel(channelId.current)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => refetch())
        .subscribe()
      cleanup = () => {
        supabase.removeChannel(channel)
      }
    })
    return () => cleanup()
  }, [refetch])

  async function markAllRead() {
    const uid = await currentUserId()
    if (!uid) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', uid).eq('is_read', false)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, unreadCount, loading, refetch, markAllRead }
}
