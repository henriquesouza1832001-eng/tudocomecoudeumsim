import test from 'node:test'
import assert from 'node:assert/strict'
import { moveSiteSection, orderedSiteSections } from '../src/site-sections.js'

test('site section order follows the saved configuration and keeps enabled legacy carousels visible', () => {
  assert.deepEqual(orderedSiteSections({ enabledSections: ['Eventos', 'Nossa história'], siteCarouselEnabled: true }), ['Eventos', 'Nossa história', 'Galeria de fotos'])
})

test('couple section controls reorder rendered sections without dropping other saved sections', () => {
  const initial = ['Eventos', 'Cronograma', 'Nossa história', 'Confirmação de presença']
  assert.deepEqual(moveSiteSection(initial, 'Eventos', 1), ['Nossa história', 'Cronograma', 'Eventos', 'Confirmação de presença'])
  assert.deepEqual(moveSiteSection(initial, 'Nossa história', 1), initial)
})
