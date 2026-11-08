// Token storage: in-memory copy + sessionStorage so a browser refresh keeps the session.
//
// Security trade-off (also documented in README.md):
//  - sessionStorage is readable by any JavaScript running on this origin, so an XSS bug
//    would let an attacker steal the token. An HttpOnly cookie would not have this weakness,
//    but the backend only supports Bearer tokens (no cookies, no CSRF protection).
//  - sessionStorage is per-tab and cleared when the tab closes, which limits exposure
//    compared with localStorage. The token itself lives at most 8 hours (backend TTL).
//  - Passwords are never stored. The backend re-checks role and active status on every request.

const KEY = 'kitchenpulse.session'

interface StoredSession {
  token: string
  /** Epoch milliseconds when the token stops being valid (computed from expiresInSeconds). */
  expiresAt: number
}

let memory: StoredSession | null = null

function isStoredSession(value: unknown): value is StoredSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredSession).token === 'string' &&
    typeof (value as StoredSession).expiresAt === 'number'
  )
}

export function saveSession(token: string, expiresInSeconds: number): number {
  const session = { token, expiresAt: Date.now() + expiresInSeconds * 1000 }
  memory = session
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Storage unavailable (private mode etc.): the in-memory copy still works until refresh.
  }
  return session.expiresAt
}

/** Loads the session from memory or sessionStorage. Returns null if missing or expired. */
export function loadSession(): StoredSession | null {
  if (!memory) {
    try {
      const raw = sessionStorage.getItem(KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : null
      if (isStoredSession(parsed)) memory = parsed
    } catch {
      memory = null
    }
  }
  if (memory && memory.expiresAt <= Date.now()) {
    clearSession()
    return null
  }
  return memory
}

export function getToken(): string | null {
  return loadSession()?.token ?? null
}

export function clearSession(): void {
  memory = null
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
