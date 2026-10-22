import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { installDevelopmentAccessSimulator } from '../src/development-access-simulator.js'

const originalWindow = globalThis.window

function prepare(pathname = '/painel') {
  globalThis.window = {
    location: { pathname, origin: 'http://localhost:5173' },
    localStorage: { removeItem() {} },
    fetch: async () => { throw new Error('The development simulator must not call the network') },
  }
  installDevelopmentAccessSimulator()
}

async function get(path) {
  const response = await window.fetch(path)
  return { status: response.status, body: await response.json() }
}

afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
})

test('the local simulator returns fictitious couple panel records', async () => {
  prepare('/painel')
  const [session, weddings, guests, events, site] = await Promise.all([
    get('/api/auth/session'),
    get('/api/couple/weddings'),
    get('/api/couple/weddings/demo-wedding/guests'),
    get('/api/couple/weddings/demo-wedding/events'),
    get('/api/couple/weddings/demo-wedding/site-config'),
  ])
  assert.equal(session.body.account.role, 'couple_admin')
  assert.equal(weddings.body.weddings[0].id, 'demo-wedding')
  assert.equal(guests.body.guests[0].id, 'demo-guest')
  assert.equal(events.body.events[0].id, 'demo-event')
  assert.equal(site.body.draft.theme, 'garden')
  assert.equal((await get('/api/couple/weddings/demo-wedding/expenses')).body.expenses[0].payments[0].amount_cents, 250000)
})

test('the local simulator supplies the guest invitation and godparent task views', async () => {
  prepare('/convidado')
  const [invitation, tasks] = await Promise.all([get('/api/invitation'), get('/api/godparent/tasks')])
  assert.equal(invitation.body.guest.name, 'Marina Almeida')
  assert.equal(invitation.body.events[0].id, 'demo-event')
  assert.equal(tasks.body.tasks[0].id, 'demo-task')
})

test('the local simulator provides published wedding content for the public invitation', async () => {
  prepare('/casamento/ana-e-caio')
  const result = await get('/api/public/weddings/ana-e-caio')
  assert.equal(result.body.siteConfig.theme, 'garden')
  assert.equal(result.body.events[0].id, 'demo-event')
  assert.equal(result.body.gifts[0].fulfillment_type, 'store_link')
})

test('the local simulator supplies only the assigned event roster to the staff screen', async () => {
  prepare('/equipe')
  const [session, events, guests, roster] = await Promise.all([
    get('/api/auth/session'),
    get('/api/staff/events'),
    get('/api/staff/events/demo-event/guests'),
    get('/api/staff/events/demo-event/offline-roster'),
  ])
  assert.equal(session.body.mfaVerified, true)
  assert.equal(events.body.events[0].id, 'demo-event')
  assert.equal(guests.body.guests[0].id, 'demo-guest')
  assert.equal(roster.body.guests[0].id, 'demo-guest')
})

test('the local simulator provides an administrative-only sample workspace', async () => {
  prepare('/superadmin')
  const [session, overview, accounts, weddings] = await Promise.all([
    get('/api/auth/session'),
    get('/api/superadmin/overview'),
    get('/api/superadmin/accounts'),
    get('/api/superadmin/weddings'),
  ])
  assert.equal(session.body.isSuperadmin, true)
  assert.equal(overview.body.weddings.active, 1)
  assert.equal(accounts.body.accounts[0].id, 'demo-account')
  assert.equal(weddings.body.weddings[0].id, 'demo-wedding')
})

test('the local simulator blocks accidental network calls for unknown API paths', async () => {
  prepare()
  const result = await get('/api/not-registered')
  assert.equal(result.status, 200)
  assert.deepEqual(result.body, {})
})
