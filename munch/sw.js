const CACHE_NAME = 'munch-v5-final';
const ASSETS = ['./', './index.html', './app.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return; 
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
