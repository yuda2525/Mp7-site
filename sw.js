const CACHE_NAME = 'audioplayer-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './style.css',
  './main.js',
  './bg.jpg',
  './bg.mp4',
  './icon-192.png',
  './icon-512.png'
  // audio/video besar TIDAK dicache, langsung dari folder lokal
];

// Install: cache semua assets kecil
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

// Fetch: cache-first untuk assets kecil, audio/video langsung local
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url.toLowerCase();
  const isMedia = url.endsWith('.mp3') || url.endsWith('.mp4');

  if (isMedia) {
    // Audio/video besar: langsung dari local folder, jangan cache ulang
    event.respondWith(fetch(event.request).catch(() => {
      // fallback offline jika file lokal hilang
      if (url.endsWith('.mp3')) return caches.match('./lagu.mp3');
      if (url.endsWith('.mp4')) return caches.match('./bg.mp4');
    }));
  } else {
    // Assets kecil: cache-first
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request)
        .then(resp => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
        .catch(() => caches.match('./offline.html'))
      )
    );
  }
});
