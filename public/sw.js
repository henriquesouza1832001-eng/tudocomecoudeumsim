const cachePrefix = 'wedding-shell-'
const currentShellMarker = '/__current-shell__'

async function getShellCacheName() {
  const keys = await caches.keys()
  const shellKeys = keys.filter((key) => key.startsWith(cachePrefix))
  for (const key of shellKeys) {
    const cache = await caches.open(key)
    if (await cache.match(currentShellMarker)) return key
  }
  return shellKeys[0]
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const [response, manifestResponse] = await Promise.all([
      fetch('/index.html', { cache: 'no-store' }),
      fetch('/build-manifest.json', { cache: 'no-store' }),
    ])
    if (!response.ok || !manifestResponse.ok) throw new Error('App shell could not be prepared')
    const manifestCopy = manifestResponse.clone()
    const [manifest, html] = await Promise.all([manifestResponse.json(), response.clone()])
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(manifest))))
    const cacheName = `${cachePrefix}${[...digest.slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
    const entry = manifest['index.html']
    const assets = new Set()
    const addRequiredAssets = (asset, visited = new Set()) => {
      if (!asset || visited.has(asset.file)) return
      visited.add(asset.file)
      assets.add(`/${asset.file}`)
      for (const path of asset.css || []) assets.add(`/${path}`)
      for (const imported of asset.imports || []) addRequiredAssets(manifest[imported], visited)
    }
    addRequiredAssets(entry)
    const cache = await caches.open(cacheName)
    await cache.put('/index.html', html)
    await cache.put('/build-manifest.json', manifestCopy)
    await cache.put(currentShellMarker, new Response('current'))
    await cache.addAll([...new Set(['/', '/manifest.webmanifest', '/icons/wedding.svg', '/icons/wedding-180.png', '/icons/wedding-192.png', '/icons/wedding-512.png', '/images/wedding-pexels.avif', '/images/wedding-pexels.webp', ...assets])])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    let cacheName
    for (const key of keys.filter((item) => item.startsWith(cachePrefix))) {
      const cache = await caches.open(key)
      if (await cache.match(currentShellMarker)) cacheName = key
    }
    await Promise.all(keys.filter((key) => key.startsWith(cachePrefix) && key !== cacheName).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cacheName = await getShellCacheName()
      const cache = cacheName ? await caches.open(cacheName) : null
      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache?.put('/index.html', response.clone())
        }
        return response
      } catch {
        return await cache?.match('/index.html') || await cache?.match('/') || Response.error()
      }
    })())
    return
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/images/') || url.pathname === '/manifest.webmanifest' || url.pathname === '/build-manifest.json' || url.pathname.startsWith('/icons/')) {
    event.respondWith((async () => {
      const cacheName = await getShellCacheName()
      const cache = cacheName ? await caches.open(cacheName) : null
      const cached = await cache?.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        await cache?.put(request, response.clone())
      }
      return response
    })())
  }
})
