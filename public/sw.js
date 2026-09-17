const CACHE_NAME = 'fetchx-app-v1';
const APP_SHELL = ['/', '/site.webmanifest', '/favicon.svg'];
const CACHEABLE_STATIC_EXTENSIONS = new Set([
  '.css',
  '.ico',
  '.js',
  '.png',
  '.svg',
  '.webmanifest',
  '.webp',
  '.woff',
  '.woff2',
]);

const isCacheableStaticAsset = (url) => {
  if (url.search) return false;
  if (APP_SHELL.includes(url.pathname)) return true;

  const extensionMatch = url.pathname.match(/\.[a-z0-9]+$/i);
  return extensionMatch
    ? CACHEABLE_STATIC_EXTENSIONS.has(extensionMatch[0].toLowerCase())
    : false;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET') return;
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  if (!isCacheableStaticAsset(requestUrl)) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (networkResponse?.status !== 200) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, responseClone));

        return networkResponse;
      });
    }),
  );
});
