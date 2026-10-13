const SESSION_COOKIE = '__Host-wedding-session'
const SESSION_LIFETIME_SECONDS = 28800
const LOGIN_WINDOW_SECONDS = 900
const LOGIN_MAX_ATTEMPTS = 5

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function digest(value) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
}

async function derivePassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return new Uint8Array(bits)
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 100000
  const hash = await derivePassword(password, salt, iterations)
  return `pbkdf2-sha256$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`
}

async function verifyPassword(password, storedHash) {
  const [algorithm, rawIterations, rawSalt, rawHash] = storedHash.split('$')
  const iterations = Number(rawIterations)
  if (algorithm !== 'pbkdf2-sha256' || iterations !== 100000 || !rawSalt || !rawHash) return false
  const expected = base64UrlToBytes(rawHash)
  const actual = await derivePassword(password, base64UrlToBytes(rawSalt), iterations)
  if (expected.length !== actual.length) return false
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) difference |= expected[index] ^ actual[index]
  return difference === 0
}

function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let buffer = 0
  let bits = 0
  const output = []
  for (const character of value.toUpperCase().replace(/=+$/g, '').replace(/\s/g, '')) {
    const digit = alphabet.indexOf(character)
    if (digit < 0) throw new Error('invalid_totp_secret')
    buffer = (buffer << 5) | digit
    bits += 5
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(output)
}

function encodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let buffer = 0
  let bits = 0
  let output = ''
  for (const byte of value) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += alphabet[(buffer >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits) output += alphabet[(buffer << (5 - bits)) & 31]
  return output
}

async function decryptTotpSecret(value, keyValue) {
  if (!keyValue) throw new Error('mfa_encryption_key_missing')
  const [version, rawIv, rawCiphertext] = value.split('.')
  if (version !== 'v1' || !rawIv || !rawCiphertext) throw new Error('invalid_totp_ciphertext')
  const keyBytes = base64UrlToBytes(keyValue)
  if (keyBytes.length !== 32) throw new Error('invalid_mfa_encryption_key')
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const secret = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64UrlToBytes(rawIv) }, key, base64UrlToBytes(rawCiphertext))
  return new Uint8Array(secret)
}

async function encryptTotpSecret(secret, keyValue) {
  if (!keyValue) throw new Error('mfa_encryption_key_missing')
  const keyBytes = base64UrlToBytes(keyValue)
  if (keyBytes.length !== 32) throw new Error('invalid_mfa_encryption_key')
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(encodeBase32(secret)))
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`
}

async function totpAt(secret, counter) {
  const message = new Uint8Array(8)
  new DataView(message.buffer).setBigUint64(0, BigInt(counter), false)
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const digestBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  const offset = digestBytes[digestBytes.length - 1] & 15
  const number = ((digestBytes[offset] & 127) << 24) | ((digestBytes[offset + 1] & 255) << 16) | ((digestBytes[offset + 2] & 255) << 8) | (digestBytes[offset + 3] & 255)
  return String(number % 1000000).padStart(6, '0')
}

async function verifyTotp(ciphertext, key, code) {
  if (!/^\d{6}$/.test(code || '')) return false
  const secret = decodeBase32(new TextDecoder().decode(await decryptTotpSecret(ciphertext, key)))
  const currentCounter = Math.floor(Date.now() / 30000)
  let match = null
  for (const counter of [currentCounter - 1, currentCounter, currentCounter + 1]) {
    if (await totpAt(secret, counter) === code) match = counter
  }
  return match
}

export async function verifyRecentTotp(context, accountId, code) {
  const row = await context.env.DB.prepare('SELECT totp_secret_ciphertext, enabled_at, last_totp_counter FROM account_mfa WHERE account_id = ?').bind(accountId).first()
  if (!row?.enabled_at || !row.totp_secret_ciphertext) return false
  let matchedCounter
  try {
    matchedCounter = await verifyTotp(row.totp_secret_ciphertext, context.env.MFA_ENCRYPTION_KEY, code)
  } catch {
    return false
  }
  if (matchedCounter === false || matchedCounter <= row.last_totp_counter) return false
  const result = await context.env.DB.prepare('UPDATE account_mfa SET last_totp_counter = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ? AND last_totp_counter < ?')
    .bind(matchedCounter, accountId, matchedCounter).run()
  return result.meta.changes === 1
}

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || ''
  for (const part of cookies.split(';')) {
    const separator = part.indexOf('=')
    if (separator >= 0 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim()
  }
  return ''
}

function setSessionCookie(context, token) {
  context.header('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_LIFETIME_SECONDS}`)
}

