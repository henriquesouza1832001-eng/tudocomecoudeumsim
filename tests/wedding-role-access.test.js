import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'
import { SITE_MEDIA_LIMITS } from '../src/site-media-config.js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const siteConfig = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Eventos', 'Galeria de fotos'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Nosso convite', en: 'Our invitation', es: 'Nuestra invitación' }, siteGallery: ['a'.repeat(36)], guestCamera: { enabled: true, photoLimit: 200 } }
const publishedEvent = { id: 'event-published', name: 'Cerimônia', event_type: 'ceremony', starts_at: null, venue_name: 'Jardim', address: null, group_ids: [] }
const restrictedEvent = { id: 'event-restricted', name: 'Ensaio', event_type: 'rehearsal', starts_at: null, venue_name: 'Salão', address: null, group_ids: ['group-private'] }

function database(role, options = {}) {
  const eventDeletion = options.eventDeletion || {}
  return {
    prepare(query) {
      let parameters = []
      return {
        bind(...values) {
          parameters = values
          return this
        },
        async first() {
          if (query.includes('SELECT COUNT(*) AS total FROM gifts')) return { total: 0 }
          if (query.includes('SELECT id FROM events WHERE id = ? AND wedding_id = ?')) return eventDeletion.exists === false ? null : { id: parameters[0] }
          if (query.includes('SELECT') && query.includes('FROM guest_rsvps WHERE event_id = ?')) return eventDeletion.relatedData || { rsvps: 0, checkins: 0, photos: 0, staff: 0 }
          if (query.includes('FROM auth_sessions s')) return { id: 'session-1', account_id: 'account-1', mfa_verified_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'editor@example.com', status: 'active', mfa_enabled_at: new Date().toISOString() }
          if (query.includes('SELECT id, role FROM wedding_memberships')) return options.teamMember || null
          if (query.includes('SELECT slug, site_published_at FROM weddings')) return options.weddingProfile || { slug: 'ana-bia', site_published_at: null }
          if (query.includes('FROM wedding_memberships m JOIN weddings w')) {
            const allowedRoles = parameters.slice(2)
            return allowedRoles.includes(role) ? { id: 'membership-1', role, wedding_status: 'active' } : null
          }
          if (query.includes('FROM events e JOIN wedding_memberships m')) {
            const allowedRoles = parameters.slice(2)
            return parameters[0] === 'event-1' && allowedRoles.includes(role) ? { event_id: 'event-1', wedding_id: 'wedding-1', membership_id: 'membership-1', role } : null
          }
          if (query.includes('SELECT g.id, g.name, 1 AS party_size') && query.includes('WHERE g.access_token_hash = ?')) return options.scanGuest || null
          if (query.includes('SELECT g.id, COALESCE(r.status, g.rsvp_status) AS rsvp_status FROM guests g')) return options.visibleGuest || null
          if (query.includes('SELECT checked_in_at FROM check_ins WHERE wedding_id = ? AND event_id = ? AND guest_id = ?')) return options.existingCheckIn || null
          if (query.includes('FROM guests g JOIN weddings w')) return { id: 'guest-1', wedding_id: 'wedding-1', group_id: 'group-1', name: 'Convidada', party_size: 2, guest_type: role === 'godparent' ? 'godparent' : 'guest', photo_consent_at: options.photoConsentAt === null ? null : '2026-10-17T12:00:00.000Z', partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', timezone: 'America/Sao_Paulo', wedding_status: 'active', published_site_config_json: JSON.stringify(options.invitationConfig || (options.guestPhotoLimit === undefined ? siteConfig : { ...siteConfig, guestCamera: { enabled: true, photoLimit: options.guestPhotoLimit } })), published_events_json: JSON.stringify([publishedEvent]) }
          if (query.includes('SELECT published_events_json FROM weddings')) return { published_events_json: JSON.stringify([publishedEvent]) }
          if (query.includes('SELECT COUNT(*) AS total FROM guest_photos')) return { total: options.guestPhotoCount || 0 }
          if (query.includes('SELECT site_config_json, published_site_config_json')) return { site_config_json: JSON.stringify(options.draftConfig || siteConfig), published_site_config_json: JSON.stringify(options.publishedConfig || siteConfig), site_published_at: '2026-10-14T12:00:00.000Z' }
          if (query.includes('SELECT slug,') && query.includes('published_site_config_json')) return { slug: 'casal-teste', partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', event_time: '16:00', published_site_config_json: JSON.stringify(siteConfig), published_events_json: JSON.stringify([publishedEvent, restrictedEvent]), site_published_at: '2026-10-14T12:00:00.000Z' }
          if (query.includes('SELECT COUNT(*) AS total FROM events')) return { total: 0 }
          return null
        },
        async all() {
          if (query.includes('SELECT w.id FROM weddings w JOIN wedding_memberships')) return { results: ['couple_admin', 'editor', 'reader'].includes(role) ? [{ id: 'wedding-1' }] : [] }
          if (query.includes('SELECT id FROM events WHERE wedding_id = ? AND id IN')) return { results: parameters.slice(1).map((id) => ({ id })) }
          if (query.includes('SELECT g.id, g.name') && !query.includes('LEFT JOIN')) return { results: [{ id: 'guest-1', name: 'Convidada' }] }
          if (query.includes('FROM godparent_tasks')) return { results: [{ id: 'task-1', title: 'Levar as alianças', details: '', due_at: null, status: 'open' }] }
          if (query.includes('FROM guests g') && query.includes('LEFT JOIN guest_rsvps')) return { results: [{ id: 'guest-1', name: 'Convidada', party_size: 1, rsvp_status: 'confirmed', checked_in_at: null }] }
          return { results: [] }
        },
        async run() {
          if (query.includes('UPDATE weddings SET partner_one_name') && options.profileCapture) options.profileCapture.parameters = parameters
          if (options.failGuestPhotoInsert && query.includes('INSERT INTO guest_photos')) throw new Error('test insert failure')
          if (query.includes('INSERT INTO guest_photos') && options.guestPhotoCount >= parameters.at(-1)) return { meta: { changes: 0 } }
          return { meta: { changes: 1 } }
        },
      }
    },
    async batch() {
      return eventDeletion.results || [{ meta: { changes: 1 } }, { meta: { changes: 1 } }]
    },
  }
}

async function call(path, role, { method = 'GET', body, formData, headers = {}, env = {}, databaseOptions = {}, eventDeletion = {} } = {}) {
  const request = new Request(`${origin}${path}`, {
    method,
    headers: { Cookie: '__Host-wedding-session=test-session', Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: formData || (body ? JSON.stringify(body) : undefined),
  })
  return onRequest({ request, env: { DB: database(role, { ...databaseOptions, eventDeletion }), ...env } })
}

function memoryBucket({ failPut = false } = {}) {
  const objects = new Map()
  return {
    objects,
    async list({ prefix }) {
      return { objects: [...objects.entries()].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => ({ key, size: value.bytes.length, customMetadata: value.options.customMetadata, httpMetadata: value.options.httpMetadata })) }
    },
    async put(key, body, options) {
      if (failPut) throw new Error('test storage failure')
      objects.set(key, { bytes: new Uint8Array(body), options })
    },
    async get(key) {
      const value = objects.get(key)
      return value ? { body: new Blob([value.bytes]).stream(), httpMetadata: value.options.httpMetadata, customMetadata: value.options.customMetadata } : null
    },
    async delete(key) {
      for (const item of Array.isArray(key) ? key : [key]) objects.delete(item)
    },
  }
}

function uploadForm(name, type, bytes, mediaType) {
  const body = new FormData()
  body.set('file', new File([Uint8Array.from(bytes)], name, { type }))
  body.set('mediaType', mediaType)
  return body
}

test('editors can access drafts and update events', async () => {
  const site = await call('/api/couple/weddings/wedding-1/site-config', 'editor')
  const event = await call('/api/couple/weddings/wedding-1/events', 'editor', { method: 'POST', body: { name: 'Recepção', eventType: 'reception' } })
  assert.equal(site.status, 200)
  assert.ok((await site.json()).draft)
  assert.equal(event.status, 201)
})

test('site draft profile autosave accepts missing names without replacing its temporary slug', async () => {
  const profileCapture = {}
  const databaseOptions = { weddingProfile: { slug: 'rascunho-12345678', site_published_at: null }, profileCapture }
  const response = await call('/api/couple/weddings/wedding-1/profile', 'editor', {
    method: 'PATCH',
    body: { partnerOneName: 'Ana', partnerTwoName: '', eventDate: '2027-05-10', eventTime: null },
    databaseOptions,
  })
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.wedding.partner_one_name, 'Ana')
  assert.equal(result.wedding.partner_two_name, null)
  assert.equal(profileCapture.parameters[4], 'rascunho-12345678')
})

test('couple site config saves independent cover framing, image descriptions, display, and custom accent choices', async () => {
  const config = { ...siteConfig, siteGallery: [], customAccent: '#be6f52', coverComposition: 'editorial', coverTextAlign: 'center', coverTextPosition: 'bottom', coverOverlayOpacity: 62, coverImagePosition: 'top', coverImagePositionDesktop: 'bottom', coverImagePositionMobile: 'left', imageAltTexts: { ['a'.repeat(36)]: { 'pt-BR': 'O casal caminhando no jardim.' } }, giftDisplayMode: 'page', pixDisplayMode: 'page', pix: { enabled: true, key: 'chave-pix', holderName: 'Ana e Bia' } }
  const response = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', { method: 'PUT', body: config })
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.draft.coverComposition, 'editorial')
  assert.equal(result.draft.coverTextAlign, 'center')
  assert.equal(result.draft.coverTextPosition, 'bottom')
  assert.equal(result.draft.coverOverlayOpacity, 62)
  assert.equal(result.draft.coverImagePosition, 'bottom')
  assert.equal(result.draft.coverImagePositionDesktop, 'bottom')
  assert.equal(result.draft.coverImagePositionMobile, 'left')
  assert.deepEqual(result.draft.imageAltTexts, { ['a'.repeat(36)]: { 'pt-BR': 'O casal caminhando no jardim.' } })
  assert.equal(result.draft.customAccent, '#be6f52')
  assert.equal(result.draft.giftDisplayMode, 'page')
  assert.equal(result.draft.pixDisplayMode, 'page')
  assert.equal(result.draft.pix.key, 'chave-pix')
})

