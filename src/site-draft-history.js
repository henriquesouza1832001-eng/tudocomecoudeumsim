const HISTORY_LIMIT = 50

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot))
}

export function createSiteDraftHistory(snapshot) {
  return { past: [], present: cloneSnapshot(snapshot), future: [] }
}

export function recordSiteDraftChange(history, snapshot) {
  if (JSON.stringify(history.present) === JSON.stringify(snapshot)) return history
  return {
    past: [...history.past.slice(-(HISTORY_LIMIT - 1)), history.present],
    present: cloneSnapshot(snapshot),
    future: [],
  }
}

export function undoSiteDraft(history) {
  if (!history.past.length) return history
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  }
}

export function redoSiteDraft(history) {
  if (!history.future.length) return history
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: history.future[0],
    future: history.future.slice(1),
  }
}
