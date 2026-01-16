/**
 * Map Service for LiveCatch
 * Handles Leaflet map initialization and markers
 */

let map;
let markers = {};

export function initMap(elementId) {
    // Center of Kuching, Sarawak
    const kuchingCoords = [1.5533, 110.3592];

    map = L.map(elementId).setView(kuchingCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a custom marker for the "Home/Store" base
    L.marker(kuchingCoords, {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup('<b>LiveCatch HQ</b><br>Kuching Main Port');

    return map;
}

export function updateOrderMarkers(orders) {
    if (!map) return;

    // Remove markers that are no longer in the orders list
    Object.keys(markers).forEach(id => {
        if (!orders.find(o => o.id === id)) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });

    // Add or update markers
    orders.forEach(order => {
        if (!order.location) return;

        const { lat, lng } = order.location;

        if (markers[order.id]) {
            markers[order.id].setLatLng([lat, lng]);
        } else {
            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map);

            marker.bindPopup(`
                <div class="p-2">
                    <h4 class="font-bold border-b pb-1 mb-1">${order.itemName}</h4>
                    <p class="text-xs">Qty: ${order.quantity}</p>
                    <p class="text-xs text-gray-500">Status: ${order.status}</p>
                </div>
            `);

            markers[order.id] = marker;
        }
    });

    // Fit bounds if there are markers
    if (orders.length > 0) {
        const group = new L.featureGroup(Object.values(markers));
        // map.fitBounds(group.getBounds().pad(0.1));
    }
}

export function focusMarker(orderId) {
    if (markers[orderId]) {
        map.setView(markers[orderId].getLatLng(), 15);
        markers[orderId].openPopup();
    }
}
