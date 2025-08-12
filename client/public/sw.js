// Service Worker para cache offline básico
const CACHE_NAME = 'erp-edunexia-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/favicon.ico'
];

// Install event - cache recursos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install error:', error);
      })
  );
});

// Fetch event - servir do cache quando offline
self.addEventListener('fetch', (event) => {
  // Só cachear requests GET
  if (event.request.method !== 'GET') return;
  
  // Não cachear APIs
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível, senão buscar da rede
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Se offline, retornar página offline para navegação
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});