import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldAutoplayWeddingCoverVideo } from '../src/site-motion.js'

test('cover video autoplay follows animation, reduced-motion, and data-saver settings', () => {
  assert.equal(shouldAutoplayWeddingCoverVideo('Elegante'), true)
  assert.equal(shouldAutoplayWeddingCoverVideo('Nenhum'), false)
  assert.equal(shouldAutoplayWeddingCoverVideo('Festivo', true), false)
  assert.equal(shouldAutoplayWeddingCoverVideo('Suave', false, true), false)
})
