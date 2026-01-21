self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Durante desenvolvimento: não cacheia nada (evita "abre parcial")
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
