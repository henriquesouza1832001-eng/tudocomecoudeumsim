import assert from 'node:assert/strict'
import test from 'node:test'
import { authenticate, hashPassword } from '../src/server/auth.js'

function accountDatabase(account) {
  return {
    prepare(query) {
      return {
        bind() {
          return this
        },
        async first() {
          return query.includes('FROM accounts a LEFT JOIN account_mfa') ? account : null
        },
        async run() {
          return { meta: { changes: 1 } }
        },
      }
    },
  }
}

async function credentials({ isSuperadmin = 0, enabledAt = null, code = '' } = {}) {
  const password = 'correct horse battery staple'
  const account = {
    id: 'account-1',
    email: 'person@example.com',
    password_hash: await hashPassword(password),
    status: 'active',
    email_verified_at: '2026-01-01T00:00:00.000Z',
    totp_secret_ciphertext: null,
    enabled_at: enabledAt,
    last_totp_counter: 0,
    is_superadmin: isSuperadmin,
  }
  const context = { env: { DB: accountDatabase(account) } }
  return authenticate(context, account.email, password, code)
}

test('couple and staff accounts authenticate with password without TOTP enrollment', async () => {
  const result = await credentials()
  assert.equal(result.error, undefined)
  assert.equal(result.mfaVerified, true)
  assert.equal(result.isSuperadmin, false)
})

test('legacy TOTP enrollment does not block couple or staff login', async () => {
  const result = await credentials({ enabledAt: '2026-01-01T00:00:00.000Z' })
  assert.equal(result.error, undefined)
  assert.equal(result.mfaVerified, true)
})

test('superadmin accounts must enroll TOTP before login can complete', async () => {
  const result = await credentials({ isSuperadmin: 1 })
  assert.equal(result.error, 'mfa_setup_required')
  assert.equal(result.isSuperadmin, true)
})

test('superadmin accounts fail closed when TOTP verification is unavailable', async () => {
  const result = await credentials({ isSuperadmin: 1, enabledAt: '2026-01-01T00:00:00.000Z' })
  assert.equal(result.error, 'mfa_unavailable')
})
