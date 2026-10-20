import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'
import { checkMercadoPagoAccount, createMercadoPagoTestPreference, getMercadoPagoTestPayment, validateMercadoPagoWebhookSignature } from '../src/server/mercado-pago.js'

test('Mercado Pago connection check only returns the account identifier', async () => {
  let request
  const result = await checkMercadoPagoAccount('test-token', async (url, options) => {
    request = { url, options }
    return Response.json({ id: 12345, email: 'private@example.com', nickname: 'test-seller' })
  })
  assert.deepEqual(result, { accountId: '12345' })
  assert.equal(request.url, 'https://api.mercadopago.com/users/me')
  assert.equal(request.options.headers.Authorization, 'Bearer test-token')
})

test('test preference uses the fixed BRL amount and sandbox checkout URL', async () => {
  let request
  const reference = '11111111-1111-4111-8111-111111111111'
  const result = await createMercadoPagoTestPreference('test-token', {
    amountCents: 9000,
    productName: 'Tudo começou de um sim',
    reference,
    baseUrl: 'https://tudocomecoudeumsim.pages.dev',
  }, async (url, options) => {
    request = { url, options }
    return Response.json({ id: 'preference-1', sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=preference-1' })
  })
  assert.equal(request.url, 'https://api.mercadopago.com/checkout/preferences')
  assert.equal(request.options.headers['X-Idempotency-Key'], reference)
  const body = JSON.parse(request.options.body)
  assert.deepEqual(body.items, [{ id: 'platform-access-test', title: 'Tudo começou de um sim — acesso de teste', quantity: 1, currency_id: 'BRL', unit_price: 90 }])
  assert.equal(body.notification_url, 'https://tudocomecoudeumsim.pages.dev/api/webhooks/mercadopago/test')
  assert.equal(result.checkoutUrl, 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=preference-1')
  assert.equal(result.reference, reference)
})

test('test payment lookup validates numeric IDs and returns only safe status fields', async () => {
  let called = false
  await assert.rejects(() => getMercadoPagoTestPayment('test-token', '1/other', async () => { called = true }), { message: 'invalid_payment_id' })
  assert.equal(called, false)
  const result = await getMercadoPagoTestPayment('test-token', '12345', async () => Response.json({
    id: 12345,
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 90,
    currency_id: 'BRL',
    external_reference: 'test-reference',
    live_mode: false,
    payer: { email: 'private@example.com' },
  }))
  assert.deepEqual(result, {
    paymentId: '12345',
    status: 'approved',
    statusDetail: 'accredited',
    amount: 90,
    currency: 'BRL',
    externalReference: 'test-reference',
    liveMode: false,
  })
  await assert.rejects(() => getMercadoPagoTestPayment('test-token', '12345', async () => Response.json({ id: 12345, live_mode: true })), { message: 'mercado_pago_live_payment_rejected_in_test_mode' })
})

test('Mercado Pago errors do not leak provider response bodies', async () => {
  await assert.rejects(() => checkMercadoPagoAccount('test-token', async () => Response.json({ message: 'private provider details' }, { status: 401 })), {
    message: 'mercado_pago_request_failed',
    status: 401,
  })
})

test('Mercado Pago test endpoints require a signed-in session', async () => {
  const request = new Request('https://tudocomecoudeumsim.pages.dev/api/superadmin/mercadopago/test/connection', {
    headers: { Cookie: '__Host-wedding-session=invalid-session' },
  })
  const response = await onRequest({
    request,
    env: {
      MERCADOPAGO_MODE: 'test',
      MERCADOPAGO_ACCESS_TOKEN: 'test-token',
      DB: { prepare: () => ({ bind() { return this }, async first() { return null } }) },
    },
  })
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'authentication_required' })
})

test('Mercado Pago webhook validates the signed manifest and rejects tampering', async () => {
  const secret = 'test-webhook-secret'
  const requestId = 'request-123'
  const dataId = '987654321'
  const timestamp = '1781888400'
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)))
  const hash = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  const signature = `ts=${timestamp},v1=${hash}`
  assert.equal(await validateMercadoPagoWebhookSignature({ signature, requestId, dataId, secret }), true)
  assert.equal(await validateMercadoPagoWebhookSignature({ signature, requestId, dataId: '987654320', secret }), false)
  assert.equal(await validateMercadoPagoWebhookSignature({ signature: 'ts=1,v1=wrong', requestId, dataId, secret }), false)
})

test('Mercado Pago webhook accepts server-to-server requests only after signature validation', async () => {
  const request = new Request('https://tudocomecoudeumsim.pages.dev/api/webhooks/mercadopago/test?data.id=12345', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'payment', data: { id: '12345' } }),
  })
  const response = await onRequest({
    request,
    env: {
      MERCADOPAGO_MODE: 'test',
      MERCADOPAGO_ACCESS_TOKEN: 'test-token',
      MERCADOPAGO_WEBHOOK_SECRET: 'test-webhook-secret',
    },
  })
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'mercado_pago_webhook_signature_invalid' })
})
