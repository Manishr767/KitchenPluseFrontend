import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, getToken, loadSession, saveSession } from './session'

beforeEach(() => {
  clearSession()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-01T10:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('session storage', () => {
  it('stores the token in sessionStorage (never localStorage) with an expiry from expiresInSeconds', () => {
    const expiresAt = saveSession('abc', 28800)
    expect(expiresAt).toBe(Date.now() + 28_800_000)
    expect(sessionStorage.getItem('kitchenpulse.session')).toContain('abc')
    expect(localStorage.length).toBe(0)
  })

  it('restores a still-valid session after a "refresh" (memory lost, storage kept)', () => {
    saveSession('abc', 60)
    // simulate a reload: the module-level memory copy is gone but sessionStorage remains
    const raw = sessionStorage.getItem('kitchenpulse.session')
    clearSession()
    sessionStorage.setItem('kitchenpulse.session', raw as string)
    expect(getToken()).toBe('abc')
  })

  it('drops an expired session', () => {
    saveSession('abc', 60)
    vi.advanceTimersByTime(61_000)
    expect(loadSession()).toBeNull()
    expect(sessionStorage.getItem('kitchenpulse.session')).toBeNull()
  })

  it('ignores corrupt stored data', () => {
    sessionStorage.setItem('kitchenpulse.session', '{not json')
    expect(getToken()).toBeNull()
  })

  it('clearSession removes everything', () => {
    saveSession('abc', 60)
    clearSession()
    expect(getToken()).toBeNull()
    expect(sessionStorage.getItem('kitchenpulse.session')).toBeNull()
  })
})
