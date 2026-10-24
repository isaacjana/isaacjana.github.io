// Oratio service worker: app shell works offline (handy in a church with no signal).
const CACHE = 'oratio-v1';
const SHELL = ['./', 'index.html', 'prayerData.js', 'prayerEngine.js', 'massData.js', 'massEngine.js', 'massView.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

// Stale-while-revalidate for the shell and CDN assets (Tailwind, fonts)
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        const network = fetch(e.request).then(res => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
            return res;
        }).catch(() => cached);
        return cached || network;
    }));
});
