import test from 'node:test'
import assert from 'node:assert/strict'
import { GIFT_PRESETS, presetTotalCents } from '../src/gift-presets.js'

test('every preset item respects the API limits for a Pix gift', () => {
  const ids = new Set()
  for (const preset of GIFT_PRESETS) {
    assert.ok(!ids.has(preset.id), `id repetido ${preset.id}`)
    ids.add(preset.id)
    assert.ok(preset.items.length >= 3 && preset.items.length <= 12)
    for (const item of preset.items) {
      assert.ok(item.title.length > 0 && item.title.length <= 120)
      assert.ok(item.description.length <= 500)
      assert.ok(Number.isSafeInteger(item.amountCents) && item.amountCents > 0)
    }
    assert.ok(presetTotalCents(preset) > 0)
  }
})

test('presets never exceed the 60 active gifts limit alone', () => {
  assert.ok(GIFT_PRESETS.every((preset) => preset.items.length <= 60))
})