test('couple site config rejects invalid cover and display choices', async () => {
  for (const invalid of [
    { coverComposition: 'freeform' },
    { coverTextAlign: 'justify' },
    { coverTextPosition: 'freeform' },
    { coverOverlayOpacity: 90 },
    { coverImagePosition: 'random' },
    { coverImagePositionDesktop: 'random' },
    { coverImagePositionMobile: 'random' },
    { imageAltTexts: { invalid: { 'pt-BR': 'Descrição' } } },
    { imageAltTexts: { ['a'.repeat(36)]: { en: 'Description' } } },
    { imageAltTexts: { ['a'.repeat(36)]: { 'pt-BR': 'x'.repeat(251) } } },
    { customAccent: 'green' },
    { customAccent: '#gggggg' },
    { sectionLayouts: { Eventos: 'unbounded' } },
    { sectionLayouts: { 'Secao livre': 'classic' } },
    { giftDisplayMode: 'external' },
    { pixDisplayMode: 'external' },
    { enabledSections: ['Playlist'], sectionContent: { Playlist: { 'pt-BR': { body: 'http://example.com/playlist' } } } },
    { enabledSections: ['Vídeo'], sectionContent: { 'Vídeo': { 'pt-BR': { body: 'javascript:alert(1)' } } } },
  ]) {
    const response = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', { method: 'PUT', body: { ...siteConfig, ...invalid } })
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'invalid_site_config' })
  }
})

