const CACHE_NAME = "bolo-pwa-v23";

const ASSETS = [
  "/bolo-pwa/",
  "/bolo-pwa/index.html",
  "/bolo-pwa/manifest.json",
  "/bolo-pwa/service-worker.js",
  "/bolo-pwa/icons/icon-192.png",
  "/bolo-pwa/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Apps Script: sempre rede (não cachear)
  if (url.hostname === "script.google.com" || url.hostname.endsWith("googleusercontent.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return resp;
      });
    })
  );
});
