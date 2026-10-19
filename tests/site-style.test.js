import test from 'node:test'
import assert from 'node:assert/strict'
import { contrastRatio, getThemePalettes, isValidCustomAccent } from '../src/site-style.js'

const themes = [
  ['#405447', '#e4b98c', '#f4f0e8'],
  ['#4e5b51', '#c98f78', '#f7f4ef'],
  ['#586575', '#d7a7a0', '#f5f4f1'],
  ['#765965', '#c88d9c', '#f8f3f3'],
  ['#754f3e', '#bd8b56', '#f6f0e7'],
  ['#3d6970', '#c68e68', '#f4f7f4'],
  ['#637455', '#d38a68', '#f5f3e9'],
  ['#302b31', '#b84b55', '#f1e9e5'],
]

test('all curated theme palettes keep their accent at WCAG AA contrast against paper', () => {
  for (const colors of themes) {
    for (const [ink, accent, paper] of getThemePalettes({ colors })) {
      assert.ok(contrastRatio(accent, paper) >= 4.5, `${accent} on ${paper}`)
      assert.ok(contrastRatio(ink, paper) >= 4.5, `${ink} on ${paper}`)
    }
  }
})

test('custom accents are retained when accessible and darkened when contrast requires it', () => {
  const theme = { colors: themes[0] }
  const accessible = getThemePalettes(theme, '#405447')[0]
  const adjusted = getThemePalettes(theme, '#ffffff')[0]
  assert.equal(accessible[1], '#405447')
  assert.notEqual(adjusted[1], '#ffffff')
  assert.ok(contrastRatio(adjusted[1], adjusted[2]) >= 4.5)
  assert.equal(isValidCustomAccent('#aA00ff'), true)
  assert.equal(isValidCustomAccent('rebeccapurple'), false)
})
