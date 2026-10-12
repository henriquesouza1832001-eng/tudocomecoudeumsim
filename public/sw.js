let cacheName = 'wedding-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const response = await fetch('/index.html', { cache: 'reload' })
    const manifestResponse = await fetch('/build-manifest.json', { cache: 'reload' })
    if (!response.ok || !manifestResponse.ok) throw new Error('App shell could not be prepared')
    const manifest = await manifestResponse.json()
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(manifest))))
    cacheName = `wedding-shell-${[...digest.slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
    const assets = Object.values(manifest).flatMap((asset) => [asset.file, ...(asset.css || [])]).map((path) => `/${path}`)
    const cache = await caches.open(cacheName)
    await cache.addAll([...new Set(['/', '/index.html', '/build-manifest.json', '/manifest.webmanifest', '/icons/wedding.svg', ...assets])])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('wedding-shell-') && key !== cacheName).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(cacheName)
          await cache.put('/index.html', response.clone())
        }
        return response
      } catch {
        return await caches.match('/index.html') || await caches.match('/')
      }
    })())
    return
  }
  if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest' || url.pathname.startsWith('/icons/')) {
    event.respondWith((async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(cacheName)
        await cache.put(request, response.clone())
      }
      return response
    })())
  }
})
