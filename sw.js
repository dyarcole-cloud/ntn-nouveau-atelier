// NTN Nouveau · Service Worker · v2-onyx
// Network-first for HTML so updates show immediately on reload;
// cache-first for static assets (icons, manifest, fonts via CDN).

const CACHE = 'nouveau-v2-onyx-2026-05-18';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-maskable.svg', '/apple-touch-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache Anthropic API or other dynamic third-party APIs
  if (url.host.includes('api.anthropic.com')) return;

  // Network-first for navigation / HTML — keeps the app fresh
  if (req.mode === 'navigate' || (req.destination === 'document') || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Cache-first for everything else (icons, manifest, fonts, scripts)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && (url.origin === self.location.origin || res.type === 'cors' || res.type === 'basic')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
