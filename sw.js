/* service-worker.js */
const CACHE_NAME = "bolo-pwa-v1";
const ASSETS = [
  "/bolo-pwa/",
  "/bolo-pwa/index.html",
  "/bolo-pwa/manifest.json",
  "/bolo-pwa/service-worker.js",
  "/bolo-pwa/icons/icon-192.png",
  "/bolo-pwa/icons/icon-512.png"
];

// Instala e coloca tudo no cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Estratégia:
// - Para arquivos do app: cache-first
// - Para chamadas do Apps Script (/exec): network-first (senão você fica preso em resposta velha)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🔥 NÃO cachear chamadas ao Apps Script
  if (url.hostname === "script.google.com" || url.hostname.endsWith("googleusercontent.com")) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ ok: false, message: "Sem internet para chamar a API." }),
        { headers: { "Content-Type": "application/json" } }
      ))
    );
    return;
  }

  // App files: cache first
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
