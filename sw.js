// ==================== sw.js ====================
const CACHE_NAME = 'audioplayer-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './sw.js',
  './style.css',
  './main.js',
  './bg.jpg',      // fallback image
  './bg.mp4',      // fallback video
  './lagu.mp3',    // fallback audio
  './icon-192.png',
  './icon-512.png'
];

// Install: cache semua assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first + fallback offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(resp => {
          // Simpan ke cache untuk next time
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
        .catch(() => {
          // fallback offline
          const req = event.request;
          if (req.mode === 'navigate') return caches.match('./offline.html');

          const url = req.url.toLowerCase();

          if (req.destination === 'image' || url.endsWith('.jpg') || url.endsWith('.png')) {
            return caches.match('./bg.jpg');
          }

          if (req.destination === 'video' || url.endsWith('.mp4')) {
            return caches.match('./bg.mp4');
          }

          if (req.destination === 'audio' || url.endsWith('.mp3')) {
            return caches.match('./lagu.mp3');
          }

          // fallback default jika request unknown
          return caches.match('./offline.html');
        })
    })
  );
});
