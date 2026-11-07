import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest as apiRequest } from '../functions/api/[[route]].js'
import { onRequest as accessMiddleware } from '../functions/_middleware.js'

const base = 'https://meualtar.date'

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

test('couple signup rejects invalid and reserved custom slugs', async () => {
  for (const slug of ['ab', 'painel', 'Nome do Casal', 'casal-']) {
    const { response } = await callApi('/api/auth/couple-signup', {
      method: 'POST',
      origin: base,
      body: { email: 'casal@example.com', password: 'a-strong-password-123', slug },
    })
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'invalid_signup_slug' })
  }
})

test('couple profile updates preserve the saved slug and store optional names as empty strings', async () => {
  const session = { id: 'session-1', account_id: 'couple-1', mfa_verified_at: null, expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'couple@example.com', status: 'active', mfa_enabled_at: null, is_superadmin: 0 }
  const updates = []
  const env = {
    DB: {
      prepare(query) {
        let values = []
        return {
          bind(...params) { values = params; return this },
          async first() {
            if (query.includes('FROM auth_sessions s')) return session
            if (query.includes('FROM wedding_memberships')) return { id: 'membership-1', role: 'couple_admin', wedding_status: 'draft' }
            if (query.includes('SELECT slug, site_published_at FROM weddings')) return { slug: 'custom-couple-name', site_published_at: null }
            return null
          },
          async run() { updates.push({ query, values }); return { meta: { changes: 1 } } },
        }
      },
    },
  }
  const request = new Request(`${base}/api/couple/weddings/wedding-1/profile`, {
    method: 'PATCH',
    headers: { Origin: base, 'Content-Type': 'application/json', Cookie: '__Host-wedding-session=session-token' },
    body: JSON.stringify({ partnerOneName: '', partnerTwoName: '', eventDate: null, eventTime: null }),
  })
  const response = await apiRequest({ request, env })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).wedding.slug, 'custom-couple-name')
  assert.equal(updates.length, 1)
  assert.equal(updates[0].values[0], '')
  assert.equal(updates[0].values[1], '')
  assert.equal(updates[0].values[4], 'custom-couple-name')
})

