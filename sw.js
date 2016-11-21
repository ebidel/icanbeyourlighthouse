'use strict';

const PRECACHE = 'precache-v1.1.2';
const RUNTIME = 'runtime-v1.1.2';

const PRECACHE_URLS = [
  '/',
  'index.html', // Alias for /
  'logo.png',
  'pwa-lighthouse.png',
  'looped.mp3',
];

self.addEventListener('install', e => {
  const cachingDone = caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  e.waitUntil(cachingDone);
});

self.addEventListener('activate',  e => {
  const currentCaches = [PRECACHE, RUNTIME];

  const cachesRemoved =  caches.keys().then(cacheNames => {
    return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
  }).then(cachesToDelete => {
    return Promise.all(cachesToDelete.map(cacheToDelete => {
      return caches.delete(cacheToDelete);
    }));
  }).then(() => self.clients.claim());

  e.waitUntil(cachesRemoved);
});

self.addEventListener('fetch', e => {
  const requestURL = new URL(e.request.url);

  // Skip cross-origin requests or if the request was for the sw.js file itself.
  if (requestURL.origin !== self.location.origin ||
      requestURL.pathname === self.location.pathname) {
    return;
  }

  const fetchingAndCaching = caches.match(e.request).then(cacheResp => {
    return cacheResp || fetch(e.request).then(fetchResp => {
      // Put a copy of the response in the runtime cache.
      return caches.open(RUNTIME)
        .then(cache => cache.put(e.request, fetchResp.clone()))
        .then(() => fetchResp);
    });
  });

  e.respondWith(fetchingAndCaching);
});
