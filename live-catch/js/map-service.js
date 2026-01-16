/**
 * ============================================
 * OCEAN ECOSYSTEM - MAP SERVICE
 * Leaflet Integration for Delivery Tracking
 * ============================================
 * 
 * Features:
 * - Google Maps tiles (no API key required)
 * - Order markers with status colors
 * - Live driver location tracking
 * - Route visualization
 * - Interactive popups
 * 
 * Map Layers:
 * - Google Streets (default)
 * - Google Satellite/Hybrid
 * - OpenStreetMap fallback
 * 
 * Center: Kuching, Sarawak (1.5533, 110.3592)
 */

// ============================================
// MAP STATE
// ============================================
let map = null;
let markers = {};
let driverMarker = null;
let routingLine = null;

// ============================================
// TILE LAYERS
// ============================================

// Google Maps Tile Layers
const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Map data &copy; Google'
});

const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Map data &copy; Google'
});

const openStreet = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
});

export function initMap(elementId) {
    if (map) return map;

    // Center of Kuching, Sarawak
    const kuchingCoords = [1.5533, 110.3592];

    map = L.map(elementId, {
        zoomControl: false,
        layers: [googleStreets] // Default to Google Streets
    }).setView(kuchingCoords, 13);

    // Layer selection control
    const baseMaps = {
        "Google Streets": googleStreets,
        "Google Satellite": googleHybrid,
        "OpenStreetMap": openStreet
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom HQ Icon
    L.marker(kuchingCoords, {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [35, 35],
            iconAnchor: [17, 17]
        })
    }).addTo(map).bindPopup('<b>Ocean HQ (Gala City)</b><br>Supply Node Alpha');

    return map;
}

export function updateOrderMarkers(orders) {
    if (!map) return;

    // Remove defunct markers
    Object.keys(markers).forEach(id => {
        if (!orders.find(o => o.id === id)) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });

    // Update/Add markers
    orders.forEach(order => {
        if (!order.location) return;

        const isPickedUp = order.status === 'picked_up';
        const color = isPickedUp ? 'blue' : 'red';
        const latlng = [order.location.lat, order.location.lng];

        if (markers[order.id]) {
            markers[order.id].setLatLng(latlng);
        } else {
            const marker = L.marker(latlng, {
                icon: L.icon({
                    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                })
            }).addTo(map);

            marker.bindPopup(`
                <div class="p-2">
                    <h4 class="font-bold text-slate-800">${order.itemName}</h4>
                    <p class="text-xs text-slate-500 mb-2">${order.address}</p>
                    <span class="text-[9px] font-black uppercase px-2 py-1 rounded bg-slate-100">${order.status}</span>
                </div>
            `);
            markers[order.id] = marker;
        }
    });
}

export function updateDriverLocation(lat, lng) {
    if (!map) return;

    if (!driverMarker) {
        driverMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
                iconSize: [45, 45],
                iconAnchor: [22, 22]
            }),
            zIndexOffset: 1000
        }).addTo(map);
        driverMarker.bindPopup('<b>Driver Location</b>');
    } else {
        driverMarker.setLatLng([lat, lng]);
    }
}

export function drawRoute(start, end) {
    if (!map) return;
    if (routingLine) map.removeLayer(routingLine);

    routingLine = L.polyline([start, end], {
        color: '#6366f1',
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 15',
        lineCap: 'round'
    }).addTo(map);

    map.fitBounds(routingLine.getBounds(), { padding: [100, 100], animate: true });
}

export function clearRoute() {
    if (routingLine) map.removeLayer(routingLine);
    routingLine = null;
}

export function focusMarker(orderId) {
    if (markers[orderId]) {
        map.invalidateSize();
        map.setView(markers[orderId].getLatLng(), 16, { animate: true });
        markers[orderId].openPopup();
    }
}

export function refreshMap() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }
}
