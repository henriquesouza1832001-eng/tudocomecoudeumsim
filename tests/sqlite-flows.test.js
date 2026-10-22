import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { onRequest } from '../functions/api/[[route]].js'

function database() {
  const sqlite = new DatabaseSync(':memory:')
  const directory = new URL('../migrations/', import.meta.url)
  for (const name of readdirSync(directory).filter(name => name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(name, directory), 'utf8'))
  const DB = {
    prepare(sql) {
      const statement = sqlite.prepare(sql)
      let args = []
      return {
        bind(...values) { args = values; return this },
        async first(column) { const row = statement.get(...args); return column ? row?.[column] ?? null : row ?? null },
        async all() { return { results: statement.all(...args), success: true } },
        async run() { const result = statement.run(...args); return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } } },
      }
    },
    async batch(statements) {
      sqlite.exec('BEGIN')
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results }
      catch (error) { sqlite.exec('ROLLBACK'); throw error }
    },
  }
  for (const [account, role] of [['couple', 'couple_admin'], ['entry', 'checkin_staff'], ['staff', 'event_staff'], ['reader', 'reader'], ['other', 'couple_admin']]) {
    sqlite.prepare("INSERT INTO accounts (id,email,password_hash,status,email_verified_at) VALUES (?,?,?,'active',CURRENT_TIMESTAMP)").run(account, `${account}@example.test`, 'test-only')
    sqlite.prepare('INSERT INTO auth_sessions (id,account_id,token_hash,expires_at) VALUES (?,?,?,?)').run(account, account, createHash('sha256').update(`${account}-session`).digest('base64url'), new Date(Date.now() + 3600000).toISOString())
    if (account === 'couple' || account === 'other') sqlite.prepare("INSERT INTO weddings (id,slug,owner_account_id,status,partner_one_name,partner_two_name) VALUES (?,?,?,'active','Ana','Caio')").run(account === 'couple' ? 'wedding-1' : 'wedding-2', `${account}-wedding`, account)
    sqlite.prepare('INSERT INTO wedding_memberships (id,wedding_id,account_id,role) VALUES (?,?,?,?)').run(account, account === 'other' ? 'wedding-2' : 'wedding-1', account, role)
  }
  return { DB, sqlite }
}

