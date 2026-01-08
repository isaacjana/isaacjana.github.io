const CACHE = 'pw-v1';
const FILES = ['/', '/index.html', '/app.js', 'https://cdn.tailwindcss.com', 'https://code.jquery.com/jquery-3.6.0.min.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
