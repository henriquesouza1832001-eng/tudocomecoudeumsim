import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const eventId = '11111111-1111-4111-8111-111111111111'
const mediaId = '22222222-2222-4222-8222-222222222222'
const siteConfig = {
  theme: 'garden',
  paletteIndex: 0,
  customAccent: '#be6f52',
  coverLayout: 'full',
  coverImagePosition: 'top',
  coverImagePositionDesktop: 'right',
  coverImagePositionMobile: 'bottom',
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

function database({ publishedWedding = wedding, batches = [], first = () => undefined, all = () => ({ results: [] }) } = {}) {
  return {
    prepare(query) {
      let values = []
      return {
        bind(...args) { values = args; this.values = values; return this },
        async first() {
          const result = await first(query, values)
          if (result !== undefined) return result
          if (query.includes('FROM weddings WHERE slug = ?')) return publishedWedding?.site_published_at ? publishedWedding : null
          if (query.includes('FROM wedding_guest_policies')) return { companions_allowed: 1, max_companions: 2 }
          if (query.includes('FROM guest_rsvp_requests WHERE wedding_id = ? AND idempotency_hash')) return null
          if (query.includes('INSERT INTO public_wedding_request_limits')) return { request_count: 1, blocked_until: null }
          return null
        },
        async all() { return all(query, values) },
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

async function call(path, { method = 'GET', body, publishedWedding, env = {}, headers = {}, first, all } = {}) {
  const requestHeaders = new Headers({ ...headers })
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (method !== 'GET') requestHeaders.set('Origin', origin)
  const request = new Request(`${origin}${path}`, { method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body) })
  const batches = []
  const db = database({ publishedWedding, batches, first, all })
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
  assert.equal(body.siteConfig.customAccent, '#be6f52')
  assert.equal(body.siteConfig.coverImagePositionDesktop, 'right')
  assert.equal(body.siteConfig.coverImagePositionMobile, 'bottom')
})

test('public invitation migrates the legacy cover framing into both device settings', async () => {
  const legacyConfig = { ...siteConfig, coverImagePosition: 'left' }
  delete legacyConfig.coverImagePositionDesktop
  delete legacyConfig.coverImagePositionMobile
  const { response } = await call('/api/public/weddings/ana-e-bia', { publishedWedding: { ...wedding, published_site_config_json: JSON.stringify(legacyConfig) } })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.siteConfig.coverImagePosition, 'left')
  assert.equal(body.siteConfig.coverImagePositionDesktop, 'left')
  assert.equal(body.siteConfig.coverImagePositionMobile, 'left')
})

test('public invitation is unavailable before the wedding site is published', async () => {
  const { response } = await call('/api/public/weddings/ana-e-bia', { publishedWedding: { ...wedding, site_published_at: null } })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'published_site_not_found' })
})

test('published invitation preserves the event name and venue details', async () => {
  const eventName = 'CASAMENTO MELODY E PEDRO'
  const address = 'Av. Exemplo, 500, Belo Horizonte - MG'
  const configuredWedding = { ...wedding, published_events_json: JSON.stringify([{ id: eventId, name: eventName, event_type: 'ceremony', starts_at: '2027-11-28T19:00:00.000Z', venue_name: 'Colonial Pampulha', address, group_ids: [] }]) }
  const { response } = await call('/api/public/weddings/ana-e-bia', { publishedWedding: configuredWedding })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.events[0].name, eventName)
  assert.equal(body.events[0].venue_name, 'Colonial Pampulha')
  assert.equal(body.events[0].address, address)
})

