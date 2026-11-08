import test from 'node:test'
import assert from 'node:assert/strict'
import { HEADING_PT_OPTIONS, SITE_BODY_FONTS, SITE_HEADING_FONTS, TEXT_PT_OPTIONS, headingScaleValue, isValidHeadingPt, isValidTextPt, isValidTextSize, resolveSiteFonts, resolveTextPt, resolveTextSize, textScaleValue } from '../src/site-fonts.js'

const pairs = { Base: ['HEAD', 'BODY'] }

test('text size accepts only whole percentages between 85 and 130', () => {
  for (const ok of [85, 100, 130]) assert.equal(isValidTextSize(ok), true)
  for (const bad of [84, 131, 99.5, '100', null, undefined, NaN]) assert.equal(isValidTextSize(bad), false)
})

test('text size falls back to the legacy scale and then to 100', () => {
  assert.equal(resolveTextSize({ textSize: 120, fontScale: 'small' }), 120)
  assert.equal(resolveTextSize({ fontScale: 'small' }), 92)
  assert.equal(resolveTextSize({ fontScale: 'large' }), 110)
  assert.equal(resolveTextSize({}), 100)
  assert.equal(textScaleValue({ textSize: 90 }), '0.9')
})

test('couple font choices override the theme pair, scripts only for headings', () => {
  assert.deepEqual(resolveSiteFonts({ fontPair: 'Base' }, pairs, 'Base'), ['HEAD', 'BODY'])
  const [heading, body] = resolveSiteFonts({ fontPair: 'Base', headingFont: 'Pinyon Script', bodyFont: 'Lora' }, pairs, 'Base')
  assert.match(heading, /Pinyon Script/)
  assert.match(body, /Lora/)
  assert.equal(resolveSiteFonts({ fontPair: 'Base', bodyFont: 'Great Vibes' }, pairs, 'Base')[1], 'BODY')
  assert.equal(resolveSiteFonts({ fontPair: 'Base', headingFont: 'Inexistente' }, pairs, 'Base')[0], 'HEAD')
  assert.ok(SITE_HEADING_FONTS.includes('Great Vibes') && !SITE_BODY_FONTS.includes('Great Vibes'))
})

test('point sizes work like the Word list and drive the text scale', () => {
  assert.deepEqual(TEXT_PT_OPTIONS.slice(0, 5), [8, 9, 10, 11, 12])
  assert.equal(isValidTextPt(12), true)
  assert.equal(isValidTextPt(13), false)
  assert.equal(isValidHeadingPt(96), true)
  assert.equal(isValidHeadingPt(100), false)
  assert.equal(textScaleValue({ textPt: 24 }), '2')
  assert.equal(textScaleValue({ textPt: 12 }), '1')
  assert.equal(textScaleValue({ textSize: 90 }), '0.9')
  assert.equal(resolveTextPt({}), 12)
  assert.equal(resolveTextPt({ textSize: 130 }), 16)
  assert.equal(resolveTextPt({ textPt: 18, textSize: 90 }), 18)
})

test('heading size scales from 36 pt and script fonts get an automatic boost', () => {
  assert.equal(headingScaleValue({}), '1')
  assert.equal(headingScaleValue({ headingPt: 72 }), '2')
  assert.equal(headingScaleValue({ headingPt: 36, headingFont: 'Great Vibes' }), '1.2')
  assert.equal(headingScaleValue({ headingPt: 36, fontPair: 'Caligráfico bordado' }), '1.2')
  assert.equal(headingScaleValue({ headingPt: 36, fontPair: 'Caligráfico bordado', headingFont: 'Lora' }), '1')
  assert.equal(HEADING_PT_OPTIONS.includes(36), true)
})
