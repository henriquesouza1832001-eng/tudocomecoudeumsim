import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../src/worker.js'
import { weddingSlug } from '../src/wedding-host.js'

test('wedding hostname resolves only a valid subdomain of the configured base domain', () => {
  assert.equal(weddingSlug('ana-e-rafa.casamentos.com.br', 'casamentos.com.br'), 'ana-e-rafa')
  assert.equal(weddingSlug('casamentos.com.br', 'casamentos.com.br'), null)
  assert.equal(weddingSlug('www.casamentos.com.br', 'casamentos.com.br'), null)
  assert.equal(weddingSlug('ab.casamentos.com.br', 'casamentos.com.br'), null)
  assert.equal(weddingSlug('ana.casamentos.com.br.evil.test', 'casamentos.com.br'), null)
  assert.equal(weddingSlug('ana..casamentos.com.br', 'casamentos.com.br'), null)
  assert.equal(weddingSlug('ana.casamentos.com.br', ''), null)
})

test('public site lookup returns only events visible to every guest', async () => {
  const wedding = {
    id: 'wedding-id',
    slug: 'ana-e-rafa',
    partner_one_name: 'Ana',
    partner_two_name: 'Rafa',
    event_date: '2027-09-18',
    timezone: 'America/Sao_Paulo',
    published_site_config_json: JSON.stringify({ theme: 'garden' }),
    published_events_json: JSON.stringify([
      { id: 'public-event', name: 'Cerimônia', group_ids: [] },
      { id: 'private-event', name: 'Ensaio', group_ids: ['godparents'] },
    ]),
    site_published_at: '2026-10-17T00:00:00.000Z',
  }
  const env = {
    BASE_DOMAIN: 'casamentos.com.br',
    DB: { prepare: () => ({ bind: () => ({ first: async () => wedding }) }) },
    ASSETS: { fetch: async () => new Response('app') },
  }
  const response = await worker.fetch(new Request('https://ana-e-rafa.casamentos.com.br/api/public/site'), env, {})
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(body.events.map((event) => event.id), ['public-event'])
  assert.equal(body.wedding.slug, 'ana-e-rafa')
  assert.equal(body.siteConfig.theme, 'garden')
})

test('default domain resolves couple subdomains and www redirects to the apex', async () => {
  assert.equal(weddingSlug('ana-e-rafa.meualtar.date'), 'ana-e-rafa')
  assert.equal(weddingSlug('meualtar.date'), null)
  assert.equal(weddingSlug('www.meualtar.date'), null)
  assert.equal(weddingSlug('ana-e-rafa.tudocomecoudeumsim.pages.dev'), null)
  const response = await worker.fetch(new Request('https://www.meualtar.date/cadastro?x=1'), { BASE_DOMAIN: 'meualtar.date' }, {})
  assert.equal(response.status, 301)
  assert.equal(response.headers.get('Location'), 'https://meualtar.date/cadastro?x=1')
})
