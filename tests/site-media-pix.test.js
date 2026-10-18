import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const mediaId = '11111111-1111-4111-8111-111111111111'

function database({ role = 'couple_admin', draftConfig = {}, publishedConfig = {}, invitationConfig } = {}) {
  return {
    async batch(statements) {
      return Promise.all(statements.map((statement) => statement.run()))
    },
    prepare(query) {
      let parameters = []
      return {
        bind(...values) {
          parameters = values
          return this
        },
        async first() {
          if (query.includes('FROM auth_sessions s')) return { id: 'session-1', account_id: 'account-1', mfa_verified_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(), email: 'couple@example.com', status: 'active', mfa_enabled_at: new Date().toISOString() }
          if (query.includes('FROM wedding_memberships m JOIN weddings w')) return parameters.slice(2).includes(role) ? { id: 'membership-1', role, wedding_status: 'active' } : null
          if (query.includes('SELECT site_config_json, published_site_config_json FROM weddings')) return { site_config_json: JSON.stringify(draftConfig), published_site_config_json: JSON.stringify(publishedConfig) }
          if (query.includes('FROM guests g JOIN weddings w')) return { id: 'guest-1', wedding_id: 'wedding-1', group_id: null, name: 'Convidado', party_size: 1, guest_type: 'guest', partner_one_name: 'Ana', partner_two_name: 'Bia', event_date: '2027-05-10', event_time: null, timezone: 'America/Sao_Paulo', wedding_status: 'active', published_site_config_json: JSON.stringify(invitationConfig), published_events_json: '[]' }
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
  }
}

async function call(path, { method = 'GET', role, draftConfig, publishedConfig, invitationConfig, bucket, body } = {}) {
  const request = new Request(`${origin}${path}`, {
    method,
    headers: { Cookie: '__Host-wedding-session=test-session', Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(path === '/api/invitation' || path.startsWith('/api/site-media/') ? { Authorization: `Bearer ${'a'.repeat(40)}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return onRequest({ request, env: { DB: database({ role, draftConfig, publishedConfig, invitationConfig }), GUEST_PHOTOS: bucket } })
}

test('site media deletion refuses files referenced by draft or published invitations', async () => {
  let deleted = false
  const bucket = {
    async get() { return { customMetadata: { weddingId: 'wedding-1' } } },
    async delete() { deleted = true },
  }
  const response = await call(`/api/couple/weddings/wedding-1/site-media/${mediaId}`, {
    method: 'DELETE',
    draftConfig: { coverGallery: [mediaId], timeline: [{ id: '22222222-2222-4222-8222-222222222222', title: 'Marco', date: '', description: '', photoId: mediaId }], giftPresentation: { '33333333-3333-4333-8333-333333333333': { category: 'Experiências', photoId: mediaId } } },
    publishedConfig: { coverPhotoId: mediaId },
    bucket,
  })
  assert.equal(response.status, 409)
  assert.deepEqual(await response.json(), { error: 'site_media_in_use', references: ['rascunho: carrossel da capa', 'rascunho: linha do tempo', 'rascunho: foto de presente', 'convite publicado: foto principal da capa'] })
  assert.equal(deleted, false)
})

test('site media deletion recognizes invitation carousel photos as active content', async () => {
  const response = await call(`/api/couple/weddings/wedding-1/site-media/${mediaId}`, {
    method: 'DELETE',
    draftConfig: { siteCarouselPhotos: [mediaId] },
    publishedConfig: {},
    bucket: { async get() { return { customMetadata: { weddingId: 'wedding-1' } } }, async delete() {} },
  })
  assert.equal(response.status, 409)
  assert.deepEqual((await response.json()).references, ['rascunho: carrossel do convite'])
})

test('site media deletion removes only the unreferenced file in the authorized wedding', async () => {
  const deletedKeys = []
  const bucket = {
    async get(key) { return key.endsWith('.jpg') ? { customMetadata: { weddingId: 'wedding-1' } } : null },
    async delete(key) { deletedKeys.push(key) },
  }
  const response = await call(`/api/couple/weddings/wedding-1/site-media/${mediaId}`, {
    method: 'DELETE',
    draftConfig: {},
    publishedConfig: {},
    bucket,
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: mediaId, deleted: true })
  assert.deepEqual(deletedKeys, [`wedding-1/site/${mediaId}.jpg`])
})

test('members without couple or editor access cannot delete site media', async () => {
  let deleted = false
  const response = await call(`/api/couple/weddings/wedding-1/site-media/${mediaId}`, {
    method: 'DELETE',
    role: 'event_staff',
    bucket: { async delete() { deleted = true } },
  })
  assert.equal(response.status, 404)
  assert.equal(deleted, false)
})

test('site media deletion does not remove an object owned by another wedding', async () => {
  let deleted = false
  const response = await call(`/api/couple/weddings/wedding-1/site-media/${mediaId}`, {
    method: 'DELETE',
    draftConfig: {},
    publishedConfig: {},
    bucket: {
      async get() { return { customMetadata: { weddingId: 'wedding-2' } } },
      async delete() { deleted = true },
    },
  })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'media_not_found' })
  assert.equal(deleted, false)
})

test('public invitation hides a disabled Pix key', async () => {
  const config = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Lista de presentes'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Convite', en: 'Invitation', es: 'Invitación' }, pix: { enabled: false, key: 'segredo@example.com' }, shareMessage: 'Mensagem privada do casal' }
  const response = await call('/api/invitation', { invitationConfig: config })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.deepEqual(result.siteConfig.pix, { enabled: false, key: '', holderName: '' })
  assert.equal('shareMessage' in result.siteConfig, false)
})

test('couples can save a formatted invitation sharing message in the site draft', async () => {
  const message = 'Com carinho!\n\n\ud83d\udc95 Nomes do casal\n\n{{link}}'
  const config = {
    theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Eventos'], animationPreset: 'Elegante',
    fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Convite', en: 'Invitation', es: 'Invitación' },
    storyMessages: { 'pt-BR': '', en: '', es: '' }, shareMessage: message,
  }
  const response = await call('/api/couple/weddings/wedding-1/site-config', {
    method: 'PUT',
    body: config,
    bucket: { async get(key) { return key.endsWith('.jpg') ? { customMetadata: { weddingId: 'wedding-1' } } : null } },
  })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).draft.shareMessage, message)
})

test('couples can save ordered photos and autoplay settings for the invitation carousel', async () => {
  const photos = ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333']
  const config = {
    theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Eventos'], animationPreset: 'Elegante',
    fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Convite', en: 'Invitation', es: 'Invitación' },
    storyMessages: { 'pt-BR': '', en: '', es: '' }, siteCarouselEnabled: true, siteCarouselPhotos: photos, siteCarouselAutoplay: true,
  }
  const response = await call('/api/couple/weddings/wedding-1/site-config', {
    method: 'PUT',
    body: config,
    bucket: { async get(key) { return key.endsWith('.jpg') ? { customMetadata: { weddingId: 'wedding-1' } } : null } },
  })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.deepEqual(result.draft.siteCarouselPhotos, photos)
  assert.equal(result.draft.siteCarouselEnabled, true)
  assert.equal(result.draft.siteCarouselAutoplay, true)
})

test('public invitation reveals the Pix key when enabled independently of the gifts section', async () => {
  const baseConfig = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', enabledSections: ['Lista de presentes'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Convite', en: 'Invitation', es: 'Invitación' }, pix: { enabled: true, key: '  chave-copia-cola  ' } }
  const visible = await call('/api/invitation', { invitationConfig: baseConfig })
  assert.equal((await visible.json()).siteConfig.pix.key, 'chave-copia-cola')
  const visibleWithoutGifts = await call('/api/invitation', { invitationConfig: { ...baseConfig, enabledSections: [] } })
  assert.equal((await visibleWithoutGifts.json()).siteConfig.pix.key, 'chave-copia-cola')
  const hidden = await call('/api/invitation', { invitationConfig: { ...baseConfig, pix: { ...baseConfig.pix, enabled: false } } })
  assert.deepEqual((await hidden.json()).siteConfig.pix, { enabled: false, key: '', holderName: '' })
})

test('individual invitations can load photos referenced by the timeline and gift cards', async () => {
  const timelinePhotoId = '44444444-4444-4444-8444-444444444444'
  const giftPhotoId = '55555555-5555-4555-8555-555555555555'
  const invitationConfig = {
    theme: 'garden', paletteIndex: 0, coverLayout: 'full', animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR',
    enabledSections: ['Linha do tempo', 'Lista de presentes'],
    coverMessages: { 'pt-BR': 'Convite', en: 'Invitation', es: 'Invitación' },
    timeline: [{ id: '22222222-2222-4222-8222-222222222222', title: 'Primeiro encontro', date: '', description: '', photoId: timelinePhotoId }],
    giftPresentation: { '33333333-3333-4333-8333-333333333333': { category: 'Lua de mel', photoId: giftPhotoId } },
  }
  const response = await call(`/api/site-media/${timelinePhotoId}`, {
    invitationConfig,
    bucket: { async get(key) { return key.endsWith('.jpg') ? { body: new Uint8Array([1]), httpMetadata: { contentType: 'image/jpeg' } } : null } },
  })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'image/jpeg')
})
