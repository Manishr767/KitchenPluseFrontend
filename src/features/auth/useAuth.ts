import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './authContext'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** For pages that only render for authenticated users. */
export function useCurrentUser() {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser called without an authenticated user')
  return user
}
