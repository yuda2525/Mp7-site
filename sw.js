const CACHE_NAME = 'corey2-audio-player-v1';
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./offline.html",
  "./assets/Icon-192.png",
  "./assets/Icon-512.png"
];

// Install: cache semua asset
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch: online-first, fallback cache, terakhir offline.html
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(res => res || caches.match("./offline.html"))
      )
  );
});
