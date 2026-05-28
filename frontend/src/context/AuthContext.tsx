import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  signIn: (token: string, email: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore session from localStorage on first load
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('email')
    return token && email ? { token, email } : null
  })

  const signIn = useCallback((token: string, email: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('email', email)
    setUser({ token, email })
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Throws if used outside the provider — fail loudly rather than silently
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
