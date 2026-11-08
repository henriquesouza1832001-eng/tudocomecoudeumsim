export function parseGiftAmountCents(value) {
  const normalized = String(value ?? '').trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null
  const amount = Number(normalized)
  const cents = Math.round(amount * 100)
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

export function giftCartTotalCents(items) {
  return items.reduce((total, item) => {
    const amount = Number.isSafeInteger(item.amountCents) && item.amountCents > 0 ? item.amountCents : 0
    const quantity = Number.isSafeInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0
    return total + amount * quantity
  }, 0)
}
