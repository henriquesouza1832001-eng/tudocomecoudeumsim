import assert from 'node:assert/strict'
import test from 'node:test'
import { extractPhotoColorSuggestions } from '../src/photo-palette.js'
import { contrastRatio, getThemePalettes } from '../src/site-style.js'

test('photo color suggestions are extracted locally and favor dominant colors', () => {
  const pixels = new Uint8ClampedArray([
    ...Array.from({ length: 8 }, () => [35, 90, 55, 255]).flat(),
    ...Array.from({ length: 2 }, () => [180, 95, 70, 255]).flat(),
    ...[[255, 255, 255, 255], [5, 5, 5, 255], [25, 25, 25, 50]].flat(),
  ])
  const suggestions = extractPhotoColorSuggestions(pixels)
  assert.equal(suggestions.length, 2)
  assert.match(suggestions[0], /^#[0-9a-f]{6}$/)
  assert.match(suggestions[1], /^#[0-9a-f]{6}$/)
  for (const suggestion of suggestions) {
    const [, accent, paper] = getThemePalettes({ colors: ['#405447', '#e4b98c', '#f4f0e8'] }, suggestion)[0]
    assert.ok(contrastRatio(accent, paper) >= 4.5)
  }
})

test('photo color suggestions ignore invalid pixel arrays and neutral images', () => {
  assert.deepEqual(extractPhotoColorSuggestions([]), [])
  assert.deepEqual(extractPhotoColorSuggestions(new Uint8ClampedArray([1, 2, 3])), [])
  assert.deepEqual(extractPhotoColorSuggestions(new Uint8ClampedArray([230, 230, 230, 255, 20, 20, 20, 255])), [])
})
