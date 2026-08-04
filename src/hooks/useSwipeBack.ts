import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Geste "glisser depuis le bord gauche pour revenir en arrière", comme sur
// une app native. On ne déclenche que si le geste part bien du bord de
// l'écran (pour ne pas gêner le scroll horizontal normal d'un composant) et
// va suffisamment loin, horizontalement plus que verticalement.
const EDGE_ZONE_PX = 24
const MIN_DISTANCE_PX = 80
const MAX_VERTICAL_DRIFT_PX = 60

export function useSwipeBack() {
  const navigate = useNavigate()

  useEffect(() => {
    let startX = 0
    let startY = 0
    let tracking = false

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      tracking = t.clientX <= EDGE_ZONE_PX
      startX = t.clientX
      startY = t.clientY
    }

    function onTouchEnd(e: TouchEvent) {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = Math.abs(t.clientY - startY)
      if (dx > MIN_DISTANCE_PX && dy < MAX_VERTICAL_DRIFT_PX) {
        navigate(-1)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [navigate])
}