test('couple site config accepts curated layout choices for active site sections', async () => {
  const sectionLayouts = { Eventos: 'framed', 'Nossa história': 'compact' }
  const response = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', {
    method: 'PUT',
    body: { ...siteConfig, siteGallery: [], sectionLayouts },
  })
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).draft.sectionLayouts, sectionLayouts)
})

test('couple site config accepts HTTPS links for playlist and video sections', async () => {
  const sectionContent = {
    Playlist: { 'pt-BR': { title: 'Nossa trilha', body: 'https://example.com/playlist' } },
    'Vídeo': { 'pt-BR': { title: 'Uma lembrança', body: 'https://example.com/video' } },
  }
  const response = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', {
    method: 'PUT',
    body: { ...siteConfig, siteGallery: [], enabledSections: ['Playlist', 'Vídeo'], sectionContent },
  })
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(result.draft.sectionContent, sectionContent)
})

test('couple site config saves the chosen public godparent profiles and rejects oversized entries', async () => {
  const godparents = [{ id: '22222222-2222-4222-8222-222222222222', name: 'Joana e Paulo', message: 'Nossos amigos queridos.', photoId: 'a'.repeat(36) }]
  const bucket = { async get(key) { return key.endsWith('.jpg') ? { customMetadata: { weddingId: 'wedding-1' } } : null } }
  const response = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', { method: 'PUT', body: { ...siteConfig, godparents }, env: { GUEST_PHOTOS: bucket } })
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).draft.godparents, godparents)
  const invalidResponse = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', { method: 'PUT', body: { ...siteConfig, godparents: [{ ...godparents[0], message: 'x'.repeat(1201) }] }, env: { GUEST_PHOTOS: bucket } })
  assert.equal(invalidResponse.status, 400)
})

