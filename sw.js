const CACHE = "bolo-pwa-v4";

// Arquivos do app (GitHub Pages do projeto = /bolo-pwa/)
const ASSETS = [
  "/bolo-pwa/",
  "/bolo-pwa/index.html",
  "/bolo-pwa/manifest.json",
  "/bolo-pwa/service-worker.js",
  "/bolo-pwa/icons/icon-192.png",
  "/bolo-pwa/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// Estratégia:
// - Assets do app: cache-first (abre rápido e não “parcial”)
// - Chamadas pro Apps Script (script.google.com / scriptusercontent.com): network-first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isAppsScript =
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("scriptusercontent.com");

  if (isAppsScript) {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (e) {
        return new Response(
          JSON.stringify({ ok: false, message: "Sem internet para sincronizar." }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;

    const fresh = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  })());
});
