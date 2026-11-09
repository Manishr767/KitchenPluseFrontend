import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { ToastProvider } from '@/components/common/Toast'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { clearSession, saveSession } from '@/features/auth/session'
import { AppRoutes } from '@/routes/AppRoutes'
import { freshState, installFakeBackend, type FakeState } from './fakeBackend'

let state: FakeState

function renderApp(path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: (n, e) => e instanceof ApiError && e.unreachable && n < 1, staleTime: 0, retryDelay: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function signIn(email: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), 'pw')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

const nav = () => within(screen.getByRole('navigation', { name: 'Main navigation' }))

beforeEach(() => {
  clearSession()
  state = installFakeBackend(freshState())
})
afterEach(cleanup)

describe('login', () => {
  it('signs in, loads /api/users/me with the JWT and lands on the role dashboard', async () => {
    renderApp('/')
    await signIn('admin@example.test')
    expect(await screen.findByRole('heading', { name: 'Welcome back, Ada Admin' })).toBeTruthy()

    const login = state.calls.find((c) => c.url === '/api/auth/login')!
    expect(login.auth).toBeNull()
    expect(login.body).toEqual({ email: 'admin@example.test', password: 'pw' })
    const me = state.calls.find((c) => c.url === '/api/users/me')!
    expect(me.auth).toBe('Bearer token-1')
    expect(sessionStorage.getItem('kitchenpulse.session')).toContain('token-1')
  })

  it('shows the API error for bad credentials and stays on the login page', async () => {
    renderApp('/')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'admin@example.test')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Invalid email or password.')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
  })

  it('validates empty fields before calling the API', async () => {
    renderApp('/')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Email is required.')).toBeTruthy()
    expect(screen.getByText('Password is required.')).toBeTruthy()
    expect(state.calls).toHaveLength(0)
  })

  it('reports an unreachable backend on the login form', async () => {
    state.down = true
    renderApp('/')
    await signIn('admin@example.test')
    expect(await screen.findByText(/Cannot reach the KitchenPulse server/)).toBeTruthy()
  })

  it('toggles password visibility', async () => {
    renderApp('/')
    const user = userEvent.setup()
    const password = await screen.findByLabelText('Password')
    expect(password.getAttribute('type')).toBe('password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password.getAttribute('type')).toBe('text')
  })
})

describe('session handling', () => {
  it('restores a valid session after a browser refresh by re-validating with /api/users/me', async () => {
    saveSession('token-1', 600)
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Welcome back, Ada Admin' })).toBeTruthy()
    expect(state.calls[0]).toMatchObject({ url: '/api/users/me', auth: 'Bearer token-1' })
  })

  it('sends a user with a rejected token back to the login page', async () => {
    saveSession('token-404', 600) // not a real user -> 401
    renderApp('/dashboard')
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy()
    expect(sessionStorage.getItem('kitchenpulse.session')).toBeNull()
  })

  it('keeps the session and offers a retry when the backend is down during a refresh', async () => {
    saveSession('token-1', 600)
    state.down = true
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Can’t reach KitchenPulse' })).toBeTruthy()
    expect(sessionStorage.getItem('kitchenpulse.session')).toContain('token-1')

    state.down = false
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Welcome back, Ada Admin' })).toBeTruthy()
  })

  it('redirects anonymous visitors of protected pages to login', async () => {
    renderApp('/branches')
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy()
  })

  it('signing out clears the stored session', async () => {
    saveSession('token-1', 600)
    renderApp('/dashboard')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Sign out/ }))
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy()
    expect(sessionStorage.getItem('kitchenpulse.session')).toBeNull()
  })
})

