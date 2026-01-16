import {
    subscribeToStock,
    updateStock,
    initializeDefaultStock,
    placeOrder,
    subscribeToOrders
} from './firebase-service.js';
import { initMap, updateOrderMarkers, focusMarker } from './map-service.js';

// --- State Management ---
let currentRole = 'client';
let stockData = {};
let activeOrders = [];

// --- DOM Elements ---
const buttons = {
    client: document.getElementById('btn-client'),
    supplier: document.getElementById('btn-supplier'),
    driver: document.getElementById('btn-driver')
};

const sections = {
    client: document.getElementById('client-view'),
    supplier: document.getElementById('supplier-view'),
    driver: document.getElementById('driver-view')
};

const containers = {
    stockGrid: document.getElementById('stock-grid'),
    supplierStockList: document.getElementById('supplier-stock-list'),
    ordersList: document.getElementById('orders-list'),
    activeOrdersCount: document.getElementById('active-orders-count'),
    queueCount: document.getElementById('queue-count')
};

// --- Initialization ---

async function init() {
    setupRoleSwitcher();
    await initializeDefaultStock();

    // Subscribe to stock updates
    subscribeToStock((data) => {
        stockData = data;
        renderClientView();
        renderSupplierView();
    });

    // Subscribe to orders
    subscribeToOrders((orders) => {
        activeOrders = orders;
        renderDriverView();
        updateOrderMarkers(orders);
    });

    // Initialize Map (only once when driver view might be shown)
    initMap('map');
}

// --- UI Logic ---

function setupRoleSwitcher() {
    Object.keys(buttons).forEach(role => {
        buttons[role].addEventListener('click', () => {
            switchRole(role);
        });
    });
}

function switchRole(role) {
    currentRole = role;

    // Update buttons
    Object.keys(buttons).forEach(r => {
        if (r === role) {
            buttons[r].classList.add('bg-white', 'shadow-sm', 'text-primary');
            buttons[r].classList.remove('text-gray-500');
        } else {
            buttons[r].classList.remove('bg-white', 'shadow-sm', 'text-primary');
            buttons[r].classList.add('text-gray-500');
        }
    });

    // Update sections
    Object.keys(sections).forEach(r => {
        if (r === role) {
            sections[r].classList.remove('hidden');
            // Trigger map resize if driver view is shown
            if (role === 'driver') {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            }
        } else {
            sections[r].classList.add('hidden');
        }
    });
}

// --- Rendering Functions ---

function renderClientView() {
    containers.stockGrid.innerHTML = '';

    Object.entries(stockData).forEach(([id, item]) => {
        const isSoldOut = item.quantity <= 0;

        const card = document.createElement('div');
        card.className = `bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group ${isSoldOut ? 'opacity-75' : ''}`;

        card.innerHTML = `
            <div class="relative h-48 overflow-hidden bg-gray-100">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                ${isSoldOut ? `
                    <div class="absolute inset-0 bg-red-600/20 backdrop-blur-[2px] flex items-center justify-center">
                        <span class="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm tracking-widest uppercase">SOLD OUT</span>
                    </div>
                ` : ''}
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold text-dark">${item.name}</h3>
                    <span class="text-lg font-bold text-primary">RM ${item.price}</span>
                </div>
                <p class="text-sm text-gray-500 mb-4">Stock: <span class="font-semibold ${item.quantity < 5 ? 'text-red-500' : 'text-green-600'}">${item.quantity} ${item.unit}</span> left</p>
                
                <button 
                    onclick="handlePlaceOrder('${id}', '${item.name}')"
                    ${isSoldOut ? 'disabled' : ''}
                    class="w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 ${isSoldOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-primary/20'}"
                >
                    Order Now
                </button>
            </div>
        `;
        containers.stockGrid.appendChild(card);
    });
}

function renderSupplierView() {
    containers.supplierStockList.innerHTML = '';

    Object.entries(stockData).forEach(([id, item]) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <img src="${item.image}" class="w-10 h-10 rounded-lg object-cover">
                    <span class="font-semibold text-dark">${item.name}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${item.quantity} ${item.unit}
                </span>
            </td>
            <td class="px-6 py-4">
                <input type="number" id="input-${id}" value="${item.quantity}" 
                    class="w-24 px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
            </td>
            <td class="px-6 py-4 text-right">
                <button 
                    onclick="handleUpdateStock('${id}')"
                    class="bg-dark text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-black transition-colors"
                >
                    Update
                </button>
            </td>
        `;
        containers.supplierStockList.appendChild(tr);
    });
}

function renderDriverView() {
    containers.ordersList.innerHTML = '';
    const pending = activeOrders.filter(o => o.status === 'pending');

    containers.activeOrdersCount.innerText = activeOrders.length;
    containers.queueCount.innerText = pending.length;

    if (activeOrders.length === 0) {
        containers.ordersList.innerHTML = `
            <div class="text-center py-10 text-gray-400">
                <p>No active delivery requests.</p>
            </div>
        `;
        return;
    }

    activeOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = "bg-gray-50 border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors group";
        card.onclick = () => focusMarker(order.id);

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-dark group-hover:text-primary transition-colors">${order.itemName}</h4>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white border text-gray-500">${order.status}</span>
            </div>
            <div class="flex items-center text-xs text-gray-500 space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${new Date(order.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span>Qty: 1</span>
            </div>
        `;
        containers.ordersList.appendChild(card);
    });
}

// --- Action Handlers (Global scope for inline event handlers) ---

window.handlePlaceOrder = async (itemId, itemName) => {
    try {
        const orderData = {
            itemId,
            itemName,
            quantity: 1,
            customerName: "Value Customer", // In real app, get from auth
        };

        // Update stock (decrement)
        const currentQty = stockData[itemId].quantity;
        if (currentQty > 0) {
            await updateStock(itemId, currentQty - 1);
            await placeOrder(orderData);
            alert(`Order placed for ${itemName}!`);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to place order.");
    }
};

window.handleUpdateStock = async (itemId) => {
    const input = document.getElementById(`input-${itemId}`);
    const newQty = parseInt(input.value);

    if (isNaN(newQty) || newQty < 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    try {
        await updateStock(itemId, newQty);
        // Show subtle feedback instead of alert if possible
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "Saved!";
        btn.classList.replace('bg-dark', 'bg-green-600');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.replace('bg-green-600', 'bg-dark');
        }, 1500);
    } catch (err) {
        console.error(err);
        alert("Failed to update stock.");
    }
};

// Start the app
init();
