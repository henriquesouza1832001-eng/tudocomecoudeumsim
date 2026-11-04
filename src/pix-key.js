function cpfDigit(value) {
  const sum = [...value].reduce((total, digit, index) => total + Number(digit) * (value.length + 1 - index), 0)
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function validCpf(value) {
  if (!/^\d{11}$/.test(value) || /^([0-9])\1{10}$/.test(value)) return false
  const first = cpfDigit(value.slice(0, 9))
  const second = cpfDigit(`${value.slice(0, 9)}${first}`)
  return Number(value[9]) === first && Number(value[10]) === second
}

function cnpjDigit(value) {
  const weights = value.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const sum = [...value].reduce((total, character, index) => total + (character.charCodeAt(0) - 48) * weights[index], 0)
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function validCnpj(value) {
  if (!/^[A-Z0-9]{12}\d{2}$/.test(value) || /^([A-Z0-9])\1{13}$/.test(value)) return false
  const first = cnpjDigit(value.slice(0, 12))
  const second = cnpjDigit(`${value.slice(0, 12)}${first}`)
  return Number(value[12]) === first && Number(value[13]) === second
}

function validPhone(value) {
  const normalized = value.replace(/[\s().-]/g, '')
  if (/^\+[1-9]\d{7,14}$/.test(normalized) && !normalized.startsWith('+55')) return true
  const national = normalized.startsWith('+55') ? normalized.slice(3) : normalized.startsWith('55') && normalized.length > 11 ? normalized.slice(2) : normalized
  return /^([1-9]\d)(?:9\d{8}|[2-5]\d{7})$/.test(national)
}

export function isValidPixKey(value) {
  if (typeof value !== 'string') return false
  const key = value.trim()
  if (!key || key.length > 200) return false
  if (/^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/.test(key) && key.length <= 77) return true
  const document = key.replace(/[.\-/]/g, '').toUpperCase()
  if (validCpf(document) || validCnpj(document)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return true
  return validPhone(key)
}
