// Fontes e tamanho de texto escolhidos pelos noivos. Usado no editor, no convite publicado e na validação do servidor.
export const SITE_FONT_CHOICES = [
  { id: 'Playfair Display', css: "'Playfair Display', Georgia, serif", script: false },
  { id: 'Cormorant Garamond', css: "'Cormorant Garamond', Georgia, serif", script: false },
  { id: 'Libre Baskerville', css: "'Libre Baskerville', Georgia, serif", script: false },
  { id: 'Lora', css: "'Lora', Georgia, serif", script: false },
  { id: 'Fraunces', css: "'Fraunces Variable', Georgia, serif", script: false },
  { id: 'Montserrat', css: "'Montserrat', Arial, sans-serif", script: false },
  { id: 'Manrope', css: "'Manrope', Arial, sans-serif", script: false },
  { id: 'DM Sans', css: "'DM Sans', Arial, sans-serif", script: false },
  { id: 'Raleway', css: "'Raleway', Arial, sans-serif", script: false },
  { id: 'Inter', css: "'Inter Variable', Arial, sans-serif", script: false },
  { id: 'Pinyon Script', css: "'Pinyon Script', 'Great Vibes', cursive", script: true },
  { id: 'Great Vibes', css: "'Great Vibes', 'Pinyon Script', cursive", script: true },
]

export const SITE_HEADING_FONTS = SITE_FONT_CHOICES.map((font) => font.id)
export const SITE_BODY_FONTS = SITE_FONT_CHOICES.filter((font) => !font.script).map((font) => font.id)

export const TEXT_SIZE_MIN = 85
export const TEXT_SIZE_MAX = 130
export const TEXT_SIZE_DEFAULT = 100

const LEGACY_SCALE = { small: 92, medium: 100, large: 110 }

export const isValidTextSize = (value) => Number.isInteger(value) && value >= TEXT_SIZE_MIN && value <= TEXT_SIZE_MAX

// Tamanho final em %, respeitando o antigo "fontScale" quando o novo campo ainda não existe.
export function resolveTextSize(config) {
  if (isValidTextSize(config?.textSize)) return config.textSize
  return LEGACY_SCALE[config?.fontScale] || TEXT_SIZE_DEFAULT
}

export const textScaleValue = (config) => String(resolveTextSize(config) / 100)

// [fonte dos títulos, fonte do texto]: escolha dos noivos, senão o par do tema.
export function resolveSiteFonts(config, pairs, fallbackPair) {
  const base = pairs[config?.fontPair] || pairs[fallbackPair] || Object.values(pairs)[0]
  const heading = SITE_FONT_CHOICES.find((font) => font.id === config?.headingFont)
  const body = SITE_FONT_CHOICES.find((font) => font.id === config?.bodyFont && !font.script)
  return [heading ? heading.css : base[0], body ? body.css : base[1]]
}
