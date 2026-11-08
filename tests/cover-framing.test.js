import test from 'node:test'
import assert from 'node:assert/strict'
import { coverImageStyle, isValidCoverFocus, isValidCoverZoom, resolveCoverFraming } from '../src/cover-framing.js'

test('default framing keeps the current look (no inline style)', () => {
  assert.equal(coverImageStyle({}), undefined)
  assert.equal(coverImageStyle({ coverFit: 'cover', coverZoom: 100 }), undefined)
})

test('whole-photo mode never crops and keeps the chosen focus', () => {
  assert.deepEqual(coverImageStyle({ coverFit: 'contain' }), { objectFit: 'contain' })
  assert.deepEqual(coverImageStyle({ coverFit: 'contain', coverFocusX: 30, coverFocusY: 70 }), { objectFit: 'contain', objectPosition: '30% 70%' })
})

test('zoom scales around the focus point', () => {
  assert.deepEqual(coverImageStyle({ coverZoom: 150, coverFocusX: 20 }), { objectFit: 'cover', objectPosition: '20% 50%', transform: 'scale(1.5)', transformOrigin: '20% 50%' })
  assert.equal(coverImageStyle({ coverZoom: 150 }).transformOrigin, 'center center')
})

test('invalid values fall back safely', () => {
  assert.deepEqual(resolveCoverFraming({ coverFit: 'stretch', coverZoom: 999, coverFocusX: -1, coverFocusY: 50.5 }), { fit: 'cover', zoom: 100, x: null, y: null })
  assert.equal(isValidCoverZoom(99), false)
  assert.equal(isValidCoverZoom(250), true)
  assert.equal(isValidCoverFocus(100), true)
  assert.equal(isValidCoverFocus(101), false)
})
