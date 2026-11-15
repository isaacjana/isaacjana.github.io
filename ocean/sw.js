/**
 * Ocean - service worker.
 * Lets the app open with no signal (a driver in a dead zone). Pages and
 * scripts are fetched fresh when online and fall back to the saved copy when
 * not, so an update is never held back by the cache. Map tiles and the
 * database are left alone: Firestore keeps its own offline copy.
 */
const CACHE = 'ocean-v1';
const SHELL = [
    './', 'index.html', 'track.html', 'manifest.json', 'css/app.css', 'assets/logo.png', 'assets/icon-192.png',
    'js/app.js', 'js/config.js', 'js/extras.js', 'js/flow.js', 'js/geo.js', 'js/i18n.js', 'js/model.js',
    'js/store.js', 'js/track.js', 'js/trackview.js', 'js/ui.js', '../invoice/invoice-pdf.js'
];
const LIBRARIES = /^https:\/\/(www\.gstatic\.com\/firebasejs|unpkg\.com\/leaflet|cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf)/;

self.addEventListener('install', (event) => {
    // One missing file must not stop the rest from being saved
    event.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => { })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ocean-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const sameSite = new URL(req.url).origin === location.origin;
    if (!sameSite && !LIBRARIES.test(req.url)) return;
    const save = (res) => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
    };
    if (sameSite) {
        // Our own files: network first, saved copy when offline
        event.respondWith(fetch(req).then(save).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
    } else {
        // Versioned libraries never change: saved copy first
        event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save)));
    }
});

// Tapping an alert brings Ocean to the front
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('./'))));
});
