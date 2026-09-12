// ============================================================================
// UNIHUB — SERVICE WORKER
// ============================================================================
// Objetivo simple: que la app cargue rápido y funcione como "app instalada"
// (ícono en el escritorio/celular, sin la barra del navegador), con algo de
// tolerancia a conexión inestable.
//
// A propósito NO cacheamos nada que no sea del propio sitio (ni las llamadas
// a Supabase ni ninguna petición externa): los datos del marketplace
// (productos, pedidos, sesión) siempre deben pedirse en vivo, nunca servirse
// desde una copia vieja guardada en el dispositivo.
//
// Si cambias esto y quieres que los navegadores descarten la caché anterior,
// sube el número de CACHE_NAME (v1 -> v2, etc.).
// ============================================================================

const CACHE_NAME = 'unihub-cache-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        /* si algo del app shell falla al precachear, no bloqueamos la instalación */
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo GET, y solo del mismo origen (assets estáticos: JS, CSS, imágenes, ícono).
  // Todo lo demás (Supabase, APIs externas, POST/PUT/DELETE) pasa directo a la red.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached);

      // "Stale-while-revalidate": si hay copia en caché, se muestra al instante
      // (rápido, funciona sin internet) y de fondo se actualiza con la red.
      return cached || networkFetch;
    })
  );
});
