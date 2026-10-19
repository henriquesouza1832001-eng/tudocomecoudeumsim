import test from 'node:test'
import assert from 'node:assert/strict'
import { checkSitePublication } from '../src/site-publication-check.js'

test('site publication blocks photos used in the invitation without accessible descriptions', () => {
  const result = checkSitePublication({
    coverPhotoId: 'cover',
    siteCarouselEnabled: true,
    siteCarouselPhotos: ['carousel'],
    imageAltTexts: { cover: { 'pt-BR': 'Casal no jardim' } },
  })
  assert.deepEqual(result.blockers, ['Preencha a descrição acessível de 1 foto(s) usada(s) no convite.'])
})

test('site publication warns about incomplete event details without blocking', () => {
  const result = checkSitePublication({ enabledSections: ['Eventos'] }, [{ address: '' }])
  assert.deepEqual(result.blockers, [])
  assert.deepEqual(result.warnings, ['Há evento sem endereço. Confira se os convidados terão como localizar o local.'])
})

test('photos outside active galleries do not create accessibility blockers', () => {
  const result = checkSitePublication({ siteCarouselEnabled: false, siteCarouselPhotos: ['unused'] })
  assert.deepEqual(result.blockers, [])
})
