import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const siteConfig = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Eventos', 'Galeria de fotos'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Nosso convite', en: 'Our invitation', es: 'Nuestra invitación' }, siteGallery: ['a'.repeat(36)] }
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
          if (query.includes('FROM events e JOIN wedding_memberships m')) {
            const allowedRoles = parameters.slice(2)
            return parameters[0] === 'event-1' && allowedRoles.includes(role) ? { event_id: 'event-1', wedding_id: 'wedding-1', membership_id: 'membership-1', role } : null
          }
          if (query.includes('FROM guests g JOIN weddings w')) return { id: 'guest-1', wedding_id: 'wedding-1', group_id: 'group-1', name: 'Convidada', party_size: 2, guest_type: role === 'godparent' ? 'godparent' : 'guest', partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', timezone: 'America/Sao_Paulo', wedding_status: 'active', published_site_config_json: JSON.stringify(siteConfig), published_events_json: '[]' }
          if (query.includes('SELECT site_config_json, published_site_config_json')) return { site_config_json: JSON.stringify(siteConfig), published_site_config_json: JSON.stringify(siteConfig), site_published_at: '2026-10-14T12:00:00.000Z' }
          if (query.includes('SELECT slug,') && query.includes('published_site_config_json')) return { slug: 'casal-teste', partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', event_time: '16:00', published_site_config_json: JSON.stringify(siteConfig), published_events_json: JSON.stringify([publishedEvent, restrictedEvent]), site_published_at: '2026-10-14T12:00:00.000Z' }
          if (query.includes('SELECT COUNT(*) AS total FROM events')) return { total: 0 }
          return null
        },
        async all() {
          if (query.includes('SELECT g.id, g.name') && !query.includes('LEFT JOIN')) return { results: [{ id: 'guest-1', name: 'Convidada' }] }
          if (query.includes('FROM godparent_tasks')) return { results: [{ id: 'task-1', title: 'Levar as alianças', details: '', due_at: null, status: 'open' }] }
          if (query.includes('FROM guests g LEFT JOIN guest_groups gg')) return { results: [{ id: 'guest-1', name: 'Convidada', party_size: 2, rsvp_status: 'confirmed', dietary_notes: null, group_name: 'Família', checked_in_at: null }] }
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
  assert.deepEqual(result.siteConfig.siteGallery, ['a'.repeat(36)])
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].name, 'Cerimônia')
  assert.equal('group_ids' in result.events[0], false)
  assert.equal(events.status, 404)
  assert.equal(site.status, 404)
})

test('editors and readers cannot access guest, payment, or team administration APIs', async () => {
  const protectedPaths = [
    '/api/couple/weddings/wedding-1/members',
    '/api/couple/weddings/wedding-1/event-assignments',
    '/api/couple/weddings/wedding-1/guests',
    '/api/couple/weddings/wedding-1/rsvps',
    '/api/couple/weddings/wedding-1/gifts',
    '/api/couple/weddings/wedding-1/contributions',
  ]
  for (const role of ['editor', 'reader']) {
    for (const path of protectedPaths) {
      const response = await call(path, role)
      assert.equal(response.status, 404, `${role} should not access ${path}`)
    }
    const groupMutation = await call('/api/couple/weddings/wedding-1/groups', role, { method: 'POST', body: { name: 'Família' } })
    assert.equal(groupMutation.status, 404, `${role} should not create guest groups`)
  }
})

test('event staff can read only assigned event rosters without contact fields', async () => {
  const roster = await call('/api/staff/events/event-1/guests', 'event_staff')
  const otherEvent = await call('/api/staff/events/event-2/guests', 'event_staff')
  assert.equal(roster.status, 200)
  assert.equal(otherEvent.status, 404)
  const guest = (await roster.json()).guests[0]
  assert.equal(guest.name, 'Convidada')
  assert.equal('email' in guest, false)
  assert.equal('phone' in guest, false)
})

test('only check-in staff can record last-minute attendees', async () => {
  const body = { name: 'Convidado de última hora', partySize: 1, dietaryNotes: '' }
  const checkin = await call('/api/staff/events/event-1/checkins', 'checkin_staff', { method: 'POST', body })
  const eventStaff = await call('/api/staff/events/event-1/checkins', 'event_staff', { method: 'POST', body })
  assert.equal(checkin.status, 201)
  assert.equal((await checkin.json()).walkIn, true)
  assert.equal(eventStaff.status, 404)
})

test('godparent task lists are tied to the authenticated individual invitation', async () => {
  const tasks = await onRequest({
    request: new Request(`${origin}/api/godparent/tasks`, { headers: { Authorization: `Bearer ${'a'.repeat(43)}` } }),
    env: { DB: database('godparent') },
  })
  const result = await tasks.json()
  assert.equal(tasks.status, 200)
  assert.equal(result.tasks.length, 1)
  assert.equal(result.tasks[0].title, 'Levar as alianças')
})

test('site media is scoped to wedding editors and hidden from readers', async () => {
  const editor = await call('/api/couple/weddings/wedding-1/site-media', 'editor')
  const reader = await call('/api/couple/weddings/wedding-1/site-media', 'reader')
  assert.equal(editor.status, 200)
  assert.equal(reader.status, 404)
})
