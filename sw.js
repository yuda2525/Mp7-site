// ==================== SW.JS ====================
const CACHE_NAME = 'corey2-audio-player-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './style.css',
  './main.js',
  './bg.jpg',
  './assets/Icon-192.png',
  './assets/Icon-512.png'
  // audio/video besar TIDAK dicache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url.toLowerCase();
  const isMedia = url.endsWith('.mp3') || url.endsWith('.mp4');

  if (isMedia) {
    event.respondWith(
      fetch(event.request).catch(() => {
        if (url.endsWith('.mp3')) return caches.match('./lagu1.mp3');
        if (url.endsWith('.mp4')) return caches.match('./bg.mp4');
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(resp => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, resp.clone());
              return resp;
            });
          })
          .catch(() => caches.match('./offline.html'));
      })
    );
  }
});
