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

test('site publication warns when an active dress code section has no content', () => {
  const result = checkSitePublication({ enabledSections: ['Dress code'], weddingDetails: { dressCode: '  ' } })
  assert.deepEqual(result.warnings, ['A seção Dress code está ativa, mas ainda não tem orientação de traje.'])
})

test('site publication warns when the day schedule has no events or event times', () => {
  const empty = checkSitePublication({ enabledSections: ['Cronograma'] }, [])
  assert.deepEqual(empty.warnings, ['O cronograma está ativo, mas ainda não há eventos cadastrados.'])
  const missingTimes = checkSitePublication({ enabledSections: ['Cronograma'] }, [{ starts_at: null }])
  assert.deepEqual(missingTimes.warnings, ['Há evento sem data e horário para mostrar no cronograma.'])
})

test('site publication warns when enabled story, timeline, or gallery sections are empty', () => {
  const result = checkSitePublication({
    enabledSections: ['Nossa história', 'Linha do tempo', 'Galeria de fotos'],
    storyMessages: { 'pt-BR': '   ' },
    timeline: [{ title: '' }],
    siteGallery: [],
  })
  assert.deepEqual(result.warnings, [
    'A seção Nossa história está ativa, mas ainda não tem texto.',
    'A seção Linha do tempo está ativa, mas ainda não tem marcos preenchidos.',
    'A seção de galeria está ativa, mas ainda não tem fotos selecionadas.',
  ])
})

test('photos in disabled sections do not create accessibility blockers', () => {
  const result = checkSitePublication({
    enabledSections: ['Eventos'],
    siteGallery: ['unused-gallery-photo'],
    siteCarouselEnabled: false,
    siteCarouselPhotos: ['unused-carousel-photo'],
    timeline: [{ photoId: 'unused-timeline-photo' }],
    giftDisplayMode: 'hidden',
    giftPresentation: { item: { photoId: 'unused-gift-photo' } },
  })
  assert.deepEqual(result.blockers, [])
})

test('site publication warns when editorial sections lack their required content', () => {
  const result = checkSitePublication({
    enabledSections: ['Hospedagem e dicas', 'Perguntas frequentes', 'Playlist', 'Vídeo', 'Contato'],
    sectionContent: {},
  })
  assert.deepEqual(result.warnings, [
    'A seção Hospedagem e dicas está ativa, mas ainda não tem conteúdo.',
    'A seção Perguntas frequentes está ativa, mas ainda não tem conteúdo.',
    'A seção Contato está ativa, mas ainda não tem conteúdo.',
    'A seção Playlist está ativa, mas precisa de um link HTTPS válido.',
    'A seção Vídeo está ativa, mas precisa de um vídeo enviado ou de um link HTTPS válido.',
  ])
})

test('site publication accepts HTTPS playlist and video links', () => {
  const result = checkSitePublication({
    enabledSections: ['Playlist', 'Vídeo'],
    sectionContent: {
      Playlist: { 'pt-BR': { body: 'https://example.com/playlist' } },
      'Vídeo': { 'pt-BR': { body: 'https://example.com/video' } },
    },
  })
  assert.deepEqual(result.warnings, [])
})
