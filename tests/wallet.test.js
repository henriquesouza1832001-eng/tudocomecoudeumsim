import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const token = 'a'.repeat(43)
const events = [
  { id: 'event-public', name: 'Cerimônia', group_ids: [], starts_at: '2027-05-10T16:00:00-03:00', venue_name: 'Jardim' },
  { id: 'event-private', name: 'Ensaio reservado', group_ids: ['another-group'], starts_at: null, venue_name: 'Salão' },
]

function database(onGuestLookup = () => {}) {
  return {
    prepare(query) {
      let values = []
      return {
        bind(...args) { values = args; return this },
        async first() {
          if (query.includes('FROM guests g JOIN weddings w')) {
            onGuestLookup(values[0])
            return {
            id: 'guest-1', wedding_id: 'wedding-1', group_id: 'family', name: 'Convidada', party_size: 2, guest_type: 'guest',
            partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', event_time: '16:00', timezone: 'America/Sao_Paulo',
            wedding_status: 'active', published_events_json: JSON.stringify(events),
          }
          }
          if (query.includes('SELECT published_events_json FROM weddings')) return { published_events_json: JSON.stringify(events) }
          return null
        },
        async all() { return { results: [] } },
        async run() { return { meta: { changes: 1 } } },
        values,
      }
    },
  }
}

async function call(path, { authorization = `Bearer ${token}`, env = {}, method = 'POST', onGuestLookup } = {}) {
  const headers = new Headers({ Origin: origin })
  if (authorization) headers.set('Authorization', authorization)
  const response = await onRequest({ request: new Request(`${origin}${path}`, { method, headers }), env: { DB: database(onGuestLookup), ...env } })
  return response
}

test('wallet issue routes require the individual invitation credential', async () => {
  const response = await call('/api/invitation/wallet/google', { authorization: '' })
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'invitation_invalid' })
})

test('Google Wallet link is signed and contains only events authorized for this guest', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const env = {
    GOOGLE_WALLET_ISSUER_ID: '1234567890',
    GOOGLE_WALLET_CLASS_ID: '1234567890.wedding_invitation',
    GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: 'wallet@example.iam.gserviceaccount.com',
    GOOGLE_WALLET_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  }
  const response = await call('/api/invitation/wallet/google', { env })
  assert.equal(response.status, 200)
  const { url } = await response.json()
  assert.ok(url.startsWith('https://pay.google.com/gp/v/save/'))
  const jwt = url.split('/').at(-1)
  const [headerPart, payloadPart, signaturePart] = jwt.split('.')
  const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString())
  const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString())
  assert.equal(header.alg, 'RS256')
  assert.equal(verify('RSA-SHA256', Buffer.from(`${headerPart}.${payloadPart}`), publicKey, Buffer.from(signaturePart, 'base64url')), true)
  assert.equal(payload.payload.genericObjects[0].barcode.value, token)
  assert.equal(payload.payload.genericObjects[0].classId, env.GOOGLE_WALLET_CLASS_ID)
  assert.match(payload.payload.genericObjects[0].textModulesData[1].body, /Cerimônia/)
  assert.doesNotMatch(payload.payload.genericObjects[0].textModulesData[1].body, /Ensaio reservado/)
})

test('Apple Wallet is not issued until signing certificates are configured', async () => {
  const response = await call('/api/invitation/wallet/apple')
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'wallet_not_configured' })
})

test('Apple Wallet signing failures do not leak credentials or pass details', async () => {
  const response = await call('/api/invitation/wallet/apple', {
    env: {
      APPLE_WALLET_PASS_TYPE_IDENTIFIER: 'pass.com.example.invitation',
      APPLE_WALLET_TEAM_IDENTIFIER: 'TEAM123456',
      APPLE_WALLET_SIGNER_CERTIFICATE: 'invalid',
      APPLE_WALLET_PRIVATE_KEY_PKCS8: 'invalid',
      APPLE_WALLET_WWDR_CERTIFICATE: 'invalid',
    },
  })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'wallet_unavailable' })
})

test('wallet issuance rejects invalid invitation tokens before database lookup', async () => {
  const response = await call('/api/invitation/wallet/google', { authorization: 'Bearer short' })
  assert.equal(response.status, 401)
})

test('individual invitation credentials are hashed before querying the guest', async () => {
  const expected = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  let actual
  const response = await call('/api/invitation/wallet/apple', { onGuestLookup(value) { actual = value } })
  assert.equal(response.status, 503)
  assert.equal(actual, Buffer.from(expected).toString('base64url'))
})
