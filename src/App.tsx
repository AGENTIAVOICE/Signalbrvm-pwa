import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { AdminProtectedRoute, AdminLayout } from './components/AdminLayout'
import { UpdateBanner } from './components/UpdateBanner'
import { WelcomeProModal } from './components/WelcomeProModal'
import { useSwipeBack } from './hooks/useSwipeBack'
import { PageFade } from './components/PageFade'
import Auth from './pages/Auth'
import Alertes from './pages/Alertes'
import AlertDetail from './pages/AlertDetail'
import Analyses from './pages/Analyses'
import Marche from './pages/Marche'
import MarcheDetail from './pages/MarcheDetail'
import Portefeuille from './pages/Portefeuille'
import SimulationDetail from './pages/SimulationDetail'
import Profil from './pages/Profil'
import ProfilParametres from './pages/ProfilParametres'
import ProfilInvestisseur from './pages/ProfilInvestisseur'
import Abonnement from './pages/Abonnement'
import Conseils from './pages/Conseils'
import Formations from './pages/Formations'
import AdminLogin from './pages/admin/AdminLogin'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAlerts from './pages/admin/AdminAlerts'
import AdminAnalyses from './pages/admin/AdminAnalyses'
import AdminFormations from './pages/admin/AdminFormations'

function SwipeBack() {
  useSwipeBack()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UpdateBanner />
        <WelcomeProModal />
        <SwipeBack />
        <Routes>
          <Route path="/auth" element={<PageFade><Auth /></PageFade>} />
          <Route path="/admin/login" element={<PageFade><AdminLogin /></PageFade>} />

          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/alerts" element={<AdminAlerts />} />
              <Route path="/admin/analyses" element={<AdminAnalyses />} />
              <Route path="/admin/formations" element={<AdminFormations />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/abonnement" element={<PageFade><Abonnement /></PageFade>} />
            <Route path="/conseils" element={<PageFade><Conseils /></PageFade>} />
            <Route path="/formations" element={<PageFade><Formations /></PageFade>} />
            <Route path="/profil-investisseur" element={<PageFade><ProfilInvestisseur /></PageFade>} />
            <Route path="/profil/parametres" element={<PageFade><ProfilParametres /></PageFade>} />
            <Route element={<AppLayout />}>
              <Route path="/alertes" element={<Alertes />} />
              <Route path="/alertes/:id" element={<AlertDetail />} />
              <Route path="/analyses" element={<Analyses />} />
              <Route path="/marche" element={<Marche />} />
              <Route path="/marche/:ticker" element={<MarcheDetail />} />
              <Route path="/portefeuille" element={<Portefeuille />} />
              <Route path="/portefeuille/:ticker" element={<SimulationDetail />} />
              <Route path="/profil" element={<Profil />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/alertes" replace />} />
          <Route path="*" element={<Navigate to="/alertes" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