test('published invitation shows only the catalog entries allowed by its gift and Pix settings', async () => {
  const pixGift = { id: 'gift-pix', gift_type: 'fixed', fulfillment_type: 'pix_direct', title: 'Jantar', description: '', amount_cents: 12000, goal_cents: null }
  const storeGift = { id: 'gift-store', gift_type: 'fixed', fulfillment_type: 'store_link', store_url: 'https://shop.example/item', title: 'Vaso', description: '', amount_cents: 8000, goal_cents: null }
  const config = { ...siteConfig, giftDisplayMode: 'page', pixDisplayMode: 'hidden', pix: { enabled: true, key: 'chave-privada', holderName: 'Noivos' } }
  const configuredWedding = { ...wedding, published_site_config_json: JSON.stringify(config) }
  const { response } = await call('/api/public/weddings/ana-e-bia', {
    publishedWedding: configuredWedding,
    all(query, values) { return query.includes('FROM gifts') ? { results: values[1] ? [pixGift, storeGift] : [storeGift] } : { results: [] } },
  })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(body.gifts.map((gift) => gift.id), ['gift-store'])
  assert.equal(body.gifts[0].store_url, 'https://shop.example/item')
  assert.deepEqual(body.siteConfig.pix, { enabled: false, key: '', holderName: '' })
})

test('published invitation does not query or expose gifts when their display mode is hidden', async () => {
  let giftsQueried = false
  const configuredWedding = { ...wedding, published_site_config_json: JSON.stringify({ ...siteConfig, giftDisplayMode: 'hidden', pixDisplayMode: 'hidden', pix: { enabled: true, key: 'chave-privada' } }) }
  const { response } = await call('/api/public/weddings/ana-e-bia', {
    publishedWedding: configuredWedding,
    all(query) { if (query.includes('FROM gifts')) giftsQueried = true; return { results: [] } },
  })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(body.gifts, [])
  assert.deepEqual(body.siteConfig.pix, { enabled: false, key: '', holderName: '' })
  assert.equal(giftsQueried, false)
})

test('public media endpoint never reads a file that is not referenced by the published invitation', async () => {
  let objectReads = 0
  const { response } = await call(`/api/public/weddings/ana-e-bia/media/44444444-4444-4444-8444-444444444444`, {
    env: { GUEST_PHOTOS: { async get() { objectReads += 1; return null } } },
  })
  assert.equal(response.status, 404)
  assert.equal(objectReads, 0)
})