test('couple can save a HTTPS store link for a physical gift', async () => {
  const response = await call('/api/couple/weddings/wedding-1/gifts', 'couple_admin', {
    method: 'POST',
    body: { title: 'Vasos de cerâmica', description: 'Conjunto para a casa', giftType: 'fixed', fulfillmentType: 'store_link', storeUrl: 'https://loja.example/produtos/vasos', amountCents: 15990 },
  })
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(result.gift.fulfillment_type, 'store_link')
  assert.equal(result.gift.store_url, 'https://loja.example/produtos/vasos')
})

test('couple gift links reject non-HTTPS destinations', async () => {
  const response = await call('/api/couple/weddings/wedding-1/gifts', 'couple_admin', {
    method: 'POST',
    body: { title: 'Vaso', giftType: 'fixed', fulfillmentType: 'store_link', storeUrl: 'http://loja.example/produtos/vaso', amountCents: 15990 },
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'invalid_store_url' })
})

test('editors can delete an event with no linked records', async () => {
  const response = await call('/api/couple/weddings/wedding-1/events/event-1', 'editor', { method: 'DELETE' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { deleted: true })
})

test('event deletion is blocked when attendance data is linked', async () => {
  const response = await call('/api/couple/weddings/wedding-1/events/event-1', 'editor', {
    method: 'DELETE',
    eventDeletion: { results: [{ meta: { changes: 0 } }, { meta: { changes: 0 } }], relatedData: { rsvps: 2, checkins: 1, photos: 0, staff: 0 } },
  })
  assert.equal(response.status, 409)
  assert.deepEqual(await response.json(), { error: 'event_has_related_data', relatedData: { rsvps: 2, checkins: 1, photos: 0, staff: 0 } })
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
    '/api/couple/weddings/wedding-1/wall-messages',
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

test('only couple admins can approve public wall messages', async () => {
  const blocked = await call('/api/couple/weddings/wedding-1/wall-messages/wall-1', 'reader', { method: 'PATCH', body: { status: 'approved' } })
  const approved = await call('/api/couple/weddings/wedding-1/wall-messages/wall-1', 'couple_admin', { method: 'PATCH', body: { status: 'approved' } })
  assert.equal(blocked.status, 404)
  assert.equal(approved.status, 200)
  assert.deepEqual(await approved.json(), { id: 'wall-1', status: 'approved' })
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

test('couple admins create individual entry staff invitations limited to selected events', async () => {
  const eventId = '123e4567-e89b-42d3-a456-426614174000'
  const response = await call('/api/couple/weddings/wedding-1/members/team-invitations', 'couple_admin', {
    method: 'POST',
    body: { name: 'Joana Silva', email: 'joana@example.com', profession: 'seguranca', eventIds: [eventId] },
  })
  const result = await response.json()
  assert.equal(response.status, 201)
  assert.equal(result.name, 'Joana Silva')
  assert.equal(result.role, 'checkin_staff')
  assert.equal(result.profession, 'seguranca')
  assert.equal(result.status, 'pending')
  assert.match(result.invitationUrl, /#aceitar-equipe\//)
})

test('event staff cannot access couple membership management', async () => {
  const list = await call('/api/couple/weddings', 'checkin_staff')
  const invitation = await call('/api/couple/weddings/wedding-1/members/team-invitations', 'checkin_staff', {
    method: 'POST',
    body: { name: 'Joana Silva', email: 'joana@example.com', profession: 'seguranca', eventIds: ['123e4567-e89b-42d3-a456-426614174000'] },
  })
  assert.deepEqual(await list.json(), { weddings: [] })
  assert.equal(invitation.status, 404)
})

test('couple admins can delete only professional team memberships', async () => {
  const response = await call('/api/couple/weddings/wedding-1/members/member-1', 'couple_admin', {
    method: 'DELETE',
    databaseOptions: { teamMember: { id: 'member-1', role: 'checkin_staff' } },
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: 'member-1', deleted: true })
})

test('event staff cannot scan entry QR codes', async () => {
  const response = await call('/api/staff/events/event-1/scan', 'event_staff', {
    method: 'POST',
    body: { token: 'a'.repeat(43) },
  })
  assert.equal(response.status, 404)
})

test('entry QR scan records a confirmed guest once for the assigned event', async () => {
  const response = await call('/api/staff/events/event-1/scan', 'checkin_staff', {
    method: 'POST',
    body: { token: 'a'.repeat(43) },
    databaseOptions: {
      scanGuest: { id: 'guest-1', name: 'Convidada', party_size: 3, rsvp_status: 'confirmed' },
      visibleGuest: { id: 'guest-1', rsvp_status: 'confirmed' },
    },
  })
  const result = await response.json()
  assert.equal(response.status, 201)
  assert.equal(result.checkedIn, true)
  assert.equal(result.guest.name, 'Convidada')
  assert.equal(result.guest.partySize, 1)
})

test('entry QR scan rejects an unconfirmed or previously used invitation', async () => {
  const unconfirmed = await call('/api/staff/events/event-1/scan', 'checkin_staff', {
    method: 'POST',
    body: { token: 'a'.repeat(43) },
    databaseOptions: {
      scanGuest: { id: 'guest-1', name: 'Convidada', rsvp_status: 'pending' },
      visibleGuest: { id: 'guest-1', rsvp_status: 'pending' },
    },
  })
  const duplicate = await call('/api/staff/events/event-1/scan', 'checkin_staff', {
    method: 'POST',
    body: { token: 'a'.repeat(43) },
    databaseOptions: {
      scanGuest: { id: 'guest-1', name: 'Convidada', rsvp_status: 'confirmed' },
      visibleGuest: { id: 'guest-1', rsvp_status: 'confirmed' },
      existingCheckIn: { checked_in_at: '2026-10-18 12:00:00' },
    },
  })
  assert.equal(unconfirmed.status, 409)
  assert.deepEqual(await unconfirmed.json(), { error: 'invitation_not_confirmed' })
  assert.equal(duplicate.status, 409)
  assert.deepEqual(await duplicate.json(), { error: 'already_checked_in', checkedInAt: '2026-10-18 12:00:00' })
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

test('site photo deletion refuses a photo still selected in the site gallery', async () => {
  const id = '11111111-1111-4111-8111-111111111111'
  let deleted = false
  const response = await call(`/api/couple/weddings/wedding-1/site-media/${id}`, 'couple_admin', {
    method: 'DELETE',
    databaseOptions: { draftConfig: { ...siteConfig, siteGallery: [id] }, publishedConfig: { ...siteConfig, siteGallery: [] } },
    env: { GUEST_PHOTOS: { async get() { return { customMetadata: { weddingId: 'wedding-1' } } }, async delete() { deleted = true } } },
  })
  assert.equal(response.status, 409)
  assert.equal((await response.json()).error, 'site_media_in_use')
  assert.equal(deleted, false)
})

test('authorized photo deletion removes only that wedding file and readers cannot delete it', async () => {
  const id = '22222222-2222-4222-8222-222222222222'
  const deletedKeys = []
  const bucket = { async get(key) { return key.endsWith(`${id}.jpg`) ? { customMetadata: { weddingId: 'wedding-1' } } : null }, async delete(key) { deletedKeys.push(key) } }
  const allowed = await call(`/api/couple/weddings/wedding-1/site-media/${id}`, 'couple_admin', { method: 'DELETE', databaseOptions: { draftConfig: {}, publishedConfig: {} }, env: { GUEST_PHOTOS: bucket } })
  const denied = await call(`/api/couple/weddings/wedding-1/site-media/${id}`, 'reader', { method: 'DELETE', databaseOptions: { draftConfig: {}, publishedConfig: {} }, env: { GUEST_PHOTOS: bucket } })
  assert.equal(allowed.status, 200)
  assert.deepEqual(deletedKeys, [`wedding-1/site/${id}.jpg`])
  assert.equal(denied.status, 404)
})

test('public invitation only exposes the enabled Pix key and titular', async () => {
  const token = 'a'.repeat(43)
  const enabled = { ...siteConfig, enabledSections: ['Lista de presentes'], pix: { enabled: true, key: 'pix@example.com', holderName: 'Ana Silva' } }
  const visible = await call('/api/invitation', 'guest', { headers: { Authorization: `Bearer ${token}` }, databaseOptions: { invitationConfig: enabled } })
  const hidden = await call('/api/invitation', 'guest', { headers: { Authorization: `Bearer ${token}` }, databaseOptions: { invitationConfig: { ...enabled, pix: { ...enabled.pix, enabled: false } } } })
  assert.equal(visible.status, 200)
  assert.deepEqual((await visible.json()).siteConfig.pix, enabled.pix)
  assert.deepEqual((await hidden.json()).siteConfig.pix, { enabled: false, key: '', holderName: '' })
})

test('couple photo and video uploads persist supported media in object storage', async () => {
  const bucket = memoryBucket()
  const imageFiles = [
    ['cover.jpg', 'image/jpeg', [255, 216, 255]],
    ['site.png', 'image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['gallery.webp', 'image/webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
  ]
  const imageIds = []
  for (const [name, type, bytes] of imageFiles) {
    const response = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: uploadForm(name, type, bytes, 'image'), env: { GUEST_PHOTOS: bucket } })
    assert.equal(response.status, 201, name)
    const result = await response.json()
    assert.equal(result.mediaType, 'image')
    imageIds.push(result.id)
  }
  for (let index = 0; index < SITE_MEDIA_LIMITS.photosPerWedding - imageFiles.length; index += 1) {
    const response = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: uploadForm(`extra-${index}.jpg`, 'image/jpeg', [255, 216, 255], 'image'), env: { GUEST_PHOTOS: bucket } })
    assert.equal(response.status, 201)
    imageIds.push((await response.json()).id)
  }
  const overLimit = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: uploadForm('ninth.jpg', 'image/jpeg', [255, 216, 255], 'image'), env: { GUEST_PHOTOS: bucket } })
  assert.equal(overLimit.status, 409)
  assert.equal((await overLimit.json()).error, 'gallery_limit_reached')
  assert.equal(bucket.objects.size, SITE_MEDIA_LIMITS.photosPerWedding)

  const videoBytes = new Uint8Array(16)
  videoBytes.set([102, 116, 121, 112], 4)
  const video = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: uploadForm('opening.mp4', 'video/mp4', videoBytes, 'video'), env: { GUEST_PHOTOS: bucket } })
  assert.equal(video.status, 201)
  const videoResult = await video.json()
  assert.equal(videoResult.mediaType, 'video')
  const secondVideo = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: uploadForm('second.mp4', 'video/mp4', videoBytes, 'video'), env: { GUEST_PHOTOS: bucket } })
  assert.equal(secondVideo.status, 409)
  assert.equal((await secondVideo.json()).error, 'video_limit_reached')

  const config = { ...siteConfig, coverLayout: 'full', coverPhotoId: imageIds[0], coverCarouselEnabled: true, coverGallery: imageIds, siteGallery: [imageIds[2]], coverVideoId: videoResult.id, enabledSections: [...siteConfig.enabledSections, 'Linha do tempo', 'Contagem regressiva'], timeline: [{ id: '22222222-2222-4222-8222-222222222222', title: 'Onde nos conhecemos', date: '2020-02-14', description: 'Foi em uma festa de amigos.', photoId: imageIds[1] }], giftPresentation: { '33333333-3333-4333-8333-333333333333': { category: 'Experiências', photoId: imageIds[2] } } }
  const savedConfig = await call('/api/couple/weddings/wedding-1/site-config', 'couple_admin', { method: 'PUT', body: config, env: { GUEST_PHOTOS: bucket } })
  assert.equal(savedConfig.status, 200)
  const savedDraft = (await savedConfig.json()).draft
  assert.equal(savedDraft.coverVideoId, videoResult.id)
  assert.deepEqual(savedDraft.timeline, config.timeline)
  assert.deepEqual(savedDraft.giftPresentation, config.giftPresentation)
  const readBack = await call(`/api/site-media/${videoResult.id}`, 'couple_admin', { env: { GUEST_PHOTOS: bucket } })
  assert.equal(readBack.status, 200)
  assert.equal(readBack.headers.get('Content-Type'), 'video/mp4')
  assert.equal((await readBack.arrayBuffer()).byteLength, videoBytes.byteLength)
})

