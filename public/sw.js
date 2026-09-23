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

const CACHE_NAME = 'unihub-cache-v2';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

// Si la red tarda más que esto, dejamos de esperarla y usamos lo que haya en
// caché (o el "app shell" si es la primera carga de esa página). Sin este
// límite, un 4G lento o inestable puede dejar la pantalla de inicio (el
// ícono) pegada indefinidamente, porque el fetch nunca llega a resolverse.
const NETWORK_TIMEOUT_MS = 4000;

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network timeout')), ms);
    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

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
      const networkFetch = fetchWithTimeout(request, NETWORK_TIMEOUT_MS)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // La red falló o se demoró demasiado. Si había una copia en caché
          // de esta misma URL, ya se habría usado más abajo (cached ||
          // networkFetch) — este catch solo corre cuando NO había copia.
          // Para una navegación (abrir la app / una ruta nueva), en vez de
          // dejar la pantalla colgada le damos el "app shell" para que la
          // aplicación al menos arranque, y ella misma pida sus datos en
          // vivo apenas tenga conexión.
          if (request.mode === 'navigate') {
            const shell = await caches.match('/');
            if (shell) return shell;
          }
          return Response.error();
        });

      // "Stale-while-revalidate": si hay copia en caché, se muestra al instante
      // (rápido, funciona sin internet) y de fondo se actualiza con la red.
      return cached || networkFetch;
    })
  );
});
