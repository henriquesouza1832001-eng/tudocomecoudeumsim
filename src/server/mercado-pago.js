const API_BASE_URL = 'https://api.mercadopago.com'

async function requestMercadoPago(accessToken, path, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    redirect: 'error',
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error('mercado_pago_request_failed')
    error.status = response.status
    throw error
  }
  return body
}

export async function checkMercadoPagoAccount(accessToken, fetchImpl) {
  const account = await requestMercadoPago(accessToken, '/users/me', {}, fetchImpl)
  if (!account || (typeof account.id !== 'number' && typeof account.id !== 'string')) {
    throw new Error('mercado_pago_invalid_account_response')
  }
  return { accountId: String(account.id) }
}

export async function createMercadoPagoTestPreference(accessToken, { amountCents, productName, reference, baseUrl, notificationUrl }, fetchImpl) {
  if (!Number.isSafeInteger(amountCents) || amountCents < 1 || typeof reference !== 'string' || !/^[0-9a-f-]{36}$/i.test(reference)) {
    throw new Error('invalid_test_preference')
  }
  const payload = await requestMercadoPago(accessToken, '/checkout/preferences', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': reference },
    body: JSON.stringify({
      items: [{ id: 'platform-access-test', title: `${productName} — acesso de teste`, quantity: 1, currency_id: 'BRL', unit_price: amountCents / 100 }],
      external_reference: `test-${reference}`,
      metadata: { environment: 'test', test_reference: reference },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      back_urls: {
        success: `${baseUrl}/?mp_test=approved`,
        pending: `${baseUrl}/?mp_test=pending`,
        failure: `${baseUrl}/?mp_test=rejected`,
      },
    }),
  }, fetchImpl)
  if (typeof payload?.id !== 'string' || typeof payload?.sandbox_init_point !== 'string') {
    throw new Error('mercado_pago_invalid_preference_response')
  }
  return { preferenceId: payload.id, checkoutUrl: payload.sandbox_init_point, reference }
}

export async function validateMercadoPagoWebhookSignature({ signature, requestId, dataId, secret }) {
  if (typeof signature !== 'string' || signature.length > 256 || typeof requestId !== 'string' || !requestId || requestId.length > 256 || typeof dataId !== 'string' || !/^\d{1,24}$/.test(dataId) || typeof secret !== 'string' || !secret) return false
  const parts = Object.fromEntries(signature.split(',').map((part) => part.split('=', 2).map((value) => value.trim())))
  if (!/^\d{1,20}$/.test(parts.ts || '') || !/^[0-9a-f]{64}$/i.test(parts.v1 || '')) return false
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)))
  const received = Uint8Array.from(parts.v1.match(/.{2}/g), (byte) => Number.parseInt(byte, 16))
  let difference = 0
  for (let index = 0; index < digest.length; index += 1) difference |= digest[index] ^ received[index]
  return difference === 0
}

export async function getMercadoPagoTestPayment(accessToken, paymentId, fetchImpl) {
  if (!/^\d{1,24}$/.test(paymentId)) throw new Error('invalid_payment_id')
  const payment = await requestMercadoPago(accessToken, `/v1/payments/${paymentId}`, {}, fetchImpl)
  if (!payment || String(payment.id) !== paymentId) throw new Error('mercado_pago_invalid_payment_response')
  if (payment.live_mode === true) throw new Error('mercado_pago_live_payment_rejected_in_test_mode')
  return {
    paymentId: String(payment.id),
    status: typeof payment.status === 'string' ? payment.status : 'unknown',
    statusDetail: typeof payment.status_detail === 'string' ? payment.status_detail : null,
    amount: typeof payment.transaction_amount === 'number' ? payment.transaction_amount : null,
    currency: typeof payment.currency_id === 'string' ? payment.currency_id : null,
    externalReference: typeof payment.external_reference === 'string' ? payment.external_reference : null,
    liveMode: payment.live_mode === true,
  }
}
