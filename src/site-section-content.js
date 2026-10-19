export const EDITABLE_SITE_SECTION_TITLES = [
  ['Nossa história', 'Nossa história'],
  ['Linha do tempo', 'Alguns capítulos de nós'],
  ['Contagem regressiva', 'O grande dia se aproxima'],
  ['Eventos', 'Esperamos vocês'],
  ['Cronograma', 'Momentos da celebração'],
  ['Dress code', 'Traje sugerido'],
  ['Galeria de fotos', 'Alguns instantes nossos'],
  ['Lista de presentes', 'Um carinho para os noivos'],
  ['Confirmação de presença', 'Vocês poderão estar conosco?'],
]

export function getSiteSectionTitle(config, section, fallback) {
  const title = config?.sectionContent?.[section]?.['pt-BR']?.title
  const standard = fallback || EDITABLE_SITE_SECTION_TITLES.find(([name]) => name === section)?.[1] || section
  return typeof title === 'string' && title.trim() ? title.trim() : standard
}

export function setSiteSectionTitle(config, section, title) {
  const current = config.sectionContent?.[section]?.['pt-BR'] || {}
  return {
    ...config,
    sectionContent: {
      ...config.sectionContent,
      [section]: {
        ...config.sectionContent?.[section],
        'pt-BR': { ...current, title },
      },
    },
  }
}
