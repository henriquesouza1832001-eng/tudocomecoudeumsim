import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const eventId = '11111111-1111-4111-8111-111111111111'
const mediaId = '22222222-2222-4222-8222-222222222222'
const siteConfig = {
  theme: 'garden',
  paletteIndex: 0,
  coverLayout: 'full',
  coverImage: 'none',
  coverPhotoId: mediaId,
  coverCarouselEnabled: false,
  coverGallery: [],
  siteGallery: [],
  fontScale: 'medium',
  enabledSections: ['Eventos', 'Confirmação de presença'],
  animationPreset: 'Elegante',
  fontPair: 'Clássico editorial',
  language: 'pt-BR',
  coverMessages: { 'pt-BR': 'Convite', en: 'Invitation', es: 'Invitación' },
  storyMessages: { 'pt-BR': '', en: '', es: '' },
  sectionContent: {},
  weddingDetails: { schedule: '', menu: '', dressCode: '' },
  guestCamera: { enabled: false, photoLimit: 200 },
  pix: { enabled: false, key: '', holderName: '' },
}
const wedding = {
  id: 'wedding-1',
  slug: 'ana-e-bia',
  partner_one_name: 'Ana',
  partner_two_name: 'Bia',
  event_date: '2027-09-18',
  event_time: '16:00',
  timezone: 'America/Sao_Paulo',
  published_site_config_json: JSON.stringify(siteConfig),
  published_events_json: JSON.stringify([
    { id: eventId, name: 'Cerimônia', event_type: 'ceremony', group_ids: [] },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Ensaio', event_type: 'rehearsal', group_ids: ['group-1'] },
  ]),
  site_published_at: '2026-10-18T12:00:00.000Z',
}

function database({ publishedWedding = wedding, batches = [] } = {}) {
  return {
    prepare(query) {
      let values = []
      return {
        bind(...args) { values = args; return this },
        async first() {
          if (query.includes('FROM weddings WHERE slug = ?')) return publishedWedding?.site_published_at ? publishedWedding : null
          if (query.includes('FROM wedding_guest_policies')) return { companions_allowed: 1, max_companions: 2 }
          if (query.includes('FROM guest_rsvp_requests WHERE wedding_id = ? AND idempotency_hash')) return null
          if (query.includes('INSERT INTO public_wedding_request_limits')) return { request_count: 1, blocked_until: null }
          return null
        },
        async all() { return { results: [] } },
        async run() { return { meta: { changes: 1 } } },
        query,
        values,
      }
    },
    async batch(statements) {
      batches.push(statements)
      return statements.map(() => ({ meta: { changes: 1 } }))
    },
  }
}

async function call(path, { method = 'GET', body, publishedWedding, env = {}, headers = {} } = {}) {
  const requestHeaders = new Headers({ ...headers })
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (method !== 'GET') requestHeaders.set('Origin', origin)
  const request = new Request(`${origin}${path}`, { method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body) })
  const batches = []
  const db = database({ publishedWedding, batches })
  const response = await onRequest({ request, env: { DB: db, ...env } })
  return { response, batches }
}

test('public invitation shares only published events available to every guest', async () => {
  const { response } = await call('/api/public/weddings/ana-e-bia')
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.wedding.slug, 'ana-e-bia')
  assert.deepEqual(body.events.map((item) => item.id), [eventId])
  assert.equal(body.siteConfig.enabledSections.includes('Confirmação de presença'), true)
})

test('public invitation is unavailable before the wedding site is published', async () => {
  const { response } = await call('/api/public/weddings/ana-e-bia', { publishedWedding: { ...wedding, site_published_at: null } })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'published_site_not_found' })
})

test('public media endpoint never reads a file that is not referenced by the published invitation', async () => {
  let objectReads = 0
  const { response } = await call(`/api/public/weddings/ana-e-bia/media/44444444-4444-4444-8444-444444444444`, {
    env: { GUEST_PHOTOS: { async get() { objectReads += 1; return null } } },
  })
  assert.equal(response.status, 404)
  assert.equal(objectReads, 0)
})

test('general RSVP rejects an invalid event before creating a request', async () => {
  const { response, batches } = await call('/api/public/weddings/ana-e-bia/rsvp', {
    method: 'POST',
    body: { eventId: '55555555-5555-4555-8555-555555555555', name: 'Pessoa', email: 'pessoa@example.com', attendanceStatus: 'confirmed', idempotencyKey: 'a'.repeat(36), requestToken: 'b'.repeat(43), turnstileToken: 'test-token' },
  })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'event_not_available' })
  assert.equal(batches.length, 0)
})

test('general RSVP fails closed when Turnstile is not configured', async () => {
  const { response, batches } = await call('/api/public/weddings/ana-e-bia/rsvp', {
    method: 'POST',
    body: { eventId, name: 'Pessoa', email: 'pessoa@example.com', attendanceStatus: 'confirmed', idempotencyKey: 'a'.repeat(36), requestToken: 'b'.repeat(43), turnstileToken: 'test-token' },
  })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'turnstile_unavailable' })
  assert.equal(batches.length, 0)
})

test('request status lookup rejects malformed bearer tokens without querying D1', async () => {
  const { response } = await call('/api/public/attendance-requests/lookup', { method: 'POST', body: { requestToken: 'short' } })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_request_token' })
})

test('individual companion management requires a valid invitation token', async () => {
  const { response } = await call('/api/invitation/companions')
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { error: 'companion_management_unavailable' })
})

test('guest approval and event authorization APIs require a couple session', async () => {
  const policy = await call('/api/couple/weddings/wedding-1/guest-policy')
  const authorization = await call('/api/couple/weddings/wedding-1/guest-authorizations', { method: 'PUT', body: { guestId: '44444444-4444-4444-8444-444444444444', eventId, status: 'revoked' } })
  assert.equal(policy.response.status, 401)
  assert.equal(authorization.response.status, 401)
})

test('event check-in API requires an authenticated team member', async () => {
  const { response } = await call('/api/staff/events/event-1/scan', { method: 'POST', body: { token: 'a'.repeat(43) } })
  assert.equal(response.status, 401)
})
