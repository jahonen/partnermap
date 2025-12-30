import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../providers/AuthProvider/auth-context.js'

function isPasswordProviderUser(user) {
  return Boolean(user?.providerData?.some((p) => p?.providerId === 'password'))
}

export default function RequireAuth({ children }) {
  const { user, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isPasswordProviderUser(user) && !user.emailVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace state={{ from: location }} />
  }

  return children
}
