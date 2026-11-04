import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidPixKey } from '../src/pix-key.js'

test('accepts supported Pix key formats with valid checksums', () => {
  for (const key of [
    '529.982.247-25',
    '12.ABC.345/01DE-35',
    'pix@example.com',
    '+55 (31) 98892-4409',
    '123e4567-e89b-42d3-a456-426614174000',
  ]) assert.equal(isValidPixKey(key), true, key)
})

test('rejects arbitrary text, malformed emails, and documents with invalid checksums', () => {
  for (const key of ['abc', 'pix@', '12345678900', '12ABC34501DE36', '']) {
    assert.equal(isValidPixKey(key), false, key)
  }
})
