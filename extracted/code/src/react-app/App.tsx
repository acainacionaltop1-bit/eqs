import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from '@getmocha/users-service/react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { useSessionRenewal } from '@/react-app/hooks/useSessionRenewal';
import HomePage from "@/react-app/pages/Home";
import AuthCallback from "@/react-app/pages/AuthCallback";
import Login from "@/react-app/pages/Login";
import Cadastro from "@/react-app/pages/Cadastro";
import Dashboard from "@/react-app/pages/Dashboard";
import Missions from "@/react-app/pages/Missions";
import Coupons from "@/react-app/pages/Coupons";
import Affiliates from "@/react-app/pages/Affiliates";
import Ranking from "@/react-app/pages/Ranking";
import Profile from "@/react-app/pages/Profile";
import Career from "@/react-app/pages/Career";
import Admin from "@/react-app/pages/Admin";
import NotFound from "@/react-app/pages/NotFound";
import Terms from "@/react-app/pages/Terms";
import Privacy from "@/react-app/pages/Privacy";
import Support from "@/react-app/pages/Support";
import ForgotPassword from "@/react-app/pages/ForgotPassword";
import ResetPassword from "@/react-app/pages/ResetPassword";
import Layout from "@/react-app/components/Layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isFetching } = useAuth();
  useSessionRenewal(); // Auto-renew sessions for authenticated users
  
  // Show loading while checking authentication
  if (isFetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }
  
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/missions" element={
            <ProtectedRoute>
              <Missions />
            </ProtectedRoute>
          } />
          <Route path="/cupons" element={
            <ProtectedRoute>
              <Coupons />
            </ProtectedRoute>
          } />
          <Route path="/affiliates" element={
            <ProtectedRoute>
              <Affiliates />
            </ProtectedRoute>
          } />
          <Route path="/ranking" element={
            <ProtectedRoute>
              <Ranking />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/carreira" element={
            <ProtectedRoute>
              <Career />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/suporte" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
