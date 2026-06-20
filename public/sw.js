/* =====================================================================
   Service worker do Tatá House (PWA offline). Sem dependências.
   - Guarda a "casca" do app (HTML/JS/CSS/ícones) para abrir sem internet.
   - Navegações: rede primeiro, cache como reserva.
   - Demais arquivos do próprio site: cache primeiro, rede como reserva.
   - Chamadas ao Supabase e a outros domínios passam direto pela rede.
   ===================================================================== */

const CACHE = 'tata-house-v1';
const ESSENCIAIS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copia)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/'))),
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(
      (cacheado) =>
        cacheado ||
        fetch(request)
          .then((resp) => {
            if (resp && resp.status === 200 && resp.type === 'basic') {
              const copia = resp.clone();
              caches.open(CACHE).then((c) => c.put(request, copia)).catch(() => {});
            }
            return resp;
          })
          .catch(() => cacheado),
    ),
  );
});
