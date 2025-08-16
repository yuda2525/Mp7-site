// ==================== sw.js ====================
const cacheName = 'yudatime-v2';
const assetsToCache = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './sw.js',
  './style.css',
  './main.js',
  './bg.jpg',      // background bisa di root
  './lagu.mp3',    // lagu bisa di root
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache semua aset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('✅ Pre-caching assets');
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first dengan fallback offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(response => {
          // Simpan ke cache untuk next time
          return caches.open(cacheName).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Fallback offline
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
          if (event.request.destination === 'image') {
            return caches.match('./bg.jpg');
          }
          if (event.request.destination === 'audio') {
            return caches.match('./lagu.mp3');
          }
        });
    })
  );
});
