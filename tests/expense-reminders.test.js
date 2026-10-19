import test from 'node:test'
import assert from 'node:assert/strict'
import { sendMonthlyExpenseReminders } from '../workers/expense-reminders/index.js'

function reminderDatabase() {
  const statements = []
  return {
    statements,
    prepare(query) {
      let parameters = []
      return {
        bind(...values) { parameters = values; return this },
        async all() {
          if (query.includes('SELECT DISTINCT w.id AS wedding_id')) return { results: [{ wedding_id: 'wedding-1', partner_one_name: '<Ana>', partner_two_name: 'Bia' }] }
          if (query.includes('SELECT e.id, e.supplier_name')) return { results: [{ id: 'expense-1', supplier_name: '<Flor>', total_amount_cents: 50000, paid_amount_cents: 10000, due_date: '2027-02-10' }] }
          if (query.includes('SELECT a.id AS account_id')) return { results: [{ account_id: 'account-1', email: 'couple@example.com' }] }
          return { results: [] }
        },
        async run() {
          statements.push({ query, parameters })
          return { meta: { changes: 1 } }
        },
      }
    },
  }
}

test('monthly expense reminders include the current month and mark successful deliveries', async () => {
  const originalFetch = globalThis.fetch
  const sentMessages = []
  globalThis.fetch = async (url, options) => {
    sentMessages.push({ url, body: JSON.parse(options.body) })
    return { ok: true, async json() { return { id: 'email-1' } } }
  }
  const DB = reminderDatabase()
  try {
    const result = await sendMonthlyExpenseReminders({ DB, EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-key', EMAIL_FROM: 'no-reply@example.com' }, new Date('2027-02-01T12:00:00.000Z'))
    assert.equal(result.sent, 1)
    assert.equal(result.failed, 0)
    assert.equal(sentMessages.length, 1)
    assert.equal(sentMessages[0].body.to[0], 'couple@example.com')
    assert.match(sentMessages[0].body.html, /&lt;Ana&gt;/)
    assert.match(sentMessages[0].body.html, /&lt;Flor&gt;/)
    assert.ok(DB.statements.some(({ query }) => query.includes("SET status = 'sent'")))
    assert.deepEqual(DB.statements.find(({ query }) => query.includes('INSERT INTO wedding_expense_reminder_runs')).parameters.slice(1), ['wedding-1', 'account-1', '2027-02'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('monthly reminders do not run without a configured email provider', async () => {
  const result = await sendMonthlyExpenseReminders({ DB: reminderDatabase() }, new Date('2027-02-01T12:00:00.000Z'))
  assert.deepEqual(result, { sent: 0, skipped: 0, failed: 0 })
})
