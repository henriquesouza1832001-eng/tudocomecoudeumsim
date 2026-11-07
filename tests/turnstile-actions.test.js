import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const api = readFileSync(new URL('../functions/api/[[route]].js', import.meta.url), 'utf8')
const client = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

function routeBlock(route) {
  const start = api.indexOf(`'${route}'`)
  assert.ok(start >= 0, `rota ${route} não encontrada`)
  const next = api.indexOf('\napp.', start + 10)
  return api.slice(start, next < 0 ? undefined : next)
}

test('guest RSVP validates Turnstile with the same action the form requests', () => {
  assert.match(routeBlock('/api/invitation/rsvp'), /verifyTurnstile\(context, body\.turnstileToken, 'rsvp'\)/)
  assert.match(client, /<TurnstileChallenge action="rsvp"/)
})