function clearSessionCookie(context) {
  context.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)
}

export async function createSession(context, accountId, mfaVerified) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_SECONDS * 1000).toISOString()
  const id = crypto.randomUUID()
  await context.env.DB.prepare('INSERT INTO auth_sessions (id, account_id, token_hash, mfa_verified_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, accountId, await digest(token), mfaVerified ? now.toISOString() : null, expiresAt).run()
  setSessionCookie(context, token)
  return { id, expiresAt, mfaVerifiedAt: mfaVerified ? now.toISOString() : null }
}

export async function startTotpEnrollment(context, accountId, email) {
  const secret = crypto.getRandomValues(new Uint8Array(20))
  const ciphertext = await encryptTotpSecret(secret, context.env.MFA_ENCRYPTION_KEY)
  const current = await context.env.DB.prepare('SELECT enabled_at FROM account_mfa WHERE account_id = ?').bind(accountId).first()
  if (current?.enabled_at) return null
  const result = await context.env.DB.prepare(`
    INSERT INTO account_mfa (account_id, totp_secret_ciphertext, enabled_at, last_totp_counter, updated_at)
    VALUES (?, ?, NULL, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(account_id) DO UPDATE SET totp_secret_ciphertext = excluded.totp_secret_ciphertext, updated_at = CURRENT_TIMESTAMP
    WHERE account_mfa.enabled_at IS NULL
  `).bind(accountId, ciphertext).run()
  if (result.meta.changes !== 1) return null
  const label = encodeURIComponent(`Plataforma de casamento:${email}`)
  const issuer = encodeURIComponent('Plataforma de casamento')
  const uri = `otpauth://totp/${label}?secret=${encodeBase32(secret)}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
  return { secret: encodeBase32(secret), uri }
}

export async function confirmTotpEnrollment(context, accountId, code) {
  const row = await context.env.DB.prepare('SELECT totp_secret_ciphertext, enabled_at FROM account_mfa WHERE account_id = ?').bind(accountId).first()
  if (!row?.totp_secret_ciphertext || row.enabled_at) return false
  let counter
  try {
    counter = await verifyTotp(row.totp_secret_ciphertext, context.env.MFA_ENCRYPTION_KEY, code)
  } catch {
    return false
  }
  if (counter === false) return false
  const result = await context.env.DB.prepare(`
    UPDATE account_mfa SET enabled_at = CURRENT_TIMESTAMP, last_totp_counter = ?, updated_at = CURRENT_TIMESTAMP
    WHERE account_id = ? AND enabled_at IS NULL AND last_totp_counter < ?
  `).bind(counter, accountId, counter).run()
  return result.meta.changes === 1
}

export async function loadSession(context) {
  const token = getCookie(context.req.raw, SESSION_COOKIE)
  if (!token) return null
  const row = await context.env.DB.prepare(`
    SELECT s.id, s.account_id, s.mfa_verified_at, s.expires_at, a.email, a.status, m.enabled_at AS mfa_enabled_at
    FROM auth_sessions s JOIN accounts a ON a.id = s.account_id
    LEFT JOIN account_mfa m ON m.account_id = a.id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL
  `).bind(await digest(token)).first()
  if (!row || row.status !== 'active' || Date.parse(row.expires_at) <= Date.now()) return null
  return row
}

export function clearCookie(context) {
  clearSessionCookie(context)
}

export async function authenticate(context, email, password, code) {
  const account = await context.env.DB.prepare(`
    SELECT a.id, a.email, a.password_hash, a.status, a.email_verified_at,
      m.totp_secret_ciphertext, m.enabled_at, m.last_totp_counter,
      EXISTS (SELECT 1 FROM platform_admins p WHERE p.account_id = a.id AND p.role = 'superadmin') AS is_superadmin
    FROM accounts a LEFT JOIN account_mfa m ON m.account_id = a.id
    WHERE a.email = ? COLLATE NOCASE
  `).bind(email).first()

  const validPassword = await verifyPassword(password, account?.password_hash || 'pbkdf2-sha256$310000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
  if (!account || !validPassword || account.status !== 'active' || !account.email_verified_at) return { error: 'invalid_credentials' }
  if (!account.enabled_at) return { error: 'mfa_setup_required', accountId: account.id, email: account.email, isSuperadmin: Boolean(account.is_superadmin) }

  let mfaVerified = false
  if (account.enabled_at) {
    if (!account.totp_secret_ciphertext) return { error: 'mfa_unavailable' }
    try {
      const matchedCounter = await verifyTotp(account.totp_secret_ciphertext, context.env.MFA_ENCRYPTION_KEY, code)
      if (matchedCounter !== false && matchedCounter > account.last_totp_counter) {
        const update = await context.env.DB.prepare('UPDATE account_mfa SET last_totp_counter = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ? AND last_totp_counter < ?')
          .bind(matchedCounter, account.id, matchedCounter).run()
        mfaVerified = update.meta.changes === 1
      }
    } catch {
      return { error: 'mfa_unavailable' }
    }
    if (!mfaVerified) return { error: 'invalid_credentials' }
  }

  await context.env.DB.prepare('UPDATE accounts SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(account.id).run()
  return { accountId: account.id, email: account.email, isSuperadmin: Boolean(account.is_superadmin), mfaVerified }
}

export async function recordLoginFailure(context, email) {
  const now = Math.floor(Date.now() / 1000)
  const address = context.req.header('CF-Connecting-IP') || 'unknown'
  const key = await digest(`${email.toLowerCase()}:${address}`)
  const current = await context.env.DB.prepare('SELECT failed_attempts, window_started_at, blocked_until FROM auth_rate_limits WHERE identifier_hash = ?').bind(key).first()
  if (current?.blocked_until && current.blocked_until > now) return { blocked: true, retryAfter: current.blocked_until - now }
  const withinWindow = current && current.window_started_at > now - LOGIN_WINDOW_SECONDS
  const attempts = withinWindow ? current.failed_attempts + 1 : 1
  const blockedUntil = attempts >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_WINDOW_SECONDS : null
  await context.env.DB.prepare(`
    INSERT INTO auth_rate_limits (identifier_hash, failed_attempts, window_started_at, blocked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(identifier_hash) DO UPDATE SET
      failed_attempts = excluded.failed_attempts,
      window_started_at = excluded.window_started_at,
      blocked_until = excluded.blocked_until
  `).bind(key, attempts, withinWindow ? current.window_started_at : now, blockedUntil).run()
  return { blocked: Boolean(blockedUntil), retryAfter: blockedUntil ? LOGIN_WINDOW_SECONDS : 0 }
}

export async function checkLoginLimit(context, email) {
  const now = Math.floor(Date.now() / 1000)
  const address = context.req.header('CF-Connecting-IP') || 'unknown'
  const key = await digest(`${email.toLowerCase()}:${address}`)
  const current = await context.env.DB.prepare('SELECT blocked_until FROM auth_rate_limits WHERE identifier_hash = ?').bind(key).first()
  return current?.blocked_until > now ? current.blocked_until - now : 0
}

export async function clearLoginFailures(context, email) {
  const address = context.req.header('CF-Connecting-IP') || 'unknown'
  const key = await digest(`${email.toLowerCase()}:${address}`)
  await context.env.DB.prepare('DELETE FROM auth_rate_limits WHERE identifier_hash = ?').bind(key).run()
}
