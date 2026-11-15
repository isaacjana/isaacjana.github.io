const CACHE_NAME = 'munch-v6';
const ASSETS = ['./', './index.html', './app.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return; 
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

// Remove caches from older versions so updated files are served
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});
