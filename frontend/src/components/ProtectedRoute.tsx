import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

// Redirects to /login if there is no authenticated user.
// Used to wrap any route that requires authentication.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
