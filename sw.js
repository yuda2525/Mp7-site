// === Service Worker Full Offline + Audio Cache ===
const CACHE_NAME = 'corey2-static-v1';
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/main.js",
  "/offline.html",
  "/Icons/192.png",
  "/Icons/512.png"
];
const AUDIO_FOLDER = '/audio/';

// IndexedDB setup for audio
let db;
const DB_NAME_AUDIO = "Corey2AudioDB";
const STORE_AUDIO = "audioFiles";

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME_AUDIO, 1);
    req.onupgradeneeded = e => {
      db = e.target.result;
      if(!db.objectStoreNames.contains(STORE_AUDIO)) db.createObjectStore(STORE_AUDIO);
    };
    req.onsuccess = e => { db = e.target.result; resolve(); };
    req.onerror = reject;
  });
}

function saveAudioToDB(key, blob) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    tx.objectStore(STORE_AUDIO).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e);
  });
}

function getAudioFromDB(key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const req = tx.objectStore(STORE_AUDIO).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e);
  });
}

// === Install SW: cache static assets ===
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// === Activate SW: clean old caches ===
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// === Fetch Handler ===
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Audio lazy cache with IndexedDB
  if(url.pathname.startsWith(AUDIO_FOLDER)) {
    event.respondWith(
      openAudioDB().then(() =>
        getAudioFromDB(url.pathname).then(blob => {
          if(blob) return new Response(blob);
          return fetch(event.request).then(resp => {
            resp.clone().blob().then(b => saveAudioToDB(url.pathname, b));
            return resp;
          }).catch(() => caches.match('/offline.html'));
        })
      )
    );
    return;
  }

  // Static assets: online first, fallback cache
  event.respondWith(
    fetch(event.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return resp;
      })
      .catch(() => caches.match(event.request).then(res => res || caches.match('/offline.html')))
  );
});
