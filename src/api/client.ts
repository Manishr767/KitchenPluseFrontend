import axios from 'axios'
import { clearSession, getToken } from '@/features/auth/session'
import { toApiError } from './errors'

// In development, Vite proxies /api/* to localhost:8080. In production,
// VITE_API_BASE_URL points directly to the deployed Spring Boot API.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

/** The AuthProvider registers what should happen when the backend rejects the token. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

const LOGIN_PATH = '/api/auth/login'

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token && config.url !== LOGIN_PATH) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)

    // 401 on a protected call = token expired, invalid, or the user was deactivated.
    // A 401 from the login call itself just means "wrong credentials", not "session expired".
    const url = axios.isAxiosError(error) ? error.config?.url : undefined
    if (apiError.status === 401 && url !== LOGIN_PATH && getToken()) {
      clearSession()
      onUnauthorized?.()
    }
    // 403 is deliberately not treated as a logout: the user is valid but lacks permission.
    return Promise.reject(apiError)
  },
)
