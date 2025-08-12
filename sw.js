const cacheName = 'yudatime-v1';
const assetsToCache = [
  './',
  './index.html',
  './offline.html', 
  './manifest.json',
  './sw.js',
  './assets/lagu.mp3',
  './assets/bg.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Kalau gagal fetch dan itu navigasi (halaman)
      if (event.request.mode === 'navigate') {
        return caches.match('./offline.html');
      }
      return caches.match(event.request);
    })
  );
});
