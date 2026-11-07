import test from 'node:test'
import assert from 'node:assert/strict'
import { DECORATIVE_ALT, buildDefaultAltText, fillEmptyAltTexts, resolveImageAlt } from '../src/photo-alt.js'
import { checkSitePublication, missingPhotoAltIds } from '../src/site-publication-check.js'

test('decorative photos render an empty alt and count as described', () => {
  assert.equal(resolveImageAlt(DECORATIVE_ALT, 'Foto'), '')
  assert.equal(resolveImageAlt('  Casal no jardim ', 'Foto'), 'Casal no jardim')
  assert.equal(resolveImageAlt('', 'Foto'), 'Foto')
  const config = { coverPhotoId: 'a', imageAltTexts: { a: { 'pt-BR': DECORATIVE_ALT } } }
  assert.deepEqual(missingPhotoAltIds(config), [])
  assert.deepEqual(checkSitePublication(config).blockers, [])
})

test('pending list only counts used photos without description', () => {
  const config = { coverPhotoId: 'a', siteCarouselEnabled: true, siteCarouselPhotos: ['b'], siteGallery: ['b'], imageAltTexts: { a: { 'pt-BR': 'ok' }, unused: { 'pt-BR': '' } } }
  assert.deepEqual(missingPhotoAltIds(config), ['b'])
})

test('default description fills only empty fields and never uses file names', () => {
  const text = buildDefaultAltText('Foto do casal {nomeCasal}', 'Ana e Bia')
  assert.equal(text, 'Foto do casal Ana e Bia')
  assert.equal(buildDefaultAltText('IMG_2041.jpg', 'Ana e Bia'), '')
  const next = fillEmptyAltTexts({ a: { 'pt-BR': 'Escrita por mim' }, b: { 'pt-BR': '' } }, ['a', 'b', 'c'], text)
  assert.equal(next.a['pt-BR'], 'Escrita por mim')
  assert.equal(next.b['pt-BR'], text)
  assert.equal(next.c['pt-BR'], text)
})
