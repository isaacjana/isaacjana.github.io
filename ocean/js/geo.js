/**
 * Ocean - maps, routing and address lookup.
 * Leaflet + OpenStreetMap tiles, OSRM for the road route, Nominatim for
 * address search. No API keys. Every network call has a plain fallback so
 * tracking keeps working when a service is unreachable.
 */
const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet';
let leafletReady = null;

export function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletReady) return leafletReady;
    leafletReady = new Promise((resolve, reject) => {
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = LEAFLET + '.css';
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.src = LEAFLET + '.js';
        js.onload = () => resolve(window.L);
        js.onerror = () => { leafletReady = null; reject(new Error('The map could not be loaded. Check your connection.')); };
        document.head.appendChild(js);
    });
    return leafletReady;
}

export async function makeMap(el, center, zoom = 14) {
    const L = await loadLeaflet();
    const map = L.map(el, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // The container is usually still animating into place when the map is made
    setTimeout(() => map.invalidateSize(), 350);
    return map;
}

/** A round emoji pin: no image downloads needed. */
export function pin(emoji, kind = '') {
    return window.L.divIcon({ className: '', html: `<div class="map-pin ${kind}">${emoji}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
}

export function haversineKm(a, b) {
    const R = 6371, rad = (d) => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Road route between two points.
 * Returns { path: [[lat, lng], ...], km, min, exact }.
 * Falls back to a straight line with an estimated time when the routing
 * service cannot be reached.
 */
export async function route(from, to) {
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`, { signal: ctrl.signal });
        clearTimeout(timer);
        const r = (await res.json()).routes[0];
        return { path: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), km: r.distance / 1000, min: Math.max(1, Math.round(r.duration / 60)), exact: true };
    } catch (e) {
        const km = haversineKm(from, to) * 1.3; // roads are longer than the straight line
        return { path: [[from.lat, from.lng], [to.lat, to.lng]], km, min: Math.max(1, Math.round(km / 30 * 60)), exact: false };
    }
}

/** Address -> coordinates (Malaysia). Returns null when nothing is found. */
export async function geocode(text) {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=my&q=${encodeURIComponent(text)}`);
    const hit = (await res.json())[0];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name } : null;
}

export function getPosition(options) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('This device does not support location.'));
        navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            (e) => reject(new Error(geoErrorText(e))),
            { enableHighAccuracy: true, timeout: 15000, ...options });
    });
}

export function geoErrorText(e) {
    if (e && e.code === 1) return 'Location permission is blocked. Allow location for this site in your browser settings.';
    if (e && e.code === 3) return 'Could not get a GPS fix in time. Move to open sky and try again.';
    return 'Location is unavailable right now.';
}

/** Google Maps turn-by-turn link: coordinates when we have them, otherwise the address. */
export function navLink(dest, address) {
    const d = dest ? `${dest.lat},${dest.lng}` : encodeURIComponent(address || '');
    return `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=driving`;
}

/** Slide a marker to a new position instead of jumping. */
export function glide(marker, to, duration = 900) {
    const from = marker.getLatLng();
    const start = performance.now();
    cancelAnimationFrame(marker._glide);
    const step = (now) => {
        const k = Math.min(1, (now - start) / duration);
        marker.setLatLng([from.lat + (to.lat - from.lat) * k, from.lng + (to.lng - from.lng) * k]);
        if (k < 1) marker._glide = requestAnimationFrame(step);
    };
    marker._glide = requestAnimationFrame(step);
}
