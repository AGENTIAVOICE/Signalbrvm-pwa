import { create } from 'zustand'

interface AppState {
  unreadAlertsCount: number
  setUnreadAlertsCount: (n: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  unreadAlertsCount: 0,
  setUnreadAlertsCount: (n) => set({ unreadAlertsCount: n }),
}))
