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
  if ((config.enabledSections || []).includes('Eventos')) {
    if (!events.length) warnings.push('A seção de eventos está ativa, mas ainda não há eventos cadastrados.')
    if (events.some((event) => !event.address?.trim())) warnings.push('Há evento sem endereço. Confira se os convidados terão como localizar o local.')
  }
  return { blockers: missingAlt.length ? [`Preencha a descrição acessível de ${missingAlt.length} foto(s) usada(s) no convite.`] : [], warnings }
}
