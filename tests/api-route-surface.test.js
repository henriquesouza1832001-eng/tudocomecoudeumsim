import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { onRequest } from '../functions/api/[[route]].js'

const origin = 'https://tudocomecoudeumsim.pages.dev'
const apiSource = readFileSync(new URL('../functions/api/[[route]].js', import.meta.url), 'utf8')
const routeDefinitions = [...apiSource.matchAll(/app\.(get|post|put|patch|delete)\('([^']+)'/g)].map((match) => ({ method: match[1].toUpperCase(), path: match[2] }))

function emptyDatabase() {
  return {
    prepare() {
      return {
        bind() { return this },
        async first() { return null },
        async all() { return { results: [] } },
        async run() { return { meta: { changes: 0 } } },
      }
    },
    async batch() { return [] },
  }
}

function concretePath(path) {
  return path.replace(/:[^/]+/g, 'surface-test-id')
}

test('all registered API routes dispatch without an unknown-route response or server exception', async (context) => {
  assert.equal(routeDefinitions.length, 107)

  for (const route of routeDefinitions) {
    await context.test(`${route.method} ${route.path}`, async () => {
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(route.method)
      const request = new Request(`${origin}${concretePath(route.path)}`, {
        method: route.method,
        headers: {
          Origin: origin,
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        },
        body: hasBody ? '{}' : undefined,
      })
      const response = await onRequest({ request, env: { DB: emptyDatabase() } })
      const result = await response.json().catch(() => ({}))

      assert.notEqual(result.error, 'api_route_not_found')
      assert.notEqual(response.status, 500, `unexpected server exception: ${result.error || 'unknown'}`)
    })
  }
})
