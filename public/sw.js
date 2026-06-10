/* Service worker do Tata Sushi Reservas.
 * Cache básico para abrir o app; dados e alterações exigem conexão
 * (alterações offline são bloqueadas no app para evitar conflito de mesas). */
const CACHE = 'tatasushi-v1';
const PRECACHE = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // não intercepta Supabase

  // Páginas: rede primeiro, cache como reserva para abrir o app offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
          return resposta;
        })
        .catch(() => caches.match(request).then((c) => c ?? caches.match('/dashboard'))),
    );
    return;
  }

  // Estáticos: cache primeiro
  event.respondWith(
    caches.match(request).then(
      (cacheado) =>
        cacheado ??
        fetch(request).then((resposta) => {
          if (resposta.ok && (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons'))) {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
          }
          return resposta;
        }),
    ),
  );
});
