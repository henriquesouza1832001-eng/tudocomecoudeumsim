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
  ['Padrinhos e madrinhas', 'Quem estará ao nosso lado'],
  ['Hospedagem e dicas', 'Para aproveitar cada momento'],
  ['Perguntas frequentes', 'Dúvidas sobre a celebração'],
  ['Playlist', 'Músicas que fazem parte da nossa história'],
  ['Vídeo', 'Um vídeo para compartilhar'],
  ['Contato', 'Falem com os noivos'],
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

export function setSiteSectionBody(config, section, body) {
  const current = config.sectionContent?.[section]?.['pt-BR'] || {}
  return {
    ...config,
    sectionContent: {
      ...config.sectionContent,
      [section]: {
        ...config.sectionContent?.[section],
        'pt-BR': { ...current, body },
      },
    },
  }
}

export function safeHttpsLink(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}
