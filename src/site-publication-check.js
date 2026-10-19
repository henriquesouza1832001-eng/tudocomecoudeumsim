import { safeHttpsLink } from './site-section-content.js'

const referencedPhotoIds = (config = {}) => {
  const enabled = new Set(config.enabledSections || [])
  const galleryEnabled = enabled.has('Galeria de fotos') || config.siteCarouselEnabled
  const giftMode = ['inline', 'page'].includes(config.giftDisplayMode)
    || (config.pix?.enabled && ['inline', 'page'].includes(config.pixDisplayMode))
  return new Set([
    config.coverPhotoId,
    ...(config.coverCarouselEnabled ? config.coverGallery || [] : []),
    ...(galleryEnabled ? config.siteGallery || [] : []),
    ...(galleryEnabled && config.siteCarouselEnabled ? config.siteCarouselPhotos || [] : []),
    ...(enabled.has('Linha do tempo') ? (config.timeline || []).map((item) => item.photoId) : []),
    ...(enabled.has('Padrinhos e madrinhas') ? (config.godparents || []).map((person) => person.photoId) : []),
    ...(giftMode ? Object.values(config.giftPresentation || {}).map((item) => item?.photoId) : []),
  ].filter(Boolean))
}

export function checkSitePublication(config = {}, events = []) {
  const missingAlt = [...referencedPhotoIds(config)].filter((id) => !config.imageAltTexts?.[id]?.['pt-BR']?.trim())
  const warnings = []
  const enabled = new Set(config.enabledSections || [])
  if (enabled.has('Nossa história') && !config.storyMessages?.['pt-BR']?.trim()) warnings.push('A seção Nossa história está ativa, mas ainda não tem texto.')
  if (enabled.has('Linha do tempo') && !(config.timeline || []).some((item) => item.title?.trim())) warnings.push('A seção Linha do tempo está ativa, mas ainda não tem marcos preenchidos.')
  if (enabled.has('Padrinhos e madrinhas') && !(config.godparents || []).some((person) => person.name?.trim() && person.photoId)) warnings.push('A seção Padrinhos e madrinhas está ativa, mas precisa de uma pessoa com nome e foto.')
  if (enabled.has('Dress code') && !config.weddingDetails?.dressCode?.trim()) warnings.push('A seção Dress code está ativa, mas ainda não tem orientação de traje.')
  if (enabled.has('Cronograma') && !events.length) warnings.push('O cronograma está ativo, mas ainda não há eventos cadastrados.')
  if (enabled.has('Cronograma') && events.some((event) => !event.starts_at)) warnings.push('Há evento sem data e horário para mostrar no cronograma.')
  if ((enabled.has('Galeria de fotos') || config.siteCarouselEnabled) && !(config.siteGallery || []).length && !(config.siteCarouselEnabled && config.siteCarouselPhotos?.length)) warnings.push('A seção de galeria está ativa, mas ainda não tem fotos selecionadas.')
  for (const section of ['Hospedagem e dicas', 'Perguntas frequentes', 'Contato']) {
    if (enabled.has(section) && !config.sectionContent?.[section]?.['pt-BR']?.body?.trim()) warnings.push(`A seção ${section} está ativa, mas ainda não tem conteúdo.`)
  }
  if (enabled.has('Playlist') && !safeHttpsLink(config.sectionContent?.Playlist?.['pt-BR']?.body)) warnings.push('A seção Playlist está ativa, mas precisa de um link HTTPS válido.')
  if (enabled.has('Vídeo') && !config.coverVideoId && !safeHttpsLink(config.sectionContent?.['Vídeo']?.['pt-BR']?.body)) warnings.push('A seção Vídeo está ativa, mas precisa de um vídeo enviado ou de um link HTTPS válido.')
  if (config.pix?.enabled && !config.pix.key?.trim()) warnings.push('O Pix está ativado, mas falta informar uma chave válida.')
  if (enabled.has('Eventos')) {
    if (!events.length) warnings.push('A seção de eventos está ativa, mas ainda não há eventos cadastrados.')
    if (events.some((event) => !event.address?.trim())) warnings.push('Há evento sem endereço. Confira se os convidados terão como localizar o local.')
  }
  return { blockers: missingAlt.length ? [`Preencha a descrição acessível de ${missingAlt.length} foto(s) usada(s) no convite.`] : [], warnings }
}
