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

export function getThemePalettes(theme, customAccent = null) {
  const accentOverride = isValidCustomAccent(customAccent) ? customAccent : null
  return [
    theme.colors,
    ['#4f514b', '#c9b18b', '#eee9de'],
    ['#644738', '#c2825d', '#f3e7dc'],
    ['#664851', '#c9808f', '#f4e8eb'],
    ['#47563f', '#9fa477', '#edf0e8'],
    ['#5d512f', '#d2b65f', '#f5efd9'],
  ].map(([ink, accent, paper]) => [ink, accessibleAccent(ink, accentOverride || accent, paper), paper])
}
