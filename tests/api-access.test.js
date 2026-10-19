import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest as apiRequest } from '../functions/api/[[route]].js'
import { onRequest as accessMiddleware } from '../functions/_middleware.js'

const base = 'https://tudocomecoudeumsim.pages.dev'

function database() {
  return {
    prepared: 0,
    prepare() {
      this.prepared += 1
      return {
        bind() {
          return this
        },
        async first() {
          return null
        },
        async all() {
          return { results: [] }
        },
        async run() {
          return { meta: { changes: 0 } }
        },
      }
    },
  }
}

async function callApi(path, { method = 'GET', origin, body, headers = {} } = {}) {
  const env = { DB: database() }
  const requestHeaders = new Headers(headers)
  if (origin) requestHeaders.set('Origin', origin)
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  const request = new Request(`${base}${path}`, { method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body) })
  const response = await apiRequest({ request, env })
  return { response, env }
}

test('mutations without a same-origin header stop before reaching storage', async () => {
  const { response, env } = await callApi('/api/couple/weddings/wedding-1/guests', { method: 'POST', body: {} })
  assert.equal(response.status, 403)
  assert.equal(env.DB.prepared, 0)
})

test('couple and event staff mutations require an authenticated session', async () => {
  const couple = await callApi('/api/couple/weddings/wedding-1/guests', { method: 'POST', origin: base, body: {} })
  const eventDelete = await callApi('/api/couple/weddings/wedding-1/events/event-1', { method: 'DELETE', origin: base })
  const staff = await callApi('/api/staff/events/event-1/checkins', { method: 'POST', origin: base, body: {} })
  assert.equal(couple.response.status, 401)
  assert.equal(eventDelete.response.status, 401)
  assert.equal(staff.response.status, 401)
})

test('authenticated couple sessions can be used without an MFA timestamp', async () => {
  const session = { id: 'session-1', account_id: 'couple-1', mfa_verified_at: null, expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'couple@example.com', status: 'active', mfa_enabled_at: null, is_superadmin: 0 }
  const env = {
    DB: {
      prepare(query) {
        return {
          bind() { return this },
          async first() { return query.includes('FROM auth_sessions s') ? session : null },
          async all() { return { results: [] } },
        }
      },
    },
  }
  const request = new Request(`${base}/api/auth/session`, { headers: { Cookie: '__Host-wedding-session=session-token' } })
  const response = await apiRequest({ request, env })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.mfaVerified, true)
  assert.equal(body.mfaSetupRequired, false)
})

test('superadmin sessions without TOTP remain blocked from product operations', async () => {
  const session = { id: 'session-1', account_id: 'admin-1', mfa_verified_at: null, expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'admin@example.com', status: 'active', mfa_enabled_at: null, is_superadmin: 1 }
  const env = {
    DB: {
      prepare(query) {
        return {
          bind() { return this },
          async first() { return query.includes('FROM auth_sessions s') ? session : null },
          async all() { return { results: [] } },
        }
      },
    },
  }
  const request = new Request(`${base}/api/couple/weddings/wedding-1/guests`, { headers: { Cookie: '__Host-wedding-session=session-token' } })
  const response = await apiRequest({ request, env })
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { error: 'mfa_setup_required' })
})

test('legacy contribution and fee APIs are unavailable in the direct-payment pilot', async () => {
  const contributions = await callApi('/api/couple/weddings/wedding-1/contributions')
  const fees = await callApi('/api/superadmin/fee-policy')
  assert.equal(contributions.response.status, 404)
  assert.equal(fees.response.status, 404)
})

test('couple signup accepts account details without invitation names or a slug', async () => {
  const { response } = await callApi('/api/auth/couple-signup', {
    method: 'POST',
    origin: base,
    body: { email: 'casal@example.com', password: 'a-strong-password-123', eventDate: '2027-09-18', eventTime: '16:30' },
  })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'email_service_unconfigured' })
})

test('couple signup rejects an invalid optional event time', async () => {
  const { response } = await callApi('/api/auth/couple-signup', {
    method: 'POST',
    origin: base,
    body: { email: 'casal@example.com', password: 'a-strong-password-123', eventTime: '25:90' },
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_signup' })
})

test('couple signup accepts a partial draft profile and rejects an invalid saved site draft', async () => {
  const incompleteProfile = await callApi('/api/auth/couple-signup', {
    method: 'POST',
    origin: base,
    body: { email: 'casal@example.com', password: 'a-strong-password-123', partnerOneName: 'Ana' },
  })
  const invalidDraft = await callApi('/api/auth/couple-signup', {
    method: 'POST',
    origin: base,
    body: { email: 'casal@example.com', password: 'a-strong-password-123', siteConfig: { theme: 'untrusted' } },
  })
  assert.equal(incompleteProfile.response.status, 503)
  assert.deepEqual(await incompleteProfile.response.json(), { error: 'email_service_unconfigured' })
  assert.equal(invalidDraft.response.status, 400)
  assert.deepEqual(await invalidDraft.response.json(), { error: 'invalid_signup' })
})

test('guest and godparent endpoints reject requests without an individual invitation', async () => {
  const guest = await callApi('/api/invitation')
  const godparent = await callApi('/api/godparent/tasks')
  assert.equal(guest.response.status, 401)
  assert.equal(godparent.response.status, 403)
})

test('the Pages Access middleware fails closed on superadmin routes', async () => {
  for (const path of ['/superadmin', '/api/superadmin/overview']) {
    let nextCalled = false
    const response = await accessMiddleware({
      request: new Request(`${base}${path}`),
      env: {},
      next: async () => {
        nextCalled = true
        return new Response('ok')
      },
    })
    assert.equal(response.status, 403)
    assert.equal(nextCalled, false)
  }
})

test('the Pages Access middleware does not block public routes', async () => {
  const response = await accessMiddleware({
    request: new Request(`${base}/painel`),
    env: {},
    next: async () => new Response('ok'),
  })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY')
})
