// Service Worker otimizado para ERP EdunexIA
const CACHE_NAME = 'erp-edunexia-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';

// URLs críticas para cache
const CRITICAL_URLS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Install - Cache recursos críticos sem bloquear
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CRITICAL_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.log('SW install cache error:', err))
  );
});

// Activate - Limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => 
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
      .catch(err => console.log('SW activate error:', err))
  );
});

// Fetch - Estratégia simples e eficiente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests externos e específicos
  if (!url.origin.includes(self.location.origin) || 
      url.pathname.includes('replit') ||
      url.pathname.includes('hot-update')) {
    return;
  }

  // Network-first com fallback para offline
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone))
            .catch(err => console.log('Cache put error:', err));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cachedResponse => {
            return cachedResponse || caches.match('/offline.html');
          });
      })
  );
});