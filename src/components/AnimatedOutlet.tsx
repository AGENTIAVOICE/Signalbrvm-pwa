import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom'

// Mémoire des positions de défilement par entrée d'historique — permet de
// revenir exactement là où on était en naviguant "en arrière" (bouton
// retour, geste de balayage), au lieu de toujours repartir du haut de page.
const scrollPositions = new Map<string, number>()

// Remplace <Outlet/> à l'intérieur d'un layout persistant (AppLayout,
// AdminLayout) : seul le contenu de la page change et s'anime à chaque
// navigation — la coquille autour (barre du bas, etc.) ne se remonte jamais,
// pour ne pas réintroduire le bug de disparition de la barre de menu.
export function AnimatedOutlet() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const element = useOutlet()
  const locationKeyRef = useRef(location.key)

  // Mémorise la position de défilement actuelle juste avant de quitter cette
  // page (au démontage du contenu précédent).
  useEffect(() => {
    const key = locationKeyRef.current
    return () => {
      scrollPositions.set(key, window.scrollY)
    }
  }, [])

  useEffect(() => {
    locationKeyRef.current = location.key
  }, [location.key])

  // Empêche le navigateur de restaurer lui-même le défilement (ce qui
  // entrerait en conflit avec notre propre restauration ci-dessous).
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Une fois le nouveau contenu affiché : si on revient en arrière/avant
  // dans l'historique, on retrouve la position exacte ; sinon (nouvelle
  // navigation), on repart naturellement du haut de la page. Saut instantané
  // (pas d'animation), même si un défilement doux est activé ailleurs.
  useLayoutEffect(() => {
    const top = navigationType === 'POP' ? scrollPositions.get(location.key) ?? 0 : 0
    window.scrollTo({ top, behavior: 'instant' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div key={location.pathname} className="page-transition">
      {element}
    </div>
  )
}
