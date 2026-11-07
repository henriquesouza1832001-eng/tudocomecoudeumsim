import { PRODUCT_DOMAIN } from './product-config.js'

const reservedSlugs = new Set(['www', 'app', 'api', 'admin', 'painel', 'status', 'mail'])

export function weddingSlug(hostname, baseDomain = PRODUCT_DOMAIN) {
  const domain = baseDomain?.trim().toLowerCase().replace(/^\.+|\.+$/g, '')
  const host = hostname.toLowerCase().replace(/:\d+$/, '')
  if (!domain || host === domain || !host.endsWith(`.${domain}`)) return null
  const slug = host.slice(0, -(domain.length + 1))
  if (!/^[a-z0-9-]{3,30}$/.test(slug) || slug.startsWith('-') || slug.endsWith('-') || reservedSlugs.has(slug)) return null
  return slug
}

export function weddingSiteUrl(slug) {
  return `https://${slug}.${PRODUCT_DOMAIN}`
}
