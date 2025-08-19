const CACHE_NAME = 'corey2-audio-player';
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/main.js",
  "/offline.html",
  "/icons/192.png",
  "/icons/512.png"
];

// Install service worker dan cache file
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate service worker dan hapus cache lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// Fetch: online first, fallback to cache, terakhir offline.html
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(res => res || caches.match("/offline.html"))
      )
  );
});
