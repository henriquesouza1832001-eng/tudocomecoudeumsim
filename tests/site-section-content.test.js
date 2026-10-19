import assert from 'node:assert/strict'
import test from 'node:test'
import { getSiteSectionTitle, setSiteSectionTitle } from '../src/site-section-content.js'

test('site section titles fall back to the standard title when empty', () => {
  assert.equal(getSiteSectionTitle({ sectionContent: { Eventos: { 'pt-BR': { title: '   ' } } } }, 'Eventos', 'Esperamos vocês'), 'Esperamos vocês')
})

test('site section title updates preserve saved body content', () => {
  const config = { sectionContent: { Eventos: { 'pt-BR': { title: 'Festa', body: 'Endereço e horários' } } } }
  const updated = setSiteSectionTitle(config, 'Eventos', 'A celebração')
  assert.equal(getSiteSectionTitle(updated, 'Eventos', 'Esperamos vocês'), 'A celebração')
  assert.equal(updated.sectionContent.Eventos['pt-BR'].body, 'Endereço e horários')
})
