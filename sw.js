const CACHE_NAME = 'corey2-audio-player';
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/main.js",
  "/offline.html",
  "/Icons/192.png",
  "/Icons/512.png"
];

// Folder audio otomatis dicache saat request pertama kali
const AUDIO_FOLDER = '/audio/';

// Install SW: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate SW: bersihkan cache lama
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

// Fetch: online first untuk assets, cache first untuk audio
self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);

  // Semua file audio di folder /audio/ pakai cache first
  if (requestURL.pathname.startsWith(AUDIO_FOLDER)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => caches.match("/offline.html"));
      })
    );
    return;
  }

  // File biasa: online first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(res => res || caches.match("/offline.html")))
  );
});
