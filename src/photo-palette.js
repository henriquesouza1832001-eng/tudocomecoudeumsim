export function extractPhotoColorSuggestions(pixels) {
  if (!pixels || typeof pixels.length !== 'number' || pixels.length < 4 || pixels.length % 4 !== 0) return []
  const buckets = new Map()
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    if (pixels[index + 3] < 180) continue
    const maximum = Math.max(red, green, blue) / 255
    const minimum = Math.min(red, green, blue) / 255
    const lightness = (maximum + minimum) / 2
    const saturation = maximum === minimum ? 0 : (maximum - minimum) / (1 - Math.abs(2 * lightness - 1))
    if (saturation < 0.12 || lightness < 0.16 || lightness > 0.88) continue
    const key = [red, green, blue].map((channel) => Math.floor(channel / 32)).join(':')
    const bucket = buckets.get(key) || { red: 0, green: 0, blue: 0, count: 0 }
    bucket.red += red
    bucket.green += green
    bucket.blue += blue
    bucket.count += 1
    buckets.set(key, bucket)
  }
  const colors = [...buckets.values()].sort((first, second) => second.count - first.count).map((bucket) => {
    const channels = [bucket.red, bucket.green, bucket.blue].map((total) => Math.round(total / bucket.count))
    return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
  })
  const suggestions = []
  for (const color of colors) {
    const channels = color.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16))
    if (suggestions.some((suggestion) => {
      const previous = suggestion.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16))
      return Math.sqrt(channels.reduce((distance, channel, index) => distance + (channel - previous[index]) ** 2, 0)) < 58
    })) continue
    suggestions.push(color)
    if (suggestions.length === 3) break
  }
  return suggestions
}
