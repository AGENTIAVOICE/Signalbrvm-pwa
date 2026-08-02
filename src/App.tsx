import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { AdminProtectedRoute, AdminLayout } from './components/AdminLayout'
import { UpdateBanner } from './components/UpdateBanner'
import { WelcomeProModal } from './components/WelcomeProModal'
import Auth from './pages/Auth'
import Alertes from './pages/Alertes'
import Analyses from './pages/Analyses'
import Marche from './pages/Marche'
import Portefeuille from './pages/Portefeuille'
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UpdateBanner />
        <WelcomeProModal />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/alerts" element={<AdminAlerts />} />
              <Route path="/admin/analyses" element={<AdminAnalyses />} />
              <Route path="/admin/formations" element={<AdminFormations />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/abonnement" element={<Abonnement />} />
            <Route path="/conseils" element={<Conseils />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/profil-investisseur" element={<ProfilInvestisseur />} />
            <Route path="/profil/parametres" element={<ProfilParametres />} />
            <Route element={<AppLayout />}>
              <Route path="/alertes" element={<Alertes />} />
              <Route path="/analyses" element={<Analyses />} />
              <Route path="/marche" element={<Marche />} />
              <Route path="/portefeuille" element={<Portefeuille />} />
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
