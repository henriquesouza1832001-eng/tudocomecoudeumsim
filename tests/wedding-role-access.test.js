import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const siteConfig = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Eventos'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Nosso convite', en: 'Our invitation', es: 'Nuestra invitación' } }
const publishedEvent = { id: 'event-published', name: 'Cerimônia', event_type: 'ceremony', starts_at: null, venue_name: 'Jardim', address: null, group_ids: [] }
const restrictedEvent = { id: 'event-restricted', name: 'Ensaio', event_type: 'rehearsal', starts_at: null, venue_name: 'Salão', address: null, group_ids: ['group-private'] }

function database(role) {
  return {
    prepare(query) {
      let parameters = []
      return {
        bind(...values) {
          parameters = values
          return this
        },
        async first() {
          if (query.includes('FROM auth_sessions s')) return { id: 'session-1', account_id: 'account-1', mfa_verified_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'editor@example.com', status: 'active', mfa_enabled_at: new Date().toISOString() }
          if (query.includes('FROM wedding_memberships m JOIN weddings w')) {
            const allowedRoles = parameters.slice(2)
            return allowedRoles.includes(role) ? { id: 'membership-1', role, wedding_status: 'active' } : null
          }
          if (query.includes('SELECT site_config_json, published_site_config_json')) return { site_config_json: JSON.stringify(siteConfig), published_site_config_json: JSON.stringify(siteConfig), site_published_at: '2026-10-14T12:00:00.000Z' }
          if (query.includes('SELECT slug, partner_one_name')) return { slug: 'casal-teste', partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', published_site_config_json: JSON.stringify(siteConfig), published_events_json: JSON.stringify([publishedEvent, restrictedEvent]), site_published_at: '2026-10-14T12:00:00.000Z' }
          if (query.includes('SELECT COUNT(*) AS total FROM events')) return { total: 0 }
          return null
        },
        async all() {
          return { results: [] }
        },
        async run() {
          return { meta: { changes: 1 } }
        },
      }
    },
    async batch() {
      return []
    },
  }
}

async function call(path, role, { method = 'GET', body } = {}) {
  const request = new Request(`${origin}${path}`, {
    method,
    headers: { Cookie: '__Host-wedding-session=test-session', Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return onRequest({ request, env: { DB: database(role) } })
}

test('editors can access drafts and update events', async () => {
  const site = await call('/api/couple/weddings/wedding-1/site-config', 'editor')
  const event = await call('/api/couple/weddings/wedding-1/events', 'editor', { method: 'POST', body: { name: 'Recepção', eventType: 'reception' } })
  assert.equal(site.status, 200)
  assert.ok((await site.json()).draft)
  assert.equal(event.status, 201)
})

test('readers can see published snapshots but cannot access drafts', async () => {
  const published = await call('/api/couple/weddings/wedding-1/published', 'reader')
  const events = await call('/api/couple/weddings/wedding-1/events', 'reader')
  const site = await call('/api/couple/weddings/wedding-1/site-config', 'reader')
  assert.equal(published.status, 200)
  const result = await published.json()
  assert.equal(result.siteConfig.coverMessages['pt-BR'], 'Nosso convite')
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].name, 'Cerimônia')
  assert.equal('group_ids' in result.events[0], false)
  assert.equal(events.status, 404)
  assert.equal(site.status, 404)
})