describe('role-based navigation', () => {
  const cases: [string, string, string[], string[]][] = [
    ['ADMIN', 'token-1', ['Dashboard', 'Branches', 'Inventory', 'Ingredient requests', 'Ingredients', 'Units', 'Users'], ['My branch', 'Stock counting']],
    ['CENTRAL_OFFICE_STAFF', 'token-3', ['Dashboard', 'Branches', 'Inventory', 'Ingredient requests', 'Approvals', 'Ingredients', 'Units'], ['Users', 'My branch', 'Warehouse']],
    ['WAREHOUSE_MANAGER', 'token-4', ['Dashboard', 'Branches', 'Inventory', 'Ingredient requests', 'Warehouse', 'Ingredients', 'Units'], ['Users', 'My branch', 'Approvals']],
    ['BRANCH_STAFF', 'token-2', ['Dashboard', 'My branch', 'Stock counting', 'Inventory', 'Ingredient requests', 'Ingredients', 'Units'], ['Users', 'Branches', 'Approvals', 'Warehouse']],
    ['DELIVERY_PERSON', 'token-5', ['Dashboard', 'Ingredients', 'Units'], ['Users', 'Branches', 'My branch', 'Approvals', 'Warehouse']],
  ]

  it.each(cases)('%s sees the right sidebar entries', async (_role, token, visible, hidden) => {
    saveSession(token, 600)
    renderApp('/dashboard')
    await screen.findByRole('navigation', { name: 'Main navigation' })
    for (const label of visible) expect(nav().getByRole('link', { name: label })).toBeTruthy()
    for (const label of hidden) expect(nav().queryByRole('link', { name: label })).toBeNull()
    if (_role === 'DELIVERY_PERSON') {
      expect(nav().queryByRole('link', { name: 'Ingredient requests' })).toBeNull()
    }
    expect(nav().getByRole('link', { name: /Deliveries/ })).toBeTruthy()
  })

  it('blocks a delivery person from /users in the UI (and the backend would answer 403 anyway)', async () => {
    saveSession('token-5', 600)
    renderApp('/users')
    expect(await screen.findByRole('heading', { name: 'You don’t have access to this page' })).toBeTruthy()
    expect(state.calls.some((c) => c.url === '/api/users' && c.method === 'GET')).toBe(false)
  })

  it('shows a clear Coming Soon page for future modules without calling any API', async () => {
    saveSession('token-2', 600)
    renderApp('/deliveries')
    expect(await screen.findByText('Coming Soon – Backend Integration Pending')).toBeTruthy()
    expect(state.calls.filter((c) => c.url !== '/api/users/me')).toHaveLength(0)
  })

  it('allows Central Office and Admin to access approvals but blocks other roles', async () => {
    saveSession('token-2', 600)
    renderApp('/approvals')
    expect(await screen.findByRole('heading', { name: 'You don’t have access to this page' })).toBeTruthy()
    cleanup()
    clearSession()
    saveSession('token-3', 600)
    renderApp('/approvals')
    expect(await screen.findByRole('heading', { name: 'Approvals' })).toBeTruthy()
  })

  it('Central Office can partially approve a submitted branch request', async () => {
    saveSession('token-3', 600)
    renderApp('/approvals')
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Approvals' })).toBeTruthy()
    expect(await screen.findByText('Request #1 · Branch #1')).toBeTruthy()
    const quantity = screen.getByLabelText('Flour approved quantity')
    await user.clear(quantity)
    await user.type(quantity, '8')
    await user.type(screen.getByLabelText('Review note (optional)'), 'Only 8 kg available today')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))
    await waitFor(() => expect(state.calls.some((call) => call.method === 'POST' && call.url === '/api/ingredient-requests/1/review')).toBe(true))
    expect(state.calls.find((call) => call.method === 'POST' && call.url === '/api/ingredient-requests/1/review')?.body).toEqual({ items: [{ ingredientId: 1, approvedQuantity: 8 }], reviewNote: 'Only 8 kg available today' })
    expect(await screen.findByText('PARTIALLY APPROVED')).toBeTruthy()
  })

  it('warehouse manager can dispatch prepared quantities for an approved request', async () => {
    state.ingredientRequests[0].status = 'PARTIALLY_APPROVED'
    state.ingredientRequests[0].items[0].approvedQuantity = 8
    saveSession('token-4', 600)
    renderApp('/warehouse')
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Warehouse' })).toBeTruthy()
    const quantity = await screen.findByLabelText('Flour dispatched quantity')
    await user.clear(quantity)
    await user.type(quantity, '7')
    await user.type(screen.getByLabelText('Dispatch note (optional)'), 'Packed today')
    await user.click(screen.getByRole('button', { name: 'Confirm dispatch' }))
    await waitFor(() => expect(state.calls.some((call) => call.method === 'POST' && call.url === '/api/warehouse/requests/1/dispatch')).toBe(true))
    expect(state.calls.find((call) => call.method === 'POST' && call.url === '/api/warehouse/requests/1/dispatch')?.body).toEqual({
      items: [{ ingredientId: 1, dispatchedQuantity: 7 }], note: 'Packed today',
    })
    expect(await screen.findByText('Request #1 dispatched.')).toBeTruthy()
  })

  it('blocks non-branch staff from stock counting', async () => {
    saveSession('token-1', 600)
    renderApp('/stock-counting')
    expect(await screen.findByRole('heading', { name: 'You don’t have access to this page' })).toBeTruthy()
    expect(state.calls.some((call) => call.url === '/api/ingredients' || call.url === '/api/inventory')).toBe(false)
  })
})

