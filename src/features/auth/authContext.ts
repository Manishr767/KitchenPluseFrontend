import { createContext } from 'react'
import type { User } from '@/types'

/** `unavailable`: a stored session exists but the backend could not be reached to validate it. */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  /** Message shown on the login page after an automatic sign-out. */
  notice: string | null
  /** Why the session could not be restored when status is `unavailable`. */
  restoreError: string | null
  retryRestore: () => void
  login: (email: string, password: string) => Promise<void>
  logout: (notice?: string) => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