test('couple file uploads reject unsupported, forged, and oversized files', async () => {
  const bucket = memoryBucket()
  const cases = [
    { form: uploadForm('photo.gif', 'image/gif', [71, 73, 70, 56], 'image'), status: 400, error: 'unsupported_media_type' },
    { form: uploadForm('photo.jpg', 'image/jpeg', [0, 0, 0, 0], 'image'), status: 400, error: 'invalid_media_content' },
    { form: uploadForm('opening.mp4', 'video/mp4', [0, 0, 0, 0, 0, 0, 0, 0], 'video'), status: 400, error: 'invalid_media_content' },
  ]
  for (const item of cases) {
    const response = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: item.form, env: { GUEST_PHOTOS: bucket } })
    assert.equal(response.status, item.status)
    assert.equal((await response.json()).error, item.error)
  }
  const huge = new File([new Uint8Array(8_388_609)], 'large.webp', { type: 'image/webp' })
  const body = new FormData()
  body.set('file', huge)
  body.set('mediaType', 'image')
  const oversized = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: body, env: { GUEST_PHOTOS: bucket } })
  assert.equal(oversized.status, 413)
  assert.equal((await oversized.json()).error, 'invalid_media_size')
  const oversizedVideo = new File([new Uint8Array(15_728_641)], 'large.mp4', { type: 'video/mp4' })
  const videoBody = new FormData()
  videoBody.set('file', oversizedVideo)
  videoBody.set('mediaType', 'video')
  const oversizedVideoResponse = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: videoBody, env: { GUEST_PHOTOS: bucket } })
  assert.equal(oversizedVideoResponse.status, 413)
  assert.equal((await oversizedVideoResponse.json()).error, 'invalid_media_size')
  assert.equal(bucket.objects.size, 0)
})

