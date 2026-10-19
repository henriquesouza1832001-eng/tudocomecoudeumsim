const referencedPhotoIds = (config = {}) => new Set([
  config.coverPhotoId,
  ...(config.coverCarouselEnabled ? config.coverGallery || [] : []),
  ...(config.siteGallery || []),
  ...(config.siteCarouselEnabled ? config.siteCarouselPhotos || [] : []),
  ...(config.timeline || []).map((item) => item.photoId),
  ...Object.values(config.giftPresentation || {}).map((item) => item?.photoId),
].filter(Boolean))

export function checkSitePublication(config = {}, events = []) {
  const missingAlt = [...referencedPhotoIds(config)].filter((id) => !config.imageAltTexts?.[id]?.['pt-BR']?.trim())
  const warnings = []
  const enabled = new Set(config.enabledSections || [])
  if (enabled.has('Nossa história') && !config.storyMessages?.['pt-BR']?.trim()) warnings.push('A seção Nossa história está ativa, mas ainda não tem texto.')
  if (enabled.has('Linha do tempo') && !(config.timeline || []).some((item) => item.title?.trim())) warnings.push('A seção Linha do tempo está ativa, mas ainda não tem marcos preenchidos.')
  if (enabled.has('Galeria de fotos') && !(config.siteGallery || []).length && !(config.siteCarouselEnabled && config.siteCarouselPhotos?.length)) warnings.push('A seção de galeria está ativa, mas ainda não tem fotos selecionadas.')
  if (enabled.has('Eventos')) {
    if (!events.length) warnings.push('A seção de eventos está ativa, mas ainda não há eventos cadastrados.')
    if (events.some((event) => !event.address?.trim())) warnings.push('Há evento sem endereço. Confira se os convidados terão como localizar o local.')
  }
  return { blockers: missingAlt.length ? [`Preencha a descrição acessível de ${missingAlt.length} foto(s) usada(s) no convite.`] : [], warnings }
}
