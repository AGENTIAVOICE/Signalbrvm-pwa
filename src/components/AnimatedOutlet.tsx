import { useLocation, useOutlet } from 'react-router-dom'

// Remplace <Outlet/> à l'intérieur d'un layout persistant (AppLayout,
// AdminLayout) : seul le contenu de la page change et s'anime à chaque
// navigation — la coquille autour (barre du bas, etc.) ne se remonte jamais,
// pour ne pas réintroduire le bug de disparition de la barre de menu.
export function AnimatedOutlet() {
  const location = useLocation()
  const element = useOutlet()
  return (
    <div key={location.pathname} className="page-transition">
      {element}
    </div>
  )
}
