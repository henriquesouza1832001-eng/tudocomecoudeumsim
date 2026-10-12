const protectedPath = (pathname) => pathname === '/superadmin'
  || pathname.startsWith('/superadmin/')
  || pathname === '/api/superadmin'
  || pathname.startsWith('/api/superadmin/')

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)))
}

async function verifyAccessAssertion(assertion, env) {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_APPLICATION_AUD || !env.SUPERADMIN_EMAIL) return false

  const teamDomain = env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const issuer = `https://${teamDomain}`
  const parts = assertion.split('.')
  if (parts.length !== 3) return false

  try {
    const header = decodeJson(parts[0])
    const claims = decodeJson(parts[1])
    if (header.alg !== 'RS256' || !header.kid) return false
    if (claims.iss !== issuer || claims.email?.toLowerCase() !== env.SUPERADMIN_EMAIL.toLowerCase()) return false
    if (!(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(env.ACCESS_APPLICATION_AUD)) return false
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isFinite(claims.exp) || claims.exp <= now) return false
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now)) return false

    const certificatesResponse = await fetch(`${issuer}/cdn-cgi/access/certs`)
    if (!certificatesResponse.ok) return false
    const certificates = await certificatesResponse.json()
    const jwk = certificates.keys?.find((key) => key.kid === header.kid)
    if (!jwk) return false

    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, decodeBase64Url(parts[2]), signedData)
  } catch {
    return false
  }
}

export async function onRequest(context) {
  let response
  if (protectedPath(new URL(context.request.url).pathname)) {
    const assertion = context.request.headers.get('Cf-Access-Jwt-Assertion')
    if (!assertion || !await verifyAccessAssertion(assertion, context.env)) {
      response = new Response('Acesso não autorizado', {
        status: 403,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  }

  response ||= await context.next()
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  headers.set('Strict-Transport-Security', 'max-age=15552000')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
