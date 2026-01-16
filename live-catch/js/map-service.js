/**
 * Map Service for Ocean
 * Handles Leaflet map, live tracking, and navigation lines
 */

let map;
let markers = {};
let driverMarker = null;
let routingLine = null;

export function initMap(elementId) {
    if (map) return map; // Prevent re-initialization

    // Center of Kuching, Sarawak
    const kuchingCoords = [1.5533, 110.3592];

    map = L.map(elementId, {
        zoomControl: false // We'll add it to top-right for cleaner mobile UI
    }).setView(kuchingCoords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Base Marker (HQ)
    L.marker(kuchingCoords, {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [30, 30]
        })
    }).addTo(map).bindPopup('Ocean HQ (Gala City)');

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

    // Update/Add markers for all active orders
    orders.forEach(order => {
        if (!order.location) return;

        const isPickedUp = order.status === 'picked_up';
        const color = isPickedUp ? 'blue' : 'red';

        if (markers[order.id]) {
            markers[order.id].setLatLng([order.location.lat, order.location.lng]);
        } else {
            const marker = L.marker([order.location.lat, order.location.lng], {
                icon: L.icon({
                    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }).addTo(map);

            marker.bindPopup(`<b>${order.itemName}</b><br>${order.address}<br>Status: ${order.status}`);
            markers[order.id] = marker;
        }
    });
}

export function updateDriverLocation(lat, lng) {
    if (!map) return;

    if (!driverMarker) {
        driverMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Delivery truck icon
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
            zIndexOffset: 1000
        }).addTo(map);
        driverMarker.bindPopup('Your Current Location');
    } else {
        driverMarker.setLatLng([lat, lng]);
    }
}

export function drawRoute(start, end) {
    if (!map) return;
    if (routingLine) map.removeLayer(routingLine);

    routingLine = L.polyline([start, end], {
        color: '#6366f1',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(map);

    map.fitBounds(routingLine.getBounds(), { padding: [50, 50] });
}

export function clearRoute() {
    if (routingLine) map.removeLayer(routingLine);
    routingLine = null;
}

export function focusMarker(orderId) {
    if (markers[orderId]) {
        map.invalidateSize();
        map.setView(markers[orderId].getLatLng(), 16);
        markers[orderId].openPopup();
    }
}

export function refreshMap() {
    if (map) map.invalidateSize();
}
