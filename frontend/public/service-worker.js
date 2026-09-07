const CACHE_VERSION = 'edumatch-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGE_CACHE = `${CACHE_VERSION}-pages`

const APP_SHELL = [
  '/',
  '/index.html',
  '/auth/login',
  '/manifest.webmanifest',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon-192.png',
  '/icons/maskable-icon-512.png',
  '/icons/apple-touch-icon.png',
  '/css/iabcc.css',
  '/css/student.css',
  '/css/notifications.css',
  '/css/teacher.css',
  '/css/secretary.css',
  '/css/headteacher.css',
  '/css/admin.css',
  '/css/auth.css',
]

const cacheBuiltAssets = async (cache) => {
  const response = await fetch('/index.html', { cache: 'no-store' })
  if (!response.ok) throw new Error('App shell was unavailable')

  const html = await response.clone().text()
  await cache.put('/index.html', response)

  const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)]
    .map((match) => match[1])

  await Promise.allSettled(
    [...new Set(builtAssets)].map(async (asset) => {
      const assetResponse = await fetch(asset)
      if (assetResponse.ok) await cache.put(asset, assetResponse)
    }),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE)
    await cache.addAll(APP_SHELL)
    await cacheBuiltAssets(cache)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const expectedCaches = new Set([STATIC_CACHE, PAGE_CACHE])
    const existingCaches = await caches.keys()
    await Promise.all(
      existingCaches
        .filter((cacheName) => cacheName.startsWith('edumatch-') && !expectedCaches.has(cacheName))
        .map((cacheName) => caches.delete(cacheName)),
    )
    await self.clients.claim()
  })())
})

const networkFirstPage = async (request) => {
  const cache = await caches.open(PAGE_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch (_error) {
    return (await cache.match(request))
      || (await caches.match('/index.html'))
      || Response.error()
  }
}

const staleWhileRevalidate = async (request, event) => {
  const cachedResponse = await caches.match(request)
  const update = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      await cache.put(request, response.clone())
    }
    return response
  })

  if (cachedResponse) {
    event.waitUntil(update.catch(() => {}))
    return cachedResponse
  }

  return update
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }

  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, event))
  }
})
