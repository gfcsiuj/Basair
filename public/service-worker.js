const CACHE_NAME = 'basaier-cache-v4'; // Incremented version to force update
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/icon.svg',
  '/maskable_icon.svg',
  '/manifest.json',
  '/qpc-v4.json', // Cache the large JSON file
  '/qpc-v4-tajweed-15-lines.db', // Cache the DB file
  '/sql-wasm.wasm', // Cache the WASM file
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and pre-caching critical assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Become available to all pages
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Aggressive Cache-First Strategy for static assets and large files
  if (
    requestUrl.pathname.endsWith('.json') ||
    requestUrl.pathname.endsWith('.ttf') ||
    requestUrl.pathname.endsWith('.db') ||
    requestUrl.pathname.endsWith('.wasm') ||
    requestUrl.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response; // Return cached response immediately
          }
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for other requests (HTML, JS, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Return cached response but update cache in background
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }
            const responseToCache = response.clone();
            if (event.request.method === 'GET' && !event.request.url.includes('chrome-extension')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          }
        );
      })
  );
});