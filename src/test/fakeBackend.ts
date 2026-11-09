// TEST-ONLY stand-in for the Spring Boot API, written from the contract verified in the backend source.
// It is never imported by application code. It plugs into the Axios instance as an adapter so the real
// client, interceptors, API modules, hooks and components run unmodified.
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { api } from '@/api/client'
import type { Branch, Ingredient, InventoryItem, Role, Unit, User } from '@/types'
import type { IngredientRequest } from '@/api/ingredient-requests.api'

const NOW = '2026-01-15T09:30:00.123456'

export function makeUser(id: number, role: Role, extra: Partial<User> = {}): User {
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.test`,
    role,
    branchId: role === 'BRANCH_STAFF' ? 1 : null,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...extra,
  }
}

export interface FakeState {
  users: User[]
  branches: Branch[]
  units: Unit[]
  ingredients: Ingredient[]
  inventory: InventoryItem[]
  ingredientRequests: IngredientRequest[]
  /** Every request seen, for assertions. */
  calls: { method: string; url: string; params?: Record<string, unknown>; auth: string | null; body?: unknown }[]
  /** When set, every request fails as if the server were down. */
  down: boolean
  /** Request paths that fail as if the server were unreachable (everything else keeps working). */
  failing: Set<string>
}

export function freshState(): FakeState {
  const units: Unit[] = [
    { id: 1, name: 'Kilogram', symbol: 'kg' },
    { id: 2, name: 'Litre', symbol: 'l' },
  ]
  return {
    users: [
      makeUser(1, 'ADMIN', { name: 'Ada Admin', email: 'admin@example.test' }),
      makeUser(2, 'BRANCH_STAFF', { name: 'Sam Staff', email: 'staff@example.test' }),
      makeUser(3, 'CENTRAL_OFFICE_STAFF', { name: 'Olive Office', email: 'office@example.test' }),
      makeUser(4, 'WAREHOUSE_MANAGER', { name: 'Wes Warehouse', email: 'warehouse@example.test' }),
      makeUser(5, 'DELIVERY_PERSON', { name: 'Dee Driver', email: 'driver@example.test' }),
    ],
    branches: [
      { id: 1, code: 'MAIN', name: 'Main Street', address: '1 Main St', active: true, createdAt: NOW, updatedAt: NOW },
      { id: 2, code: 'HARBOR', name: 'Harbor', address: '2 Pier Rd', active: false, createdAt: NOW, updatedAt: NOW },
    ],
    units,
    ingredients: [
      { id: 1, name: 'Flour', stockUnit: units[0], active: true, createdAt: NOW, updatedAt: NOW },
      { id: 2, name: 'Milk', stockUnit: units[1], active: true, createdAt: NOW, updatedAt: NOW },
      { id: 3, name: 'Old spice', stockUnit: units[0], active: false, createdAt: NOW, updatedAt: NOW },
    ],
    inventory: [],
    ingredientRequests: [{
      id: 1, branchId: 1, createdByUserId: 2, status: 'SUBMITTED', createdAt: NOW, submittedAt: NOW,
      reviewedByUserId: null, reviewedAt: null, reviewNote: null,
      items: [{ id: 1, ingredientId: 1, requestedQuantity: 10, approvedQuantity: null }],
    }],
    calls: [],
    down: false,
    failing: new Set(),
  }
}

function problem(status: number, title: string, detail: string, errors?: Record<string, string>) {
  return { status, data: { type: 'about:blank', title, status, detail, ...(errors ? { errors } : {}) } }
}

type Result = { status: number; data?: unknown }

function route(state: FakeState, method: string, path: string, params: Record<string, unknown>, body: any, caller: User | null): Result {
  const ok = (data: unknown, status = 200): Result => ({ status, data })
  const forbidden = () => problem(403, 'Access denied', 'You do not have permission to perform this action.')

  if (method === 'POST' && path === '/api/auth/login') {
    const user = state.users.find((u) => u.email === body?.email)
    if (!body?.email || !body?.password) return problem(400, 'Validation failed', 'Request validation failed.', { email: 'must not be blank' })
    if (!user || body.password !== 'pw' || !user.active) return problem(401, 'Authentication failed', 'Invalid email or password.')
    return ok({ accessToken: `token-${user.id}`, tokenType: 'Bearer', expiresInSeconds: 28800, user })
  }

  if (!caller) return problem(401, 'Authentication required', 'Authentication is required to access this resource.')
  const role = caller.role

  if (method === 'GET' && path === '/api/users/me') return ok(caller)
  if (method === 'GET' && path === '/api/ingredient-requests') {
    if (!['ADMIN', 'BRANCH_STAFF', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER'].includes(role)) return forbidden()
    return ok(role === 'BRANCH_STAFF' ? state.ingredientRequests.filter((request) => request.branchId === caller.branchId) : state.ingredientRequests)
  }
  const reviewMatch = path.match(/^\/api\/ingredient-requests\/(\d+)\/review$/)
  if (reviewMatch && method === 'POST') {
    if (!['ADMIN', 'CENTRAL_OFFICE_STAFF'].includes(role)) return forbidden()
    const request = state.ingredientRequests.find((entry) => entry.id === Number(reviewMatch[1]))
    if (!request || request.status !== 'SUBMITTED') return problem(422, 'Business rule violation', 'Only submitted requests can be reviewed.')
    if (!Array.isArray(body?.items) || body.items.length !== request.items.length) return problem(422, 'Business rule violation', 'Review must include every requested ingredient.')
    for (const line of body.items) {
      const item = request.items.find((entry) => entry.ingredientId === Number(line.ingredientId))
      if (!item || Number(line.approvedQuantity) < 0 || Number(line.approvedQuantity) > item.requestedQuantity) return problem(422, 'Business rule violation', 'Invalid approved quantity.')
      item.approvedQuantity = Number(line.approvedQuantity)
    }
    const allFull = request.items.every((item) => item.approvedQuantity === item.requestedQuantity)
    const any = request.items.some((item) => (item.approvedQuantity ?? 0) > 0)
    request.status = !any ? 'REJECTED' : allFull ? 'APPROVED' : 'PARTIALLY_APPROVED'
    request.reviewedByUserId = caller.id
    request.reviewedAt = NOW
    request.reviewNote = body.reviewNote ?? null
    return ok(request)
  }

  if (method === 'GET' && path === '/api/inventory') {
    if (!['ADMIN', 'BRANCH_STAFF', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER'].includes(role)) return forbidden()
    const requestedBranch = params.branchId === undefined ? null : Number(params.branchId)
    if (role === 'BRANCH_STAFF' && requestedBranch !== null && requestedBranch !== caller.branchId) return forbidden()
    const resolvedBranch = caller.branchId ?? requestedBranch
    if (resolvedBranch === null) return problem(400, 'Validation failed', 'branchId is required.')
    return ok(state.inventory.filter((item) => item.stockCountId > 0 && (item as InventoryItem & { branchId?: number }).branchId === resolvedBranch))
  }

  if (method === 'POST' && path === '/api/stock-counts') {
    if (role !== 'BRANCH_STAFF') return forbidden()
    if (Number(body?.branchId) !== caller.branchId) return forbidden()
    if (!Array.isArray(body?.items) || body.items.length === 0) return problem(400, 'Validation failed', 'At least one item is required.')
    const ids = body.items.map((item: any) => Number(item.ingredientId))
    if (new Set(ids).size !== ids.length) return problem(400, 'Validation failed', 'Duplicate ingredient IDs are not allowed.')
    for (const item of body.items) {
      const ingredient = state.ingredients.find((entry) => entry.id === Number(item.ingredientId) && entry.active)
      if (!ingredient || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 0) {
        return problem(400, 'Validation failed', 'Each item must reference an active ingredient and have a non-negative quantity.')
      }
    }
    const stockCountId = state.inventory.reduce((max, item) => Math.max(max, item.stockCountId), 0) + 1
    const countedAt = NOW
    for (const item of body.items) {
      const ingredient = state.ingredients.find((entry) => entry.id === Number(item.ingredientId))!
      const existing = state.inventory.findIndex((entry) => entry.ingredientId === ingredient.id && (entry as InventoryItem & { branchId?: number }).branchId === caller.branchId)
      const row = { ingredientId: ingredient.id, ingredientName: ingredient.name, quantity: Number(item.quantity), unit: ingredient.stockUnit.symbol, countedAt, stockCountId, branchId: caller.branchId! } as InventoryItem & { branchId: number }
      if (existing >= 0) state.inventory[existing] = row
      else state.inventory.push(row)
    }
    return ok({ stockCountId, branchId: caller.branchId, countedAt, status: 'SUBMITTED', itemCount: body.items.length }, 201)
  }

  if (path === '/api/users' && method === 'GET') {
    if (role !== 'ADMIN') return forbidden()
    const size = Math.min(Number(params.size ?? 20), 100)
    const page = Number(params.page ?? 0)
    const content = state.users.slice(page * size, page * size + size)
    return ok({ content, page, size, totalElements: state.users.length, totalPages: Math.max(Math.ceil(state.users.length / size), 1) })
  }
  const userId = path.match(/^\/api\/users\/(\d+)$/)
  if (userId && method === 'GET') {
    if (role !== 'ADMIN') return forbidden()
    const u = state.users.find((x) => x.id === Number(userId[1]))
    return u ? ok(u) : problem(404, 'Not found', 'User not found.')
  }

  if (path === '/api/branches' && method === 'GET') {
    return ['ADMIN', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER'].includes(role) ? ok(state.branches) : forbidden()
  }
  const branchId = path.match(/^\/api\/branches\/(\d+)$/)
  if (branchId && method === 'GET') {
    const id = Number(branchId[1])
    const allowed = ['ADMIN', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER'].includes(role) || (role === 'BRANCH_STAFF' && caller.branchId === id)
    if (!allowed) return forbidden()
    const b = state.branches.find((x) => x.id === id)
    return b ? ok(b) : problem(404, 'Not found', 'Branch not found.')
  }
  if (path === '/api/branches' && method === 'POST') {
    if (role !== 'ADMIN') return forbidden()
    const created: Branch = { id: state.branches.length + 1, code: body.code, name: body.name, address: body.address, active: true, createdAt: NOW, updatedAt: NOW }
    state.branches.push(created)
    return ok(created, 201)
  }

  if (path === '/api/units' && method === 'GET') return ok(state.units)

  if (path === '/api/ingredients' && method === 'GET') {
    let list = state.ingredients
    if (params.active !== undefined) list = list.filter((i) => i.active === (params.active === true || params.active === 'true'))
    if (params.q) list = list.filter((i) => i.name.toLowerCase().includes(String(params.q).toLowerCase()))
    const size = Math.min(Number(params.size ?? 20), 100)
    const page = Number(params.page ?? 0)
    return ok({ content: list.slice(page * size, page * size + size), page, size, totalElements: list.length, totalPages: Math.max(Math.ceil(list.length / size), 1) })
  }
  if (path === '/api/ingredients' && method === 'POST') {
    if (role !== 'ADMIN') return forbidden()
    const unit = state.units.find((u) => u.id === body.stockUnitId)
    if (!unit) return problem(404, 'Not found', 'Unit not found.')
    if (state.ingredients.some((i) => i.name.toLowerCase() === String(body.name).toLowerCase())) {
      return problem(409, 'Conflict', `An ingredient named '${body.name}' already exists.`)
    }
    const created: Ingredient = { id: state.ingredients.length + 1, name: body.name, stockUnit: unit, active: true, createdAt: NOW, updatedAt: NOW }
    state.ingredients.push(created)
    return ok(created, 201)
  }

  return problem(404, 'Not found', `No handler for ${method} ${path}`)
}

/** Installs the fake as the Axios adapter. Returns the state for assertions and tweaks. */
export function installFakeBackend(state: FakeState = freshState()): FakeState {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? 'get').toUpperCase()
    const url = config.url ?? ''
    const auth = (config.headers.get('Authorization') as string | null) ?? null
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    state.calls.push({ method, url, params: config.params, auth, body })

    if (state.down || state.failing.has(url)) throw new AxiosError('connect ECONNREFUSED', 'ERR_NETWORK', config)

    const token = auth?.startsWith('Bearer token-') ? Number(auth.slice('Bearer token-'.length)) : null
    const caller = token ? (state.users.find((u) => u.id === token && u.active) ?? null) : null
    const result = route(state, method, url, (config.params ?? {}) as Record<string, unknown>, body, caller)

    // structuredClone: real HTTP always yields fresh objects; sharing the live arrays would hide updates.
    const response: AxiosResponse = { data: result.data === undefined ? undefined : structuredClone(result.data), status: result.status, statusText: String(result.status), headers: {}, config }
    if (result.status >= 200 && result.status < 300) return response
    throw new AxiosError(`Request failed with status code ${result.status}`, 'ERR_BAD_REQUEST', config, null, response)
  }
  return state
}