test('couple uploads report an R2 write failure as a retryable storage response', async () => {
  const originalError = console.error
  console.error = () => {}
  try {
    const response = await call('/api/couple/weddings/wedding-1/site-media', 'couple_admin', { method: 'POST', formData: uploadForm('cover.webp', 'image/webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80], 'image'), env: { GUEST_PHOTOS: memoryBucket({ failPut: true }) } })
    assert.equal(response.status, 503)
    assert.equal((await response.json()).error, 'media_storage_write_failed')
  } finally {
    console.error = originalError
  }
})

test('guest camera photos save with event access and remove the object if the D1 save fails', async () => {
  const bucket = memoryBucket()
  const token = 'a'.repeat(43)
  const headers = { Authorization: `Bearer ${token}` }
  const guestImages = [
    ['moment.jpg', 'image/jpeg', [255, 216, 255]],
    ['moment.png', 'image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['moment.webp', 'image/webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
  ]
  for (const [name, type, bytes] of guestImages) {
    const body = new FormData()
    body.set('photo', new File([Uint8Array.from(bytes)], name, { type }))
    body.set('eventId', publishedEvent.id)
    const saved = await call('/api/invitation/photos', 'guest', { method: 'POST', formData: body, headers, env: { GUEST_PHOTOS: bucket } })
    assert.equal(saved.status, 201, name)
    assert.equal((await saved.json()).saved, true)
  }
  assert.equal(bucket.objects.size, 3)

  const failingBucket = memoryBucket()
  const failedBody = new FormData()
  failedBody.set('photo', new File([Uint8Array.from([255, 216, 255])], 'moment.jpg', { type: 'image/jpeg' }))
  failedBody.set('eventId', publishedEvent.id)
  const failed = await call('/api/invitation/photos', 'guest', { method: 'POST', formData: failedBody, headers, env: { GUEST_PHOTOS: failingBucket }, databaseOptions: { failGuestPhotoInsert: true } })
  assert.equal(failed.status, 500)
  assert.equal((await failed.json()).error, 'photo_save_failed')
  assert.equal(failingBucket.objects.size, 0)
})

test('guest camera uses a shared wedding album cap and requires one-time consent before automatic uploads', async () => {
  const token = 'a'.repeat(43)
  const headers = { Authorization: `Bearer ${token}` }
  const status = await call('/api/invitation/photos', 'guest', { headers, databaseOptions: { guestPhotoCount: 199 } })
  assert.equal(status.status, 200)
  assert.deepEqual(await status.json(), { saved: 199, limit: 200, remaining: 1, consented: true })

  const maximumStatus = await call('/api/invitation/photos', 'guest', { headers, databaseOptions: { guestPhotoCount: 299, guestPhotoLimit: 300 } })
  assert.equal(maximumStatus.status, 200)
  assert.deepEqual(await maximumStatus.json(), { saved: 299, limit: 300, remaining: 1, consented: true })

  const customStatus = await call('/api/invitation/photos', 'guest', { headers, databaseOptions: { guestPhotoCount: 0, guestPhotoLimit: 1 } })
  assert.equal(customStatus.status, 200)
  assert.deepEqual(await customStatus.json(), { saved: 0, limit: 1, remaining: 1, consented: true })

  const body = new FormData()
  body.set('photo', new File([Uint8Array.from([255, 216, 255])], 'moment.jpg', { type: 'image/jpeg' }))
  body.set('eventId', publishedEvent.id)
  const bucket = memoryBucket()
  const capped = await call('/api/invitation/photos', 'guest', { method: 'POST', formData: body, headers, env: { GUEST_PHOTOS: bucket }, databaseOptions: { guestPhotoCount: 200 } })
  assert.equal(capped.status, 409)
  assert.equal((await capped.json()).error, 'photo_limit_reached')
  assert.equal(bucket.objects.size, 0)

  const noConsentBucket = memoryBucket()
  const noConsent = await call('/api/invitation/photos', 'guest', { method: 'POST', formData: body, headers, env: { GUEST_PHOTOS: noConsentBucket }, databaseOptions: { photoConsentAt: null } })
  assert.equal(noConsent.status, 403)
  assert.equal((await noConsent.json()).error, 'photo_consent_required')
  assert.equal(noConsentBucket.objects.size, 0)

  const accepted = await call('/api/invitation/photos/consent', 'guest', { method: 'POST', body: { accepted: true }, headers, databaseOptions: { photoConsentAt: null } })
  assert.equal(accepted.status, 200)
  assert.deepEqual(await accepted.json(), { consented: true })
})
