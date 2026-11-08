import test from 'node:test'
import assert from 'node:assert/strict'
import { giftCartTotalCents, parseGiftAmountCents } from '../src/gift-cart.js'

test('gift cart parses positive currency values in Brazilian or decimal notation', () => {
  assert.equal(parseGiftAmountCents('50'), 5000)
  assert.equal(parseGiftAmountCents('50.25'), 5025)
  assert.equal(parseGiftAmountCents('50,25'), 5025)
  assert.equal(parseGiftAmountCents('0'), null)
  assert.equal(parseGiftAmountCents('-2'), null)
  assert.equal(parseGiftAmountCents('50,999'), null)
  assert.equal(parseGiftAmountCents(''), null)
})

test('gift cart totals each selected value by its quantity', () => {
  assert.equal(giftCartTotalCents([
    { amountCents: 2500, quantity: 2 },
    { amountCents: 5000, quantity: 1 },
    { amountCents: 0, quantity: 3 },
  ]), 10000)
})
