// Service Worker：HTML 网络优先（保证更新），静态资源缓存优先；离线可用
const CACHE = 'impromptu-v1';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(fetch(req).then(resp => { const c = resp.clone(); caches.open(CACHE).then(ca => ca.put(req, c)).catch(()=>{}); return resp; })
      .catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(resp => {
      const c = resp.clone(); caches.open(CACHE).then(ca => ca.put(req, c)).catch(()=>{}); return resp; })));
  }
});
