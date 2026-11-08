import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, saveSession } from '@/features/auth/session'
import { freshState, installFakeBackend, type FakeState } from '@/test/fakeBackend'
import { ApiError } from './errors'
import { getMe, login } from './auth.api'
import { setUnauthorizedHandler, api } from './client'
import { countIngredients, listIngredients, setIngredientActive } from './ingredients.api'
import { fetchAllUsers } from './users.api'
import { listBranches, setBranchActive } from './branches.api'

let state: FakeState

beforeEach(() => {
  clearSession()
  setUnauthorizedHandler(null)
  state = installFakeBackend(freshState())
})

describe('request pipeline', () => {
  it('sends credentials to the login endpoint without any Authorization header', async () => {
    saveSession('stale-token', 60) // even with a stored token, login must not attach it
    const res = await login({ email: 'admin@example.test', password: 'pw' })
    expect(res.accessToken).toBe('token-1')
    expect(state.calls[0]).toMatchObject({ method: 'POST', url: '/api/auth/login', auth: null })
  })

  it('attaches the Bearer token to protected requests', async () => {
    saveSession('token-1', 60)
    const me = await getMe()
    expect(me.role).toBe('ADMIN')
    expect(state.calls[0].auth).toBe('Bearer token-1')
  })

  it('treats 401 on a protected call as an expired session: clears it and notifies', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    saveSession('token-999', 60) // unknown token -> backend answers 401
    await expect(getMe()).rejects.toMatchObject({ status: 401 })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does NOT treat a wrong-password 401 on login as an expired session', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    saveSession('token-1', 60)
    await expect(login({ email: 'admin@example.test', password: 'wrong' })).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it('treats 403 as a permission problem, not a logout', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    saveSession('token-5', 60) // DELIVERY_PERSON
    await expect(listBranches()).rejects.toMatchObject({ status: 403 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('maps validation errors (400 with field errors)', async () => {
    const error = await login({ email: '', password: '' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).fieldErrors).toEqual({ email: 'must not be blank' })
  })

  it('reports an unreachable server clearly', async () => {
    state.down = true
    saveSession('token-1', 60)
    const error = (await getMe().catch((e: unknown) => e)) as ApiError
    expect(error.unreachable).toBe(true)
    expect(error.message).toMatch(/Cannot reach the KitchenPulse server/)
  })

  it('reports the Vite proxy failure (empty 5xx body) as unreachable', async () => {
    api.defaults.adapter = async (config) => {
      throw new AxiosError('boom', 'ERR_BAD_RESPONSE', config, null, {
        data: '', status: 500, statusText: 'Internal Server Error', headers: {}, config,
      })
    }
    saveSession('token-1', 60)
    const error = (await getMe().catch((e: unknown) => e)) as ApiError
    expect(error.unreachable).toBe(true)
  })
})

describe('endpoint contracts (as verified in the backend source)', () => {
  beforeEach(() => saveSession('token-1', 60))

  it('fetchAllUsers walks every page at the backend maximum of 100 rows, sorted by id', async () => {
    state.users = Array.from({ length: 250 }, (_, i) => ({ ...state.users[0], id: i + 1, email: `u${i + 1}@example.test` }))
    const users = await fetchAllUsers()
    expect(users).toHaveLength(250)
    expect(new Set(users.map((u) => u.id)).size).toBe(250)
    const userCalls = state.calls.filter((c) => c.url === '/api/users')
    expect(userCalls.map((c) => c.params)).toEqual([
      { page: 0, size: 100, sort: 'id,asc' },
      { page: 1, size: 100, sort: 'id,asc' },
      { page: 2, size: 100, sort: 'id,asc' },
    ])
  })

  it('ingredient list sends only the documented query parameters', async () => {
    await listIngredients({ q: '  flour ', active: true, page: 2, size: 10, sort: 'name,asc' })
    expect(state.calls[0].params).toEqual({ q: 'flour', active: true, page: 2, size: 10, sort: 'name,asc' })
    await listIngredients({})
    expect(state.calls[1].params).toEqual({})
  })

  it('ingredient counts come from the real server-side active filter', async () => {
    expect(await countIngredients()).toBe(3)
    expect(await countIngredients(true)).toBe(2)
    expect(await countIngredients(false)).toBe(1)
  })

  it('activate / deactivate use POST on the documented paths', async () => {
    const adapterCalls: string[] = []
    const original = api.defaults.adapter
    api.defaults.adapter = async (config) => {
      adapterCalls.push(`${config.method?.toUpperCase()} ${config.url}`)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }
    await setBranchActive(7, true)
    await setBranchActive(7, false)
    await setIngredientActive(3, true)
    api.defaults.adapter = original
    expect(adapterCalls).toEqual([
      'POST /api/branches/7/activate',
      'POST /api/branches/7/deactivate',
      'POST /api/ingredients/3/activate',
    ])
  })
})
