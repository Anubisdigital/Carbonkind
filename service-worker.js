const CACHE_NAME = 'Carbon101-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './anubis.png',
  // Add all paper files
  './paper1.html',
  './paper2.html',
  './paper3.html',
  './paper4.html',
  './paper5.html',
  './paper6.html',
  './paper7.html',
  './paper8.html',
  './paper9.html',
  // External resources
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Add fallback for offline pages
const offlineFallbackPage = "<html><body><h1>You are offline</h1><p>Carbon101 will work when you reconnect</p></body></html>";

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      // Cache essential pages and resources
      return cache.addAll(urlsToCache).catch(error => {
        console.error('Failed to cache some resources:', error);
        // Log which files failed
        console.log('Failed URLs in cache.addAll:', urlsToCache);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip cross-origin requests except for allowed domains
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdnjs.cloudflare.com') &&
      !event.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(error => {
        // If offline and trying to fetch HTML, return offline page
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return new Response(offlineFallbackPage, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        console.error('Fetch failed:', error);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
