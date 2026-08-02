import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import FloatingChatBubble from './FloatingChatBubble'
import { ErrorBoundary } from './ErrorBoundary'
import { recordAppOpenOnce } from '../hooks/useProfileStats'

export function AppLayout() {
  useEffect(() => {
    recordAppOpenOnce()
  }, [])

  return (
    <div>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <FloatingChatBubble />
      <BottomNav />
    </div>
  )
}
