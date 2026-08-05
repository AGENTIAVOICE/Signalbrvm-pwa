import { create } from 'zustand'

interface AppState {
  unreadAlertsCount: number
  setUnreadAlertsCount: (n: number) => void
  unreadAnalysesCount: number
  setUnreadAnalysesCount: (n: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  unreadAlertsCount: 0,
  setUnreadAlertsCount: (n) => set({ unreadAlertsCount: n }),
  unreadAnalysesCount: 0,
  setUnreadAnalysesCount: (n) => set({ unreadAnalysesCount: n }),
}))
