import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './components/AppLayout/AppLayout.jsx'
import ConfigError from './components/ConfigError/ConfigError.jsx'
import { firebaseConfigErrorDetails, hasFirebaseConfig } from './firebase/firebase.js'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage/RegisterPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage/VerifyEmailPage.jsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx'
import AssessPage from './pages/AssessPage/AssessPage.jsx'
import ReviewPage from './pages/ReviewPage/ReviewPage.jsx'
import FinalPage from './pages/FinalPage/FinalPage.jsx'
import RequireAuth from './components/RequireAuth/RequireAuth.jsx'
import RequireCompany from './components/RequireCompany/RequireCompany.jsx'
import { useAuth } from './providers/AuthProvider/auth-context.js'

const queryClient = new QueryClient()

function NotFound() {
  return <Navigate to="/" replace />
}

export default function App() {
  const { user, isAuthLoading } = useAuth()

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        {!hasFirebaseConfig ? (
          <ConfigError
            title="Missing Firebase configuration"
            details={`${firebaseConfigErrorDetails}\n\nFill hosting/.env.production (for deploy builds) or hosting/.env.local (for local dev).`}
          />
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                !isAuthLoading && user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LandingPage />
                )
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/:inviteCode" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/verify-email"
              element={
                <RequireAuth>
                  <VerifyEmailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <RequireCompany>
                    <DashboardPage />
                  </RequireCompany>
                </RequireAuth>
              }
            />
            <Route
              path="/assess"
              element={
                <RequireAuth>
                  <RequireCompany>
                    <AssessPage />
                  </RequireCompany>
                </RequireAuth>
              }
            />
            <Route
              path="/review"
              element={
                <RequireAuth>
                  <RequireCompany>
                    <ReviewPage />
                  </RequireCompany>
                </RequireAuth>
              }
            />
            <Route
              path="/final"
              element={
                <RequireAuth>
                  <RequireCompany>
                    <FinalPage />
                  </RequireCompany>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </AppLayout>
    </QueryClientProvider>
  )
}
