const CACHE_NAME = 'munch-v1';
const ASSETS = ['./', './index.html', './app.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', 'https://cdn.tailwindcss.com', 'https://code.jquery.com/jquery-3.7.1.min.js'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); });
self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request).catch(async () => {
        const c = await caches.open(CACHE_NAME); return c.match('./index.html');
    })));
});
