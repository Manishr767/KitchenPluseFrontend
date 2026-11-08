#!/usr/bin/env node
/**
 * KitchenPulse smoke test: real HTTP requests against the running backend.
 *
 *   KP_EMAIL=admin@example.com KP_PASSWORD='...' node scripts/smoke-test.mjs [--base URL] [--write]
 *
 *   --base URL   default http://localhost:5173 (through the Vite proxy, so it also proves the proxy works).
 *                Use http://localhost:8080 to talk to Spring Boot directly.
 *   --write      also run the tests that create data (branch, ingredient, BRANCH_STAFF user).
 *                The backend has no DELETE endpoints, so those records are deactivated, not removed.
 *                Everything created is named "SMOKE ..." / "smoke.*@example.test".
 *
 * Without --write the script only reads. Credentials come from the environment and are never stored.
 * Requires Node 18+ (global fetch).
 */
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const BASE = opt('--base', 'http://localhost:5173').replace(/\/$/, '')
const WRITE = args.includes('--write')
const EMAIL = process.env.KP_EMAIL
const PASSWORD = process.env.KP_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Set KP_EMAIL and KP_PASSWORD (an ADMIN account), e.g.\n  KP_EMAIL=admin@example.com KP_PASSWORD=... node scripts/smoke-test.mjs')
  process.exit(2)
}

const results = []
const assert = (cond, message) => {
  if (!cond) throw new Error(message)
}

async function check(name, fn) {
  try {
    const note = await fn()
    results.push({ name, ok: true })
    console.log(`  PASS  ${name}${note ? `  (${note})` : ''}`)
    return true
  } catch (error) {
    results.push({ name, ok: false })
    console.log(`  FAIL  ${name}\n          ${error.message}`)
    return false
  }
}

async function call(method, path, { token, body } = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new Error(
      `Cannot reach ${BASE}${path} (${error.cause?.code ?? error.message}). Is the backend running on 8080` +
        (BASE.includes('5173') ? ' and the Vite dev server on 5173?' : '?'),
    )
  }
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* not JSON */
  }
  return { status: res.status, json, text }
}

const expectStatus = (res, status, label) =>
  assert(res.status === status, `${label}: expected HTTP ${status}, got ${res.status} ${res.text.slice(0, 160)}`)
const isPage = (p) =>
  p && Array.isArray(p.content) && ['page', 'size', 'totalElements', 'totalPages'].every((k) => typeof p[k] === 'number')
const rand = () => Math.random().toString(36).slice(2, 8)

console.log(`\nKitchenPulse smoke test against ${BASE}${WRITE ? '  (write mode)' : '  (read-only)'}\n`)

// ---------------------------------------------------------------- authentication
let token = ''
let me = null

console.log('Authentication')
const loggedIn = await check('POST /api/auth/login returns token and user', async () => {
  const res = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })
  expectStatus(res, 200, 'login')
  const b = res.json
  assert(typeof b.accessToken === 'string' && b.accessToken.length > 20, 'no accessToken')
  assert(b.tokenType === 'Bearer', `tokenType is ${b.tokenType}`)
  assert(Number.isFinite(b.expiresInSeconds), 'no expiresInSeconds')
  for (const key of ['id', 'name', 'email', 'role', 'branchId', 'active']) assert(key in b.user, `user.${key} missing`)
  token = b.accessToken
  return `role ${b.user.role}, expires in ${b.expiresInSeconds}s`
})
if (!loggedIn) {
  console.log('\nCannot continue without a login. Check KP_EMAIL / KP_PASSWORD and that the account is active.')
  process.exit(1)
}

await check('GET /api/users/me works with the JWT', async () => {
  const res = await call('GET', '/api/users/me', { token })
  expectStatus(res, 200, 'me')
  me = res.json
  assert(me.email.toLowerCase() === EMAIL.toLowerCase(), `me.email is ${me.email}`)
  return `${me.name}, ${me.role}`
})
await check('GET /api/users/me without a token -> 401', async () => {
  expectStatus(await call('GET', '/api/users/me'), 401, 'no token')
})
await check('GET /api/users/me with a garbage token -> 401', async () => {
  expectStatus(await call('GET', '/api/users/me', { token: 'not.a.jwt' }), 401, 'bad token')
})
await check('login with a wrong password -> 401', async () => {
  const res = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: `${PASSWORD}-wrong` } })
  expectStatus(res, 401, 'wrong password')
})
await check('login with blank fields -> 400 with field errors', async () => {
  const res = await call('POST', '/api/auth/login', { body: { email: '', password: '' } })
  expectStatus(res, 400, 'blank login')
  assert(res.json?.errors && typeof res.json.errors === 'object', 'no errors map in the 400 body')
})

