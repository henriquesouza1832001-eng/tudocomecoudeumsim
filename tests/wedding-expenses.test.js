import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'

test('unknown API routes return a consistent JSON error', async () => {
  const response = await onRequest({ request: new Request(`${origin}/api/unknown-resource`), env: {} })
  assert.equal(response.status, 404)
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await response.json(), { error: 'api_route_not_found' })
})

function database(role, options = {}) {
  return {
    prepare(query) {
      let parameters = []
      return {
        bind(...values) { parameters = values; return this },
        async first() {
          if (query.includes('FROM auth_sessions s')) return { id: 'session-1', account_id: 'account-1', mfa_verified_at: null, expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'couple@example.com', status: 'active' }
          if (query.includes('FROM wedding_memberships m JOIN weddings w')) return ['couple_admin'].includes(role) && parameters.slice(2).includes(role) ? { id: 'membership-1', role, wedding_status: 'active' } : null
          return null
        },
        async all() { return { results: [] } },
        async run() { return { meta: { changes: options.paymentInsertChanges ?? 1 }, parameters } },
      }
    },
    async batch() { return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }] },
  }
}

async function call(path, role, { method = 'GET', body, paymentInsertChanges } = {}) {
  const request = new Request(`${origin}${path}`, {
    method,
    headers: { Cookie: '__Host-wedding-session=test-session', Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return onRequest({ request, env: { DB: database(role, { paymentInsertChanges }) } })
}

test('expense planning is limited to the couple administrators', async () => {
  const response = await call('/api/couple/weddings/wedding-1/expenses', 'editor')
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'wedding_not_found' })
})

test('couple administrators can register supplier expenses without processing a payment', async () => {
  const response = await call('/api/couple/weddings/wedding-1/expenses', 'couple_admin', {
    method: 'POST',
    body: { supplierName: 'Ateliê Floral', supplierContact: '', category: 'Decoração', description: 'Arranjos da cerimônia', totalAmountCents: 185000, dueDate: '2027-05-01', reminderEnabled: true },
  })
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(result.supplierName, 'Ateliê Floral')
  assert.equal(result.totalAmountCents, 185000)
  assert.equal(result.paidAmountCents, 0)
  assert.equal(result.reminderEnabled, true)
})

test('expense registration rejects invalid money and dates', async () => {
  const response = await call('/api/couple/weddings/wedding-1/expenses', 'couple_admin', {
    method: 'POST',
    body: { supplierName: 'Ateliê Floral', supplierContact: '', category: '', description: '', totalAmountCents: 10000, dueDate: '2027-02-31', reminderEnabled: true },
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_wedding_expense' })
})

test('payment date rejects a calendar day that does not exist', async () => {
  const response = await call('/api/couple/weddings/wedding-1/expenses/expense-1/payments', 'couple_admin', {
    method: 'POST',
    body: { amountCents: 10000, paidAt: '2027-02-31', notes: '' },
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_expense_payment' })
})

test('monthly reminders require an expense due date', async () => {
  const response = await call('/api/couple/weddings/wedding-1/expenses', 'couple_admin', {
    method: 'POST',
    body: { supplierName: 'Ateliê Floral', supplierContact: '', category: '', description: '', totalAmountCents: 10000, dueDate: null, reminderEnabled: true },
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_wedding_expense' })
})

test('expense payments that exceed the remaining balance are rejected atomically', async () => {
  const response = await call('/api/couple/weddings/wedding-1/expenses/expense-1/payments', 'couple_admin', {
    method: 'POST',
    paymentInsertChanges: 0,
    body: { amountCents: 25000, paidAt: '2027-05-01', notes: 'Parcela' },
  })
  assert.equal(response.status, 409)
  assert.deepEqual(await response.json(), { error: 'expense_payment_exceeds_balance' })
})
