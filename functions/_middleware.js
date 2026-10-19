import { PRODUCT_BASE_URL, PRODUCT_NAME } from '../src/product-config.js'

export const protectedPath = (pathname) => pathname === '/superadmin'
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

export async function verifyAccessAssertion(assertion, env) {
  const teamDomainValue = env.ACCESS_TEAM_DOMAIN || env.CLOUDFLARE_ACCESS_TEAM_DOMAIN
  const audienceValue = env.ACCESS_APPLICATION_AUD || env.CLOUDFLARE_ACCESS_AUD
  if (!teamDomainValue || !audienceValue || !env.SUPERADMIN_EMAIL) return false
  const audiences = audienceValue.split(',').map((audience) => audience.trim()).filter(Boolean)
  if (!audiences.length) return false

  let issuer
  try {
    const teamDomain = new URL(teamDomainValue)
    if (teamDomain.protocol !== 'https:' || teamDomain.pathname !== '/' || teamDomain.search || teamDomain.hash || teamDomain.username || teamDomain.password) return false
    issuer = teamDomain.origin
  } catch {
    return false
  }
  const parts = assertion.split('.')
  if (parts.length !== 3) return false

  try {
    const header = decodeJson(parts[0])
    const claims = decodeJson(parts[1])
    if (header.alg !== 'RS256' || !header.kid) return false
    if (claims.iss !== issuer || claims.email?.toLowerCase() !== env.SUPERADMIN_EMAIL.toLowerCase()) return false
    if (!audiences.some((audience) => (Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(audience))) return false
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
  const url = new URL(context.request.url)
  const contentType = response.headers.get('Content-Type') || ''
  if (url.pathname === '/' && context.request.method === 'GET' && response.status === 200 && contentType.includes('text/html')) {
    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: PRODUCT_NAME,
      url: `${PRODUCT_BASE_URL}/`,
      inLanguage: 'pt-BR',
    }
    const structuredData = JSON.stringify(website).replace(/</g, '\\u003c')
    const metadata = `<link rel="canonical" href="${PRODUCT_BASE_URL}/"><script type="application/ld+json">${structuredData}</script>`
    const html = (await response.text()).replace('</head>', `${metadata}</head>`)
    const headers = new Headers(response.headers)
    headers.delete('Content-Length')
    headers.delete('Content-Encoding')
    headers.delete('ETag')
    response = new Response(html, { status: response.status, statusText: response.statusText, headers })
  } else if (contentType.includes('text/html') && (url.pathname.startsWith('/casamento/') || url.pathname === '/documentos-legais/rascunho' || url.pathname.startsWith('/estudo-') || url.pathname === '/painel/demo' || url.pathname === '/criar-site' || url.pathname === '/cadastro')) {
    const headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex, nofollow')
    response = new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  headers.set('Strict-Transport-Security', 'max-age=15552000')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
