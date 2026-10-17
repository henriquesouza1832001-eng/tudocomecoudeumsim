import { app } from '../functions/api/[[route]].js'
import { protectedPath, verifyAccessAssertion } from '../functions/_middleware.js'

const reservedSlugs = new Set(['www', 'app', 'api', 'admin', 'painel', 'status', 'mail'])

function weddingSlug(hostname, baseDomain) {
  const domain = baseDomain?.trim().toLowerCase().replace(/^\.+|\.+$/g, '')
  const host = hostname.toLowerCase().replace(/:\d+$/, '')
  if (!domain || host === domain || !host.endsWith(`.${domain}`)) return null
  const slug = host.slice(0, -(domain.length + 1))
  if (!/^[a-z0-9-]{3,30}$/.test(slug) || slug.startsWith('-') || slug.endsWith('-') || reservedSlugs.has(slug)) return null
  return slug
}

async function publicSite(request, env, slug) {
  if (!env.DB) return Response.json({ error: 'site_unavailable' }, { status: 503 })
  let wedding = env.WEDDING_HOSTS ? await env.WEDDING_HOSTS.get(slug, 'json') : null
  if (!wedding) {
    wedding = await env.DB.prepare(`SELECT id, slug, partner_one_name, partner_two_name, event_date, timezone,
      published_site_config_json, published_events_json, site_published_at
      FROM weddings WHERE slug = ? AND status = 'active' AND site_published_at IS NOT NULL LIMIT 1`).bind(slug).first()
    if (!wedding) return Response.json({ error: 'site_not_found' }, { status: 404 })
    if (env.WEDDING_HOSTS) await env.WEDDING_HOSTS.put(slug, JSON.stringify(wedding), { expirationTtl: 60 })
  }
  const config = JSON.parse(wedding.published_site_config_json || 'null')
  if (!config) return Response.json({ error: 'site_not_found' }, { status: 404 })
  const events = JSON.parse(wedding.published_events_json || '[]')
    .filter((event) => !JSON.parse(event.group_ids_json || '[]').length && !(event.group_ids || []).length)
    .map((event) => {
      const result = { ...event }
      delete result.group_ids
      delete result.group_ids_json
      return result
    })
  return Response.json({
    wedding: { slug: wedding.slug, partnerOneName: wedding.partner_one_name, partnerTwoName: wedding.partner_two_name, eventDate: wedding.event_date, timezone: wedding.timezone },
    siteConfig: config,
    events,
    publishedAt: wedding.site_published_at,
  }, { headers: { 'Cache-Control': 'public, max-age=60' } })
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  headers.set('Strict-Transport-Security', 'max-age=15552000')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default {
  async fetch(request, env, executionContext) {
    const url = new URL(request.url)
    let response
    if (protectedPath(url.pathname)) {
      const assertion = request.headers.get('Cf-Access-Jwt-Assertion')
      if (!assertion || !await verifyAccessAssertion(assertion, env)) {
        response = new Response('Acesso não autorizado', { status: 403, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    }
    if (!response && url.pathname === '/api/public/site') {
      const slug = weddingSlug(url.hostname, env.BASE_DOMAIN)
      response = slug ? await publicSite(request, env, slug) : Response.json({ error: 'wedding_subdomain_unavailable' }, { status: 404 })
    }
    if (!response && url.pathname.startsWith('/api/')) response = await app.fetch(request, env, executionContext)
    if (!response) response = await env.ASSETS.fetch(request)
    return withSecurityHeaders(response)
  },
}

export { weddingSlug }
