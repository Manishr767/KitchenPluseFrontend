import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as authApi from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { setUnauthorizedHandler } from '@/api/client'
import type { User } from '@/types'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'
import { clearSession, loadSession, saveSession } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // Start as anonymous when there is nothing to restore, so no effect has to set state for that case.
  const [status, setStatus] = useState<AuthStatus>(() => (loadSession() ? 'loading' : 'anonymous'))
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const expiryTimer = useRef<number | undefined>(undefined)

  const logout = useCallback(
    (message?: string) => {
      window.clearTimeout(expiryTimer.current)
      clearSession()
      queryClient.clear()
      setUser(null)
      setNotice(message ?? null)
      setStatus('anonymous')
    },
    [queryClient],
  )

  const scheduleExpiry = useCallback(
    (expiresAt: number) => {
      window.clearTimeout(expiryTimer.current)
      const delay = Math.max(expiresAt - Date.now(), 0)
      // setTimeout cannot exceed ~24.8 days; the backend TTL is 8h, so this is safe.
      expiryTimer.current = window.setTimeout(
        () => logout('Your session has expired. Please sign in again.'),
        delay,
      )
    },
    [logout],
  )

  // Backend said 401 on a protected call.
  useEffect(() => {
    setUnauthorizedHandler(() => logout('Your session is no longer valid. Please sign in again.'))
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Restore the session after a browser refresh, re-validating with the backend.
  useEffect(() => {
    let cancelled = false
    const session = loadSession()
    if (!session) return
    authApi
      .getMe()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        scheduleExpiry(session.expiresAt)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = toApiError(error)
        if (apiError.status === 401) {
          // Token rejected: the client interceptor already cleared it.
          clearSession()
          setStatus('anonymous')
        } else {
          // Backend down or erroring: keep the session so a temporary outage doesn't sign the user out.
          setRestoreError(apiError.message)
          setStatus('unavailable')
        }
      })
    return () => {
      cancelled = true
    }
  }, [scheduleExpiry, restoreAttempt])

  const retryRestore = useCallback(() => {
    setRestoreError(null)
    setStatus('loading')
    setRestoreAttempt((n) => n + 1)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setNotice(null)
      const response = await authApi.login({ email: email.trim(), password })
      const expiresAt = saveSession(response.accessToken, response.expiresInSeconds)
      try {
        // After login, load the authoritative user from /api/users/me.
        const me = await authApi.getMe()
        setUser(me)
        scheduleExpiry(expiresAt)
        setStatus('authenticated')
      } catch (error) {
        clearSession()
        throw error
      }
    },
    [scheduleExpiry],
  )

  const refreshUser = useCallback(async () => {
    setUser(await authApi.getMe())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, notice, restoreError, retryRestore, login, logout, refreshUser }),
    [status, user, notice, restoreError, retryRestore, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