if (me?.role !== 'ADMIN') {
  console.log(`\nNote: ${EMAIL} is ${me?.role}, not ADMIN; admin-only checks below are expected to fail.`)
}

// ---------------------------------------------------------------- reads
console.log('\nRead endpoints (as ' + (me?.role ?? '?') + ')')
let branches = []
let units = []
await check('GET /api/branches returns an array', async () => {
  const res = await call('GET', '/api/branches', { token })
  expectStatus(res, 200, 'branches')
  assert(Array.isArray(res.json), 'branches is not a plain array')
  branches = res.json
  return `${branches.length} branches`
})
if (branches.length > 0) {
  await check('GET /api/branches/{id}', async () => {
    const res = await call('GET', `/api/branches/${branches[0].id}`, { token })
    expectStatus(res, 200, 'branch detail')
    for (const key of ['id', 'code', 'name', 'address', 'active', 'createdAt', 'updatedAt']) assert(key in res.json, `branch.${key} missing`)
  })
}
await check('GET /api/units returns an array', async () => {
  const res = await call('GET', '/api/units', { token })
  expectStatus(res, 200, 'units')
  assert(Array.isArray(res.json), 'units is not a plain array')
  units = res.json
  return `${units.length} units`
})
await check('GET /api/ingredients returns a PageResponse', async () => {
  const res = await call('GET', '/api/ingredients?page=0&size=5&sort=name,asc', { token })
  expectStatus(res, 200, 'ingredients')
  assert(isPage(res.json), 'not a PageResponse')
  if (res.json.content[0]) assert(res.json.content[0].stockUnit?.symbol !== undefined, 'ingredient.stockUnit missing')
  return `${res.json.totalElements} ingredients`
})
await check('ingredient filters: active=true and q= are accepted', async () => {
  const a = await call('GET', '/api/ingredients?active=true&size=1', { token })
  const q = await call('GET', '/api/ingredients?q=zzzz-no-such-thing&size=1', { token })
  expectStatus(a, 200, 'active filter')
  expectStatus(q, 200, 'q filter')
  assert(q.json.totalElements === 0, 'q filter did not narrow the results')
})

await check('GET /api/users: page size is capped at 100 and every user can be fetched page by page', async () => {
  const first = await call('GET', '/api/users?page=0&size=1000&sort=id,asc', { token })
  expectStatus(first, 200, 'users')
  assert(isPage(first.json), 'not a PageResponse')
  assert(first.json.size <= 100, `size=1000 was honoured (${first.json.size}); the frontend assumes a cap of 100`)
  const ids = new Set(first.json.content.map((u) => u.id))
  for (let page = 1; page < first.json.totalPages; page++) {
    const next = await call('GET', `/api/users?page=${page}&size=100&sort=id,asc`, { token })
    expectStatus(next, 200, `users page ${page}`)
    next.json.content.forEach((u) => ids.add(u.id))
  }
  assert(ids.size === first.json.totalElements, `walked ${ids.size} users but totalElements is ${first.json.totalElements}`)
  return `${ids.size} users, requested size 1000 -> ${first.json.size}`
})