test('public media endpoint serves photos selected for the invitation carousel', async () => {
  const carouselPhotoId = '55555555-5555-4555-8555-555555555555'
  const publishedWedding = {
    ...wedding,
    published_site_config_json: JSON.stringify({ ...siteConfig, siteCarouselEnabled: true, siteCarouselPhotos: [carouselPhotoId] }),
  }
  const objectReads = []
  const { response } = await call(`/api/public/weddings/ana-e-bia/media/${carouselPhotoId}`, {
    publishedWedding,
    env: { GUEST_PHOTOS: { async get(key) { objectReads.push(key); return key.endsWith('.jpg') ? { body: new Uint8Array([1]), httpMetadata: { contentType: 'image/jpeg' } } : null } } },
  })
  assert.equal(response.status, 200)
  assert.deepEqual(objectReads, [`wedding-1/site/${carouselPhotoId}.jpg`])
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

test('public RSVP confirms the principal, issues a recoverable individual QR, and leaves companions pending', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, action: 'rsvp', hostname: 'tudocomecoudeumsim.pages.dev' }), { status: 200 })
  try {
    const { response, batches } = await call('/api/public/weddings/ana-e-bia/rsvp', {
      method: 'POST',
      body: {
        eventId,
        name: 'Pessoa convidada',
        email: 'pessoa@example.com',
        attendanceStatus: 'confirmed',
        companions: [{ name: 'Acompanhante' }],
        idempotencyKey: 'a'.repeat(36),
        requestToken: 'b'.repeat(43),
        turnstileToken: 'test-token',
      },
      env: { TURNSTILE_SECRET_KEY: 'test-secret', GUEST_CREDENTIALS_ENCRYPTION_KEY: 'test-key-with-at-least-thirty-two-characters' },
    })
    const body = await response.json()
    assert.equal(response.status, 201)
    assert.equal(body.reviewStatus, 'approved')
    assert.equal(body.emailSent, false)
    assert.equal(body.credential.name, 'Pessoa convidada')
    assert.match(body.credential.accessUrl, /#convite\/[A-Za-z0-9_-]{40,60}$/)
    assert.equal(batches.length, 1)
    const statements = batches[0]
    const guestInsert = statements.find((statement) => statement.query.includes('INSERT INTO guests'))
    const requestInsert = statements.find((statement) => statement.query.includes('INSERT INTO guest_rsvp_requests'))
    const companionInsert = statements.find((statement) => statement.query.includes('INSERT INTO guest_companion_requests'))
    assert.ok(guestInsert)
    assert.ok(requestInsert)
    assert.ok(companionInsert)
    assert.ok(guestInsert.values.includes('confirmed'))
    assert.ok(guestInsert.values.some((value) => typeof value === 'string' && value.length > 40))
    assert.equal(statements.indexOf(guestInsert) < statements.indexOf(requestInsert), true)
    assert.equal(companionInsert.query.includes('status'), false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('private RSVP recovery returns the same principal QR without exposing companion credentials', async () => {
  const accessToken = 'c'.repeat(43)
  const secret = 'test-key-with-at-least-thirty-two-characters'
  const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(accessToken)))
  const encode = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  const { response, batches } = await call('/api/public/attendance-requests/credentials', {
    method: 'POST',
    body: { requestToken: 'b'.repeat(43) },
    env: { GUEST_CREDENTIALS_ENCRYPTION_KEY: secret },
    first(query) {
      if (query.includes('FROM guest_rsvp_requests WHERE request_token_hash')) return { id: 'request-1', wedding_id: 'wedding-1', event_id: eventId, guest_id: 'guest-1', attendance_status: 'confirmed', review_status: 'approved' }
      if (query.includes('INSERT INTO public_wedding_request_limits')) return { request_count: 1, blocked_until: null }
      if (query.includes('FROM guests g JOIN guest_rsvps')) return { id: 'guest-1', name: 'Pessoa', access_token_ciphertext: encode(ciphertext), access_token_iv: encode(iv) }
      return undefined
    },
  })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(body.credentials.map((credential) => credential.accessUrl), [`${origin}/convidado#convite/${accessToken}`])
  assert.equal(body.credentials.some((credential) => credential.companionRequestId), false)
  assert.equal(batches.length, 0)
})

test('private RSVP recovery includes only approved and authorized companion QR credentials', async () => {
  const secret = 'test-key-with-at-least-thirty-two-characters'
  const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const encode = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  async function encryptedToken(token) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token)))
    return { access_token_ciphertext: encode(ciphertext), access_token_iv: encode(iv) }
  }
  const principal = { id: 'guest-1', name: 'Pessoa', ...await encryptedToken('c'.repeat(43)) }
  const companion = { id: 'guest-2', name: 'Acompanhante', companion_request_id: 'companion-1', ...await encryptedToken('d'.repeat(43)) }
  const { response } = await call('/api/public/attendance-requests/credentials', {
    method: 'POST',
    body: { requestToken: 'b'.repeat(43) },
    env: { GUEST_CREDENTIALS_ENCRYPTION_KEY: secret },
    first(query) {
      if (query.includes('FROM guest_rsvp_requests WHERE request_token_hash')) return { id: 'request-1', wedding_id: 'wedding-1', event_id: eventId, guest_id: 'guest-1', attendance_status: 'confirmed', review_status: 'approved' }
      if (query.includes('INSERT INTO public_wedding_request_limits')) return { request_count: 1, blocked_until: null }
      if (query.includes('FROM guests g JOIN guest_rsvps')) return principal
      return undefined
    },
    all(query) {
      if (query.includes('FROM guest_companion_requests c')) return { results: [companion] }
      return { results: [] }
    },
  })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(body.credentials.map(({ guestId, name, companionRequestId }) => ({ guestId, name, companionRequestId })), [
    { guestId: 'guest-1', name: 'Pessoa', companionRequestId: undefined },
    { guestId: 'guest-2', name: 'Acompanhante', companionRequestId: 'companion-1' },
  ])
  assert.match(body.credentials[1].accessUrl, /#convite\/d{43}$/)
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
