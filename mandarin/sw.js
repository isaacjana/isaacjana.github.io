const CACHE_NAME = 'mandarin-flow-v1';
const ASSETS = [
    './',
    './index.html',
    './index.css',
    './js/app.js',
    './js/ProgressManager.js',
    './js/CanvasEngine.js',
    './js/ToneEngine.js',
    './data/curriculum.json',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+SC:wght@500;700&family=ZCOOL+KuaiLe&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
