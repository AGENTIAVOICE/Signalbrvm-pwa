import { useEffect } from 'react'
import { BottomNav } from './BottomNav'
import { AnimatedOutlet } from './AnimatedOutlet'
import FloatingChatBubble from './FloatingChatBubble'
import { NotificationPrompt } from './NotificationPrompt'
import { ErrorBoundary } from './ErrorBoundary'
import { recordAppOpenOnce } from '../hooks/useProfileStats'

export function AppLayout() {
  useEffect(() => {
    recordAppOpenOnce()
  }, [])

  return (
    <div>
      <ErrorBoundary>
        <AnimatedOutlet />
      </ErrorBoundary>
      <FloatingChatBubble />
      <NotificationPrompt />
      <BottomNav />
    </div>
  )
}