test('couple signup only reports an unavailable email when the account email is duplicated', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, action: 'account', hostname: new URL(base).hostname }), { status: 200 })
  const errors = [
    { message: 'UNIQUE constraint failed: accounts.email', status: 409, code: 'email_unavailable' },
    { message: 'UNIQUE constraint failed: weddings.slug', status: 409, code: 'wedding_slug_unavailable' },
    { message: 'no such table: weddings', status: 500, code: 'signup_unavailable' },
  ]
  try {
    for (const [index, expected] of errors.entries()) {
      const diagnosticWrites = []
      const env = {
        DB: {
          prepare(sql) {
            let args = []
            return { bind(...values) { args = values; return this }, async run() { diagnosticWrites.push({ sql, args }); return { success: true } } }
          },
          async batch() { throw new Error(expected.message) },
        },
        EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-only', EMAIL_FROM: 'test@example.test', TURNSTILE_SECRET_KEY: 'test-only',
      }
      const request = new Request(`${base}/api/auth/couple-signup`, {
        method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `casal${index}@example.test`, password: 'a-strong-password-123', turnstileToken: 'test-token' }),
      })
      const response = await apiRequest({ request, env })
      assert.equal(response.status, expected.status)
      assert.deepEqual(await response.json(), { error: expected.code })
      if (['email_unavailable', 'wedding_slug_unavailable'].includes(expected.code)) assert.equal(diagnosticWrites.length, 0)
      else {
        assert.equal(diagnosticWrites.length, 1)
        assert.equal(diagnosticWrites[0].args[1], expected.message.includes('no such table') ? 'missing_table' : 'unique_constraint')
        assert.equal(diagnosticWrites[0].args[2], expected.message)
        assert.equal(JSON.stringify(diagnosticWrites).includes(`casal${index}@example.test`), false)
      }
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('couple signup rejects an invalid optional event time', async () => {
  const { response } = await callApi('/api/auth/couple-signup', {
    method: 'POST',
    origin: base,
    body: { email: 'casal@example.com', password: 'a-strong-password-123', eventTime: '25:90' },
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_signup_event_time' })
})

test('couple signup identifies invalid password and event date separately', async () => {
  const shortPassword = await callApi('/api/auth/couple-signup', {
    method: 'POST', origin: base,
    body: { email: 'casal@example.com', password: 'short' },
  })
  const invalidDate = await callApi('/api/auth/couple-signup', {
    method: 'POST', origin: base,
    body: { email: 'casal@example.com', password: 'a-strong-password-123', eventDate: '2027-02-30' },
  })
  assert.equal(shortPassword.response.status, 400)
  assert.deepEqual(await shortPassword.response.json(), { error: 'invalid_signup_password' })
  assert.equal(invalidDate.response.status, 400)
  assert.deepEqual(await invalidDate.response.json(), { error: 'invalid_signup_event_date' })
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
  assert.deepEqual(await invalidDraft.response.json(), { error: 'invalid_signup_site_config' })
})

test('couple signup stores empty names when the optional names are omitted', async () => {
  const originalFetch = globalThis.fetch
  const inserted = []
  globalThis.fetch = async (url) => String(url).includes('siteverify')
    ? new Response(JSON.stringify({ success: true, action: 'account', hostname: new URL(base).hostname }), { status: 200 })
    : new Response(JSON.stringify({ id: 'email-test-id' }), { status: 200 })
  const env = {
    DB: {
      prepare(sql) {
        let args = []
        return {
          sql,
          get args() { return args },
          bind(...values) { args = values; return this },
          async first() { return null },
          async run() { return { success: true, meta: { changes: 1 } } },
        }
      },
      async batch(statements) { inserted.push(...statements.map(({ sql, args }) => ({ sql, args }))); return [] },
    },
    EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-only', EMAIL_FROM: 'test@example.test', TURNSTILE_SECRET_KEY: 'test-only',
  }
  try {
    const request = new Request(`${base}/api/auth/couple-signup`, {
      method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'casal@example.test', password: 'a-strong-password-123', slug: 'ana-e-joao', turnstileToken: 'test-token' }),
    })
    const response = await apiRequest({ request, env })
    assert.equal(response.status, 201)
    const weddingInsert = inserted.find(({ sql }) => sql.includes('INSERT INTO weddings'))
    assert.equal(weddingInsert.args[3], '')
    assert.equal(weddingInsert.args[4], '')
    assert.equal(weddingInsert.args[1], 'ana-e-joao')
  } finally {
    globalThis.fetch = originalFetch
  }
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

test('every response carries a restrictive content security policy and strict transport security', async () => {
  const response = await accessMiddleware({ request: new Request(`${base}/painel`), env: {}, next: async () => new Response('ok') })
  const policy = response.headers.get('Content-Security-Policy')
  assert.match(policy, /default-src 'self'/)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.doesNotMatch(policy, /unsafe-eval/)
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/)
  assert.match(response.headers.get('Strict-Transport-Security'), /max-age=31536000/)
  assert.equal(response.headers.get('Cross-Origin-Opener-Policy'), 'same-origin')
})

test('the QA preview can open only the superadmin screen while its API stays protected', async () => {
  const preview = 'https://abc123.tudocomecoudeumsim.pages.dev'
  let nextCalled = false
  const page = await accessMiddleware({ request: new Request(`${preview}/superadmin?teste-local=1`), env: {}, next: async () => { nextCalled = true; return new Response('demo') } })
  assert.equal(page.status, 200)
  assert.equal(nextCalled, true)
  for (const url of [`${preview}/superadmin`, `${preview}/api/superadmin/overview?teste-local=1`, `${base}/superadmin?teste-local=1`]) {
    const response = await accessMiddleware({ request: new Request(url), env: {}, next: async () => new Response('unexpected') })
    assert.equal(response.status, 403)
  }
})

test('the retired legal draft route returns a private 404 for path variants', async () => {
  for (const path of ['/documentos-legais/rascunho', '/documentos-legais/rascunho/', '/documentos-legais/rascunho/?origem=convite']) {
    let nextCalled = false
    const response = await accessMiddleware({
      request: new Request(`https://meualtar.date${path}`),
      env: {},
      next: async () => { nextCalled = true; return new Response('draft') },
    })
    assert.equal(response.status, 404, path)
    assert.equal(response.headers.get('Cache-Control'), 'no-store', path)
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow', path)
    assert.equal(nextCalled, false, path)
    assert.equal(await response.text(), 'Página não encontrada')
  }
})
