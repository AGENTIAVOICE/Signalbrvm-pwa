import { useEffect } from 'react'
import { BottomNav } from './BottomNav'
import { AnimatedOutlet } from './AnimatedOutlet'
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
        <AnimatedOutlet />
      </ErrorBoundary>
      <FloatingChatBubble />
      <BottomNav />
    </div>
  )
}
