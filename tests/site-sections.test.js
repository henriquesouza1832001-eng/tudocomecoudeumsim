import test from 'node:test'
import assert from 'node:assert/strict'
import { ORDERABLE_SITE_SECTIONS, moveSiteSection, orderedSiteSections, sortEventsByStartTime } from '../src/site-sections.js'

test('site section order follows the saved configuration and keeps enabled legacy carousels visible', () => {
  const config = { enabledSections: ['Eventos', 'Nossa história'], siteCarouselEnabled: true }
  const ordered = orderedSiteSections(config)
  assert.deepEqual(ordered, ['Eventos', 'Nossa história', 'Galeria de fotos'])
  assert.deepEqual(moveSiteSection(ordered, 'Galeria de fotos', -1), ['Eventos', 'Galeria de fotos', 'Nossa história'])
})

test('couple section controls reorder rendered sections without dropping other saved sections', () => {
  const initial = ['Eventos', 'Cronograma', 'Nossa história', 'Confirmação de presença']
  assert.deepEqual(moveSiteSection(initial, 'Eventos', 1), ['Cronograma', 'Eventos', 'Nossa história', 'Confirmação de presença'])
  assert.deepEqual(moveSiteSection(initial, 'Nossa história', 1), ['Eventos', 'Cronograma', 'Confirmação de presença', 'Nossa história'])
})

test('gifts and RSVP can be ordered with the existing invitation sections', () => {
  const config = { enabledSections: ['Eventos', 'Confirmação de presença'], giftDisplayMode: 'inline' }
  const ordered = orderedSiteSections(config)
  assert.deepEqual(ordered, ['Eventos', 'Confirmação de presença', 'Lista de presentes'])
  assert.deepEqual(moveSiteSection(ordered, 'Lista de presentes', -1), ['Eventos', 'Lista de presentes', 'Confirmação de presença'])
  assert.deepEqual(orderedSiteSections({ enabledSections: ['Eventos'], giftDisplayMode: 'hidden' }), ['Eventos'])
})

test('dress code can be ordered as its own invitation section', () => {
  const config = { enabledSections: ['Eventos', 'Dress code', 'Confirmação de presença'] }
  assert.deepEqual(orderedSiteSections(config), ['Eventos', 'Dress code', 'Confirmação de presença'])
  assert.deepEqual(moveSiteSection(config.enabledSections, 'Dress code', -1), ['Dress code', 'Eventos', 'Confirmação de presença'])
})

test('day schedule can be enabled and ordered independently from event details', () => {
  const config = { enabledSections: ['Eventos', 'Cronograma', 'Dress code'] }
  assert.deepEqual(orderedSiteSections(config), ['Eventos', 'Cronograma', 'Dress code'])
  assert.deepEqual(moveSiteSection(config.enabledSections, 'Cronograma', 1), ['Eventos', 'Dress code', 'Cronograma'])
})

test('day schedule orders dated events first and keeps undated events at the end', () => {
  const events = [
    { id: 'late', starts_at: '2027-11-28T22:00:00.000Z' },
    { id: 'undated', starts_at: null },
    { id: 'early', starts_at: '2027-11-28T17:00:00.000Z' },
  ]
  assert.deepEqual(sortEventsByStartTime(events).map((event) => event.id), ['early', 'late', 'undated'])
})

test('editorial invitation sections can be activated and reordered', () => {
  const sections = ['Hospedagem e dicas', 'Perguntas frequentes', 'Playlist', 'Vídeo', 'Contato']
  assert.ok(sections.every((section) => ORDERABLE_SITE_SECTIONS.includes(section)))
  assert.deepEqual(moveSiteSection(sections, 'Playlist', -1), ['Hospedagem e dicas', 'Playlist', 'Perguntas frequentes', 'Vídeo', 'Contato'])
})

test('godparent profiles can be enabled and reordered with invitation sections', () => {
  const sections = ['Padrinhos e madrinhas', 'Eventos']
  assert.ok(sections.every((section) => ORDERABLE_SITE_SECTIONS.includes(section)))
  assert.deepEqual(moveSiteSection(sections, 'Eventos', -1), ['Eventos', 'Padrinhos e madrinhas'])
})
