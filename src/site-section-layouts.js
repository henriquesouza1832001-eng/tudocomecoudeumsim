export const SITE_SECTION_LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Clássico' },
  { value: 'framed', label: 'Moldura suave' },
  { value: 'compact', label: 'Compacto' },
]

export function normalizeSectionLayouts(layouts, allowedSections) {
  if (layouts === undefined) return {}
  if (!layouts || typeof layouts !== 'object' || Array.isArray(layouts)) return null
  const allowedValues = SITE_SECTION_LAYOUT_OPTIONS.map((option) => option.value)
  if (Object.entries(layouts).some(([section, layout]) => !allowedSections.includes(section) || !allowedValues.includes(layout))) return null
  return { ...layouts }
}
