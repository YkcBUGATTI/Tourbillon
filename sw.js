/* Bugatti Tourbillon · Service Worker（离线缓存） */
const CACHE = 'tourbillon-v3';
const CORE = [
  './',
  './index.html',
  './en.html',
  './css/style.css',
  './css/luxury.css',
  './js/main.js',
  './js/luxury.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './fonts/bugatti-display-400.woff2',
  './fonts/bugatti-text-400.woff2',
  './fonts/bugatti-text-700.woff2',
  './fonts/bugatti-mono-400.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; /* 外链不拦截 */
  /* 视频不缓存（体积大），走网络 */
  if (e.request.url.includes('.mp4')) return;

  if (e.request.mode === 'navigate') {
    /* HTML：网络优先，离线回退缓存 */
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* 静态资源：缓存优先，未命中回源并缓存 */
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