describe('data comes from the API', () => {
  it('admin dashboard counts come from the API responses', async () => {
    saveSession('token-1', 600)
    renderApp('/dashboard')
    const usersCard = (await screen.findByText('Users', { selector: 'p' })).closest('a')!
    await waitFor(() => expect(within(usersCard).getByText('5')).toBeTruthy())
    const ingredientsCard = screen.getByText('Ingredients', { selector: 'p' }).closest('a')!
    await waitFor(() => expect(within(ingredientsCard).getByText('3')).toBeTruthy())
    expect(within(ingredientsCard).getByText('2 active · 1 inactive')).toBeTruthy()
  })

  it('branch staff dashboard shows their own branch via GET /api/branches/{id} and never lists branches', async () => {
    saveSession('token-2', 600)
    renderApp('/dashboard')
    expect(await screen.findByText('Main Street')).toBeTruthy()
    expect(state.calls.some((c) => c.url === '/api/branches/1')).toBe(true)
    expect(state.calls.some((c) => c.url === '/api/branches')).toBe(false)
  })

  it('branch list: client-side search and status filter over the full array', async () => {
    saveSession('token-1', 600)
    renderApp('/branches')
    const user = userEvent.setup()
    expect(await screen.findByText('Main Street')).toBeTruthy()
    expect(screen.getByText('Harbor')).toBeTruthy()

    await user.type(screen.getByLabelText('Search branches'), 'harb')
    expect(screen.queryByText('Main Street')).toBeNull()
    expect(screen.getByText('Harbor')).toBeTruthy()

    await user.clear(screen.getByLabelText('Search branches'))
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'active')
    expect(screen.getByText('Main Street')).toBeTruthy()
    expect(screen.queryByText('Harbor')).toBeNull()
  })

  it('ingredient search is server-side (q parameter, debounced)', async () => {
    saveSession('token-1', 600)
    renderApp('/ingredients')
    const user = userEvent.setup()
    expect(await screen.findByText('Flour')).toBeTruthy()
    await user.type(screen.getByLabelText('Search ingredients'), 'milk')
    await waitFor(() => expect(state.calls.some((c) => c.url === '/api/ingredients' && c.params?.q === 'milk')).toBe(true))
    await waitFor(() => expect(screen.queryByText('Flour')).toBeNull())
    expect(screen.getByText('Milk')).toBeTruthy()
  })

  it('read-only roles get no write controls', async () => {
    saveSession('token-3', 600)
    renderApp('/ingredients')
    expect(await screen.findByText('Flour')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'New ingredient' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Rename/ })).toBeNull()
  })

  it('user list loads every user and filters client-side by role', async () => {
    saveSession('token-1', 600)
    renderApp('/users')
    const user = userEvent.setup()
    expect(await screen.findByText('Sam Staff')).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Filter by role'), 'DELIVERY_PERSON')
    expect(screen.queryByText('Sam Staff')).toBeNull()
    expect(screen.getByText('Dee Driver')).toBeTruthy()
  })

  it('shows a real error state (no mock data) when an API call fails', async () => {
    saveSession('token-1', 600)
    state.failing.add('/api/branches')
    renderApp('/branches')
    expect(await screen.findByText(/Cannot reach the KitchenPulse server/)).toBeTruthy()
    expect(screen.queryByText('Main Street')).toBeNull()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})

