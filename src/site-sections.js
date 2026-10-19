export const ORDERABLE_SITE_SECTIONS = ['Contagem regressiva', 'Nossa história', 'Linha do tempo', 'Eventos', 'Dress code', 'Galeria de fotos', 'Lista de presentes', 'Confirmação de presença']

export function orderedSiteSections(config) {
  const sections = [...(config?.enabledSections || [])]
  if (config?.siteCarouselEnabled && !sections.includes('Galeria de fotos')) sections.push('Galeria de fotos')
  if ((['inline', 'page'].includes(config?.giftDisplayMode) || ['inline', 'page'].includes(config?.pixDisplayMode)) && !sections.includes('Lista de presentes')) sections.push('Lista de presentes')
  return [...new Set(sections)]
}

export function moveSiteSection(sections, section, direction) {
  const ordered = [...sections]
  const visible = ordered.filter((item) => ORDERABLE_SITE_SECTIONS.includes(item))
  const index = visible.indexOf(section)
  const target = index + direction
  if (index < 0 || target < 0 || target >= visible.length) return ordered
  const first = ordered.indexOf(section)
  const other = ordered.indexOf(visible[target])
  ;[ordered[first], ordered[other]] = [ordered[other], ordered[first]]
  return ordered
}
