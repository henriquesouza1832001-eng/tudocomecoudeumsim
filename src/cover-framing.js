// Enquadramento da foto de capa escolhido pelos noivos: preencher (corta), foto inteira (sem cortar), zoom e posição livre.
export const COVER_FITS = ['cover', 'contain']
export const COVER_ZOOM_MIN = 100
export const COVER_ZOOM_MAX = 250
export const COVER_FOCUS_MIN = 0
export const COVER_FOCUS_MAX = 100

export const isValidCoverZoom = (value) => Number.isInteger(value) && value >= COVER_ZOOM_MIN && value <= COVER_ZOOM_MAX
export const isValidCoverFocus = (value) => Number.isInteger(value) && value >= COVER_FOCUS_MIN && value <= COVER_FOCUS_MAX

export function resolveCoverFraming(config) {
  const fit = config?.coverFit === 'contain' ? 'contain' : 'cover'
  const zoom = isValidCoverZoom(config?.coverZoom) ? config.coverZoom : 100
  const x = isValidCoverFocus(config?.coverFocusX) ? config.coverFocusX : null
  const y = isValidCoverFocus(config?.coverFocusY) ? config.coverFocusY : null
  return { fit, zoom, x, y }
}

// Estilo aplicado direto na foto. Retorna undefined quando nada foi personalizado (mantém o visual atual).
export function coverImageStyle(config) {
  const { fit, zoom, x, y } = resolveCoverFraming(config)
  if (fit === 'cover' && zoom === 100 && x === null && y === null) return undefined
  const position = x !== null || y !== null ? `${x ?? 50}% ${y ?? 50}%` : null
  const style = { objectFit: fit }
  if (position) style.objectPosition = position
  if (zoom > 100) {
    style.transform = `scale(${zoom / 100})`
    style.transformOrigin = position || 'center center'
  }
  return style
}