test('migrated SQLite persists couple, invitation, expense and event staff operations with wedding isolation', async t => {
  const { DB, sqlite } = database()
  t.after(() => sqlite.close())
  const origin = 'https://wedding.example'
  async function call(path, { method = 'GET', body, account = 'couple', token } = {}) {
    const response = await onRequest({ request: new Request(`${origin}${path}`, { method, headers: { Origin: origin, Cookie: `__Host-wedding-session=${account}-session`, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined }), env: { DB, GUEST_CREDENTIALS_ENCRYPTION_KEY: 'local-test-only-credential-encryption-key' } })
    const result = await response.json()
    assert.notEqual(response.status, 500, `${method} ${path}: ${JSON.stringify(result)}`)
    return { status: response.status, result }
  }
  const base = '/api/couple/weddings/wedding-1'
  for (const resource of ['site-config', 'published', 'groups', 'events', 'members', 'event-assignments', 'godparent-tasks', 'guests', 'wall-messages', 'rsvps', 'guest-policy', 'attendance-requests', 'guest-authorizations', 'expenses', 'gifts', 'photos']) {
    await t.test(`authenticated ${resource} query runs against migrated SQL`, async () => {
      const response = await call(`${base}/${resource}`)
      assert.equal(response.status, resource === 'published' ? 404 : 200, JSON.stringify(response.result))
      assert.equal((await call(`${base}/${resource}`, { account: 'other' })).status, 404)
    })
  }
  const event = await call(`${base}/events`, { method: 'POST', body: { name: 'Cerimônia', eventType: 'ceremony', startsAt: '2027-10-15T16:00', venueName: 'Jardim', address: 'Rua do Jardim, 20', groupIds: [] } })
  assert.equal(event.status, 201, JSON.stringify(event.result))
  const eventId = event.result.id
  const created = await call(`${base}/guests`, { method: 'POST', body: { name: 'Marina', partySize: 1, guestType: 'godparent' } })
  assert.equal(created.status, 201, JSON.stringify(created.result))
  const guestId = created.result.guest.id
  const token = created.result.accessToken
  assert.notEqual(sqlite.prepare('SELECT access_token_hash FROM guests WHERE id=?').get(guestId).access_token_hash, token)
  const rsvp = await call(`${base}/rsvps`, { method: 'POST', body: { guestId, eventId, status: 'confirmed', partySize: 1 } })
  assert.equal(rsvp.status, 201, JSON.stringify(rsvp.result))
  for (const member of ['entry', 'staff']) sqlite.prepare('INSERT INTO membership_event_access (membership_id,event_id) VALUES (?,?)').run(member,eventId)
  const roster = await call(`/api/staff/events/${eventId}/guests`, { account: 'staff' })
  assert.equal(roster.status, 200)
  assert.equal(roster.result.guests.length, 1)
  assert.equal('email' in roster.result.guests[0], false)
  assert.equal((await call(`/api/staff/events/${eventId}/scan`, { account: 'staff', method: 'POST', body: { token } })).status, 404)
  assert.equal((await call(`/api/staff/events/${eventId}/scan`, { account: 'entry', method: 'POST', body: { token } })).status, 201)
  assert.equal((await call(`/api/staff/events/${eventId}/scan`, { account: 'entry', method: 'POST', body: { token } })).status, 409)
  const expense = await call(`${base}/expenses`, { method: 'POST', body: { supplierName: 'Flores', totalAmountCents: 20000, dueDate: '2027-10-01', reminderEnabled: true } })
  assert.equal(expense.status, 201, JSON.stringify(expense.result))
  const paymentPath = `${base}/expenses/${expense.result.id}/payments`
  assert.equal((await call(paymentPath, { method: 'POST', body: { amountCents: 15000, paidAt: '2027-09-01' } })).status, 201)
  assert.equal((await call(paymentPath, { method: 'POST', body: { amountCents: 10000, paidAt: '2027-09-02' } })).status, 409)
  assert.equal(sqlite.prepare('SELECT SUM(amount_cents) AS total FROM wedding_expense_payments').get().total, 15000)
  const gift = await call(`${base}/gifts`, { method: 'POST', body: { title: 'Jogo de pratos', giftType: 'custom', fulfillmentType: 'store_link', storeUrl: 'https://example.com/pratos' } })
  assert.equal(gift.status, 201)
  assert.equal((await call(`${base}/gifts`)).result.gifts[0].store_url, 'https://example.com/pratos')
  for (const storeUrl of ['https://localhost/item', 'https://127.0.0.1/item', 'https://192.168.1.1/item', 'https://[::1]/item', 'https://printer.local/item', 'https://user:password@example.com/item', 'javascript:alert(1)']) {
    const invalidGift = await call(`${base}/gifts`, { method: 'POST', body: { title: 'Pratos', giftType: 'custom', fulfillmentType: 'store_link', storeUrl } })
    assert.equal(invalidGift.status, 400, storeUrl)
    assert.equal(invalidGift.result.error, 'invalid_store_url')
    assert.equal((await call(`${base}/gifts/${gift.result.gift.id}`, { method: 'PATCH', body: { title: 'Pratos', giftType: 'custom', fulfillmentType: 'store_link', storeUrl, status: 'active' } })).status, 400)
  }
  const config = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Eventos'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR' }
  const savedDraft = await call(`${base}/site-config`, { method: 'PUT', body: config })
  assert.equal(savedDraft.status, 200, JSON.stringify(savedDraft.result))
  const publication = await call(`${base}/site-config/publish`, { method: 'POST', body: {} })
  assert.equal(publication.status, 200, JSON.stringify(publication.result))
  const invitation = await call('/api/invitation', { token })
  assert.equal(invitation.status, 200)
  assert.equal(invitation.result.guest.name, 'Marina')
  assert.deepEqual(invitation.result.wallets, { apple: false, google: false })
  assert.equal((await call('/api/godparent/tasks', { token })).status, 200)
  assert.equal((await call('/api/public/weddings/couple-wedding')).status, 200)
  assert.equal((await call(`${base}/published`, { account: 'reader' })).status, 200)
  assert.equal(sqlite.prepare('PRAGMA foreign_key_check').all().length, 0)
})
