import test from 'node:test'
import assert from 'node:assert/strict'
import { moveSiteSection, orderedSiteSections } from '../src/site-sections.js'

test('site section order follows the saved configuration and keeps enabled legacy carousels visible', () => {
  const config = { enabledSections: ['Eventos', 'Nossa história'], siteCarouselEnabled: true }
  const ordered = orderedSiteSections(config)
  assert.deepEqual(ordered, ['Eventos', 'Nossa história', 'Galeria de fotos'])
  assert.deepEqual(moveSiteSection(ordered, 'Galeria de fotos', -1), ['Eventos', 'Galeria de fotos', 'Nossa história'])
})

test('couple section controls reorder rendered sections without dropping other saved sections', () => {
  const initial = ['Eventos', 'Cronograma', 'Nossa história', 'Confirmação de presença']
  assert.deepEqual(moveSiteSection(initial, 'Eventos', 1), ['Nossa história', 'Cronograma', 'Eventos', 'Confirmação de presença'])
  assert.deepEqual(moveSiteSection(initial, 'Nossa história', 1), ['Eventos', 'Cronograma', 'Confirmação de presença', 'Nossa história'])
})

test('gifts and RSVP can be ordered with the existing invitation sections', () => {
  const config = { enabledSections: ['Eventos', 'Confirmação de presença'], giftDisplayMode: 'inline' }
  const ordered = orderedSiteSections(config)
  assert.deepEqual(ordered, ['Eventos', 'Confirmação de presença', 'Lista de presentes'])
  assert.deepEqual(moveSiteSection(ordered, 'Lista de presentes', -1), ['Eventos', 'Lista de presentes', 'Confirmação de presença'])
  assert.deepEqual(orderedSiteSections({ enabledSections: ['Eventos'], giftDisplayMode: 'hidden' }), ['Eventos'])
})
