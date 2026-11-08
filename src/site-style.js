export function colorLuminance(color) {
  const channels = color.replace('#', '').match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export function contrastRatio(first, second) {
  const values = [colorLuminance(first), colorLuminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

function blendToward(color, target, amount) {
  const channels = color.replace('#', '').match(/.{2}/g).map((value, index) => {
    const source = Number.parseInt(value, 16)
    const destination = Number.parseInt(target.replace('#', '').slice(index * 2, index * 2 + 2), 16)
    return Math.round(source + (destination - source) * amount).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

export function accessibleAccent(ink, accent, paper) {
  if (contrastRatio(accent, paper) >= 4.5) return accent
  for (let amount = 0.02; amount <= 1; amount += 0.02) {
    const adjusted = blendToward(accent, ink, amount)
    if (contrastRatio(adjusted, paper) >= 4.5) return adjusted
  }
  return ink
}

export function isValidCustomAccent(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

const DEFAULT_EXTRA_PALETTES = [
  ['Areia', ['#4f514b', '#c9b18b', '#eee9de']],
  ['Terracota', ['#644738', '#c2825d', '#f3e7dc']],
  ['Rosé', ['#664851', '#c9808f', '#f4e8eb']],
  ['Oliva', ['#47563f', '#9fa477', '#edf0e8']],
  ['Dourado', ['#5d512f', '#d2b65f', '#f5efd9']],
]

const THEME_EXTRA_PALETTES = {
  garden: [
    ['Sálvia', ['#3f5247', '#60725b', '#eef1e8']],
    ['Pêssego', ['#5a4034', '#985c43', '#f7ece4']],
    ['Orvalho', ['#33474a', '#517576', '#edf3f2']],
    ['Mel', ['#4f4528', '#846823', '#f6f0dc']],
    ['Folha escura', ['#26352c', '#7e683b', '#e9eee6']],
  ],
  editorial: [
    ['Grafite e marfim', ['#2f3338', '#8a694f', '#f6f3ee']],
    ['Bordô', ['#5a2d34', '#a5584b', '#f8f0ec']],
    ['Azul noite', ['#27384d', '#866841', '#f1f3f5']],
    ['Champanhe', ['#4a4033', '#856b43', '#f8f2e6']],
    ['Pedra', ['#45474a', '#78695f', '#efede9']],
  ],
  minimal: [
    ['Névoa', ['#3f4650', '#637181', '#f2f4f6']],
    ['Areia', ['#4f4b45', '#7f6a57', '#f4f1ec']],
    ['Carvão', ['#202225', '#b5523d', '#f7f7f5']],
    ['Menta', ['#34504a', '#49776c', '#eef4f2']],
    ['Blush', ['#5c4a4d', '#8c6368', '#f8f1f1']],
  ],
  floral: [
    ['Rosé', ['#664851', '#9f5966', '#f9eef0']],
    ['Peônia', ['#6b3f52', '#af4e71', '#faeff3']],
    ['Pêssego', ['#6a4538', '#95614c', '#fbf0e8']],
    ['Sálvia', ['#46574a', '#61745e', '#f1f4ee']],
    ['Dourado suave', ['#5d512f', '#806d35', '#f9f3df']],
  ],
  rustic: [
    ['Terracota', ['#6b3d2d', '#a05838', '#f7ebe0']],
    ['Cedro', ['#4a3a2a', '#88653c', '#f3ece0']],
    ['Oliva', ['#47563f', '#63714a', '#eef0e4']],
    ['Centeio', ['#5d512f', '#7d6937', '#f6efd8']],
    ['Café', ['#3b2a22', '#885f42', '#efe6da']],
  ],
  beach: [
    ['Mar', ['#1f4e5f', '#34788e', '#eef6f8']],
    ['Areia', ['#5c5140', '#816b50', '#f7f2e8']],
    ['Coral', ['#7a3f3a', '#a8574c', '#fbf0ec']],
    ['Brisa', ['#35575a', '#4c7575', '#edf5f3']],
    ['Pôr do sol', ['#6b4a3a', '#906446', '#fbf1e6']],
  ],
  tropical: [
    ['Hibisco', ['#6b2d3a', '#bd4360', '#fbeff0']],
    ['Folha', ['#2f4a35', '#427a4e', '#eef5ea']],
    ['Maracujá', ['#5a4a1f', '#8b681f', '#faf2d8']],
    ['Cajá', ['#6a3d1f', '#a35a2c', '#fbefe2']],
    ['Lima', ['#3f5a2a', '#5d7830', '#f1f5e2']],
  ],
  bordado: [
    ['Marsala', ['#4a1f2b', '#8c2f3f', '#f8efe8']],
    ['Bordô', ['#3a1620', '#6e1f2f', '#f6ece6']],
    ['Vermelho sangue', ['#4a1a1f', '#a3262f', '#fbf0ea']],
    ['Azul bordado', ['#27405f', '#4f7a8a', '#f3f1ea']],
    ['Pêssego e azul', ['#2f4466', '#b4584a', '#fbf1e6']],
  ],
  night: [
    ['Vinho', ['#4a1f2b', '#a8374a', '#f4e9eb']],
    ['Cobre', ['#33261f', '#9d5835', '#f3e9e1']],
    ['Grafite', ['#232326', '#676b74', '#eeeeec']],
    ['Ameixa', ['#3b2a3a', '#a64f6a', '#f2eaee']],
    ['Oliva escura', ['#2a3028', '#7b6635', '#ecebe3']],
  ],
}

function extraPalettes(theme) {
  return THEME_EXTRA_PALETTES[theme?.id] || DEFAULT_EXTRA_PALETTES
}

export function getThemePaletteNames(theme) {
  return ['Original', ...extraPalettes(theme).map(([name]) => name)]
}

export function getThemePalettes(theme, customAccent = null) {
  const accentOverride = isValidCustomAccent(customAccent) ? customAccent : null
  return [theme.colors, ...extraPalettes(theme).map(([, colors]) => colors)].map(([ink, accent, paper]) => [ink, accessibleAccent(ink, accentOverride || accent, paper), paper])
}