describe('stock counting', () => {
  it('loads active ingredients and submits only entered quantities for the signed-in branch', async () => {
    saveSession('token-2', 600)
    renderApp('/stock-counting')
    const user = userEvent.setup()
    expect(await screen.findByText('Flour')).toBeTruthy()
    expect(screen.getByText('Milk')).toBeTruthy()
    expect(screen.queryByText('Old spice')).toBeNull()
    await user.type(screen.getByLabelText('Flour counted quantity'), '12.5')
    await user.click(screen.getByRole('button', { name: 'Submit stock count' }))
    await waitFor(() => expect(state.calls.some((call) => call.method === 'POST' && call.url === '/api/stock-counts')).toBe(true))
    const submitted = state.calls.find((call) => call.method === 'POST' && call.url === '/api/stock-counts')!
    expect(submitted.auth).toBe('Bearer token-2')
    expect(submitted.body).toEqual({ branchId: 1, items: [{ ingredientId: 1, quantity: 12.5 }] })
    expect(await screen.findByText('Stock count #1 submitted (1 items).')).toBeTruthy()
  })

  it('does not submit quantities with more than three decimal places', async () => {
    saveSession('token-2', 600)
    renderApp('/stock-counting')
    const user = userEvent.setup()
    await screen.findByText('Flour')
    await user.type(screen.getByLabelText('Flour counted quantity'), '1.2345')
    expect(screen.getByRole('button', { name: 'Submit stock count' })).toHaveProperty('disabled', true)
    expect(state.calls.some((call) => call.method === 'POST' && call.url === '/api/stock-counts')).toBe(false)
  })
})

describe('mutations', () => {
  it('creates an ingredient with the selected unit and refreshes the list', async () => {
    saveSession('token-1', 600)
    renderApp('/ingredients')
    const user = userEvent.setup()
    await screen.findByText('Flour')
    await user.click(screen.getByRole('button', { name: 'New ingredient' }))
    await user.type(screen.getByLabelText('Name'), 'Butter')
    await user.selectOptions(await screen.findByLabelText('Stock unit'), '1')
    await user.click(screen.getByRole('button', { name: 'Create ingredient' }))

    await waitFor(() => expect(state.calls.some((c) => c.method === 'POST' && c.url === '/api/ingredients')).toBe(true))
    expect(state.calls.find((c) => c.method === 'POST' && c.url === '/api/ingredients')!.body).toEqual({ name: 'Butter', stockUnitId: 1 })
    expect(await screen.findByText('Butter')).toBeTruthy()
  })

  it('surfaces a backend conflict (409) inside the form', async () => {
    saveSession('token-1', 600)
    renderApp('/ingredients')
    const user = userEvent.setup()
    await screen.findByText('Flour')
    await user.click(screen.getByRole('button', { name: 'New ingredient' }))
    await user.type(screen.getByLabelText('Name'), 'flour')
    await user.selectOptions(await screen.findByLabelText('Stock unit'), '1')
    await user.click(screen.getByRole('button', { name: 'Create ingredient' }))
    expect(await screen.findByText("An ingredient named 'flour' already exists.")).toBeTruthy()
  })

  it('creates a branch and validates the code pattern locally first', async () => {
    saveSession('token-1', 600)
    renderApp('/branches')
    const user = userEvent.setup()
    await screen.findByText('Main Street')
    await user.click(screen.getByRole('button', { name: 'New branch' }))
    await user.type(screen.getByLabelText('Code'), 'bad code!')
    await user.type(screen.getByLabelText('Name'), 'Airport')
    await user.type(screen.getByLabelText('Address'), '9 Runway Ave')
    await user.click(screen.getByRole('button', { name: 'Create branch' }))
    expect(await screen.findByText('Use only letters, numbers, hyphens and underscores.')).toBeTruthy()
    expect(state.calls.some((c) => c.method === 'POST' && c.url === '/api/branches')).toBe(false)

    await user.clear(screen.getByLabelText('Code'))
    await user.type(screen.getByLabelText('Code'), 'AIR-1')
    await user.click(screen.getByRole('button', { name: 'Create branch' }))
    await waitFor(() => expect(state.calls.some((c) => c.method === 'POST' && c.url === '/api/branches')).toBe(true))
    expect(await screen.findByText('Airport')).toBeTruthy()
  })
})
