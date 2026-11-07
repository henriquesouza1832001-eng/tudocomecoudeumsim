// Marcador guardado em imageAltTexts['pt-BR'] para fotos decorativas. Mantém o formato aceito pela API
// (texto de até 250 caracteres) e conta como descrição preenchida; no convite publicado vira alt="".
export const DECORATIVE_ALT = '[decorativa]'

export const isDecorativeAlt = (value) => typeof value === 'string' && value.trim() === DECORATIVE_ALT

export function resolveImageAlt(stored, fallback = '') {
  const text = typeof stored === 'string' ? stored.trim() : ''
  if (text === DECORATIVE_ALT) return ''
  return text || fallback
}

const FILE_NAME_PATTERN = /\.(jpe?g|png|webp|gif|heic|avif)$/i

export function buildDefaultAltText(template, coupleName) {
  const text = String(template || '').replaceAll('{nomeCasal}', coupleName || '').replace(/\s+/g, ' ').trim().slice(0, 250)
  if (!text || FILE_NAME_PATTERN.test(text) || isDecorativeAlt(text)) return ''
  return text
}

export function fillEmptyAltTexts(current = {}, ids = [], text = '') {
  const next = { ...current }
  if (!text) return next
  for (const id of ids) {
    if (!next[id]?.['pt-BR']?.trim()) next[id] = { 'pt-BR': text }
  }
  return next
}
