import test from 'node:test'
import assert from 'node:assert/strict'
import { createSiteDraftHistory, recordSiteDraftChange, redoSiteDraft, undoSiteDraft } from '../src/site-draft-history.js'

test('site draft history restores a previous version and redoes it', () => {
  const first = { config: { theme: 'garden' }, profile: { partnerOneName: 'Ana' } }
  const second = { config: { theme: 'editorial' }, profile: { partnerOneName: 'Ana' } }
  const history = recordSiteDraftChange(createSiteDraftHistory(first), second)
  const undone = undoSiteDraft(history)
  assert.deepEqual(undone.present, first)
  assert.deepEqual(redoSiteDraft(undone).present, second)
})

test('new site draft changes clear redo history and cap the undo stack', () => {
  let history = createSiteDraftHistory({ value: 0 })
  for (let value = 1; value <= 60; value += 1) history = recordSiteDraftChange(history, { value })
  assert.equal(history.past.length, 50)
  const undone = undoSiteDraft(history)
  const changed = recordSiteDraftChange(undone, { value: 100 })
  assert.deepEqual(changed.future, [])
  assert.equal(redoSiteDraft(changed), changed)
})
