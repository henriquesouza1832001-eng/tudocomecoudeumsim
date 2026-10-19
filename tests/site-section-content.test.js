import assert from 'node:assert/strict'
import test from 'node:test'
import { getSiteSectionTitle, safeHttpsLink, setSiteSectionBody, setSiteSectionTitle } from '../src/site-section-content.js'

test('site section titles fall back to the standard title when empty', () => {
  assert.equal(getSiteSectionTitle({ sectionContent: { Eventos: { 'pt-BR': { title: '   ' } } } }, 'Eventos', 'Esperamos vocês'), 'Esperamos vocês')
})

test('site section title updates preserve saved body content', () => {
  const config = { sectionContent: { Eventos: { 'pt-BR': { title: 'Festa', body: 'Endereço e horários' } } } }
  const updated = setSiteSectionTitle(config, 'Eventos', 'A celebração')
  assert.equal(getSiteSectionTitle(updated, 'Eventos', 'Esperamos vocês'), 'A celebração')
  assert.equal(updated.sectionContent.Eventos['pt-BR'].body, 'Endereço e horários')
})

test('site section body updates preserve the chosen title', () => {
  const config = { sectionContent: { Contato: { 'pt-BR': { title: 'Falem conosco', body: 'Telefone antigo' } } } }
  const updated = setSiteSectionBody(config, 'Contato', 'Canal de contato')
  assert.equal(updated.sectionContent.Contato['pt-BR'].title, 'Falem conosco')
  assert.equal(updated.sectionContent.Contato['pt-BR'].body, 'Canal de contato')
})

test('playlist and video links accept only HTTPS destinations', () => {
  assert.equal(safeHttpsLink('https://example.com/lista'), 'https://example.com/lista')
  assert.equal(safeHttpsLink('http://example.com/lista'), '')
  assert.equal(safeHttpsLink('https://user:password@example.com/lista'), '')
  assert.equal(safeHttpsLink('javascript:alert(1)'), '')
  assert.equal(safeHttpsLink('not a URL'), '')
})