// ---------------------------------------------------------------- writes
const created = { branch: null, ingredient: null, user: null }
if (WRITE) {
  console.log('\nWrite endpoints (creates records prefixed SMOKE)')
  const tag = rand().toUpperCase()

  await check('POST /api/branches creates a branch', async () => {
    const res = await call('POST', '/api/branches', {
      token,
      body: { code: `SMK-${tag}`, name: `SMOKE branch ${tag}`, address: '1 Test Street' },
    })
    expectStatus(res, 201, 'create branch')
    created.branch = res.json
    assert(res.json.active === true, 'new branch is not active')
    return `id ${res.json.id}`
  })
  await check('duplicate branch code -> 409', async () => {
    const res = await call('POST', '/api/branches', {
      token,
      body: { code: `SMK-${tag}`, name: 'duplicate', address: 'x' },
    })
    expectStatus(res, 409, 'duplicate branch')
  })
  await check('invalid branch code -> 400 with a field error', async () => {
    const res = await call('POST', '/api/branches', { token, body: { code: 'bad code!', name: 'x', address: 'y' } })
    expectStatus(res, 400, 'invalid code')
    assert(res.json?.errors?.code, 'no errors.code in the response')
  })

  let unit = units[0]
  if (!unit) {
    await check('POST /api/units creates a unit (none existed)', async () => {
      const res = await call('POST', '/api/units', { token, body: { name: `SMOKE unit ${tag}`, symbol: `s${tag.toLowerCase()}` } })
      expectStatus(res, 201, 'create unit')
      unit = res.json
    })
  }
  if (unit) {
    await check('POST /api/ingredients creates an ingredient with a unit', async () => {
      const res = await call('POST', '/api/ingredients', { token, body: { name: `SMOKE ingredient ${tag}`, stockUnitId: unit.id } })
      expectStatus(res, 201, 'create ingredient')
      created.ingredient = res.json
      assert(res.json.stockUnit?.id === unit.id, 'stockUnit mismatch')
      return `id ${res.json.id}`
    })
    await check('duplicate ingredient name (different case) -> 409', async () => {
      const res = await call('POST', '/api/ingredients', { token, body: { name: `smoke INGREDIENT ${tag.toLowerCase()}`, stockUnitId: unit.id } })
      expectStatus(res, 409, 'duplicate ingredient')
    })
  }

  if (created.branch) {
    const staffEmail = `smoke.${tag.toLowerCase()}@example.test`
    const staffPassword = `Smoke-${rand()}-${rand()}`
    let staffToken = ''
    await check('POST /api/users creates a BRANCH_STAFF user', async () => {
      const res = await call('POST', '/api/users', {
        token,
        body: { name: `SMOKE staff ${tag}`, email: staffEmail, password: staffPassword, role: 'BRANCH_STAFF', branchId: created.branch.id },
      })
      expectStatus(res, 201, 'create user')
      created.user = res.json
      assert(res.json.branchId === created.branch.id, 'branchId mismatch')
    })
    await check('BRANCH_STAFF without a branch -> 400/422', async () => {
      const res = await call('POST', '/api/users', {
        token,
        body: { name: 'x', email: `smoke.nobranch.${tag.toLowerCase()}@example.test`, password: 'longenough1', role: 'BRANCH_STAFF', branchId: null },
      })
      assert([400, 422].includes(res.status), `expected 400/422, got ${res.status}`)
    })

    if (created.user) {
      console.log('\nRole enforcement (as the new BRANCH_STAFF user)')
      await check('staff can log in', async () => {
        const res = await call('POST', '/api/auth/login', { body: { email: staffEmail, password: staffPassword } })
        expectStatus(res, 200, 'staff login')
        staffToken = res.json.accessToken
      })
      if (staffToken) {
        const other = branches.find((b) => b.id !== created.branch.id)
        await check('staff: GET /api/branches (list) -> 403', async () => expectStatus(await call('GET', '/api/branches', { token: staffToken }), 403, 'staff list'))
        await check('staff: GET own branch -> 200', async () => expectStatus(await call('GET', `/api/branches/${created.branch.id}`, { token: staffToken }), 200, 'staff own branch'))
        if (other) {
          await check('staff: GET another branch -> 403', async () => expectStatus(await call('GET', `/api/branches/${other.id}`, { token: staffToken }), 403, 'staff other branch'))
        }
        await check('staff: POST /api/branches -> 403', async () => expectStatus(await call('POST', '/api/branches', { token: staffToken, body: { code: 'NOPE', name: 'n', address: 'a' } }), 403, 'staff create branch'))
        await check('staff: GET /api/users -> 403', async () => expectStatus(await call('GET', '/api/users', { token: staffToken }), 403, 'staff users'))
        await check('staff: GET /api/ingredients and /api/units -> 200', async () => {
          expectStatus(await call('GET', '/api/ingredients', { token: staffToken }), 200, 'staff ingredients')
          expectStatus(await call('GET', '/api/units', { token: staffToken }), 200, 'staff units')
        })
      }

      console.log('\nCleanup (no DELETE endpoints, so records are deactivated)')
      await check('deactivate the test user', async () => expectStatus(await call('POST', `/api/users/${created.user.id}/deactivate`, { token }), 200, 'deactivate user'))
      if (staffToken) {
        await check('deactivated user\'s existing token stops working -> 401', async () => expectStatus(await call('GET', '/api/users/me', { token: staffToken }), 401, 'deactivated token'))
      }
    }
    await check('deactivate the test branch', async () => expectStatus(await call('POST', `/api/branches/${created.branch.id}/deactivate`, { token }), 200, 'deactivate branch'))
  }
  if (created.ingredient) {
    await check('deactivate the test ingredient', async () => expectStatus(await call('POST', `/api/ingredients/${created.ingredient.id}/deactivate`, { token }), 200, 'deactivate ingredient'))
  }
  console.log('\nLeft in the database (inactive): ' + [
    created.branch && `branch SMK-${tag}`,
    created.ingredient && `ingredient "SMOKE ingredient ${tag}"`,
    created.user && `user smoke.${tag.toLowerCase()}@example.test`,
  ].filter(Boolean).join(', '))
} else {
  console.log('\n(Write tests skipped. Re-run with --write to test create/update flows and role enforcement.)')
}

// ---------------------------------------------------------------- summary
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `, ${failed.length} FAILED` : ''}.\n`)
process.exit(failed.length ? 1 : 0)
