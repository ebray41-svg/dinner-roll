const CACHE_NAME = 'dinner-roll-v3'

const APP_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
]

self.addEventListener('install', event => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES)
    })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    })
  )

  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseCopy = response.clone()

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseCopy)
        })

        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})