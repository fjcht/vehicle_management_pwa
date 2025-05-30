
const CACHE_NAME = 'workshop-pwa-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/clients',
  '/vehicles',
  '/repairs',
  '/appointments',
  '/employees',
  '/login',
  '/register',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Failed to cache resources:', error);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Skip caching for API routes and authentication
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/auth/') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch((error) => {
          console.error('Fetch failed:', error);
          // Return a fallback response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
