import {
    onAuth, loginWithGoogle, logout, getUserProfile, updateUserProfile,
    subscribeToStock, updateStock, initializeDefaultStock, createStockItem, deleteStockItem,
    placeOrder, subscribeToOrders, updateOrderStatus
} from './firebase-service.js';
import { initMap, updateOrderMarkers, focusMarker, updateDriverLocation, drawRoute, clearRoute } from './map-service.js';

/**
 * --- OCEAN APP STATE ---
 */
let currentUser = null;
let currentProfile = null;
let activeRole = null;
let stockData = {};
let activeOrders = [];
let watchId = null;
let driverLocation = null;
let currentNavOrderId = null;

// --- DOM ELEMENTS ---
const screens = {
    auth: document.getElementById('auth-screen'),
    roleSelect: document.getElementById('role-selection-screen'),
    main: document.getElementById('main-app')
};

const views = {
    client: document.getElementById('view-client'),
    supplier: document.getElementById('view-supplier'),
    driver: document.getElementById('view-driver'),
    setup: document.getElementById('view-setup')
};

const buttons = {
    client: document.getElementById('nav-btn-client'),
    supplier: document.getElementById('nav-btn-supplier'),
    driver: document.getElementById('nav-btn-driver'),
    setup: document.getElementById('btn-global-setup'),
    // Mobile buttons
    m_client: document.getElementById('mobile-btn-client'),
    m_supplier: document.getElementById('mobile-btn-supplier'),
    m_driver: document.getElementById('mobile-btn-driver'),
    m_setup: document.getElementById('mobile-btn-setup')
};

const labels = {
    role: document.getElementById('label-role'),
    avatar: document.getElementById('user-avatar')
};

const containers = {
    clientStock: document.getElementById('client-stock-grid'),
    supplierStock: document.getElementById('supplier-stock-list'),
    driverOrders: document.getElementById('driver-orders-list'),
    catalogueList: document.getElementById('ocean-catalogue-list')
};

/**
 * --- INITIALIZATION ---
 */
async function init() {
    // 1. Auth Observer
    onAuth(async (user) => {
        if (user) {
            currentUser = user;
            labels.avatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;

            // 2. Fetch/Create Profile
            currentProfile = await getUserProfile(user.uid);
            if (!currentProfile) {
                currentProfile = {
                    name: user.displayName,
                    email: user.email,
                    role: null,
                    address: '',
                    phone: '',
                    vehicle: '',
                    vehicleType: ''
                };
                await updateUserProfile(user.uid, currentProfile);
            }

            // 3. Flow logic
            showScreen('roleSelect');
            if (currentProfile.role) {
                switchToRole(currentProfile.role);
            }
        } else {
            showScreen('auth');
            currentUser = null;
            currentProfile = null;
        }
    });

    // 4. Bind Events
    document.getElementById('btn-login-google').onclick = () => loginWithGoogle();
    document.getElementById('btn-logout').onclick = () => logout();
    buttons.setup.onclick = () => showSection('setup'); // Use the new buttons object

    document.querySelectorAll('.role-selector').forEach(btn => {
        btn.onclick = async () => {
            const role = btn.dataset.role;
            await updateUserProfile(currentUser.uid, { role });
            currentProfile.role = role;
            switchToRole(role);
        };
    });

    // Desktop nav buttons
    ['client', 'supplier', 'driver'].forEach(role => {
        buttons[role].onclick = () => switchToRole(role);
    });

    // Mobile nav buttons
    ['m_client', 'm_supplier', 'm_driver'].forEach(btnKey => {
        buttons[btnKey].onclick = () => switchToRole(btnKey.substring(2)); // Extract role from 'm_role'
    });
    buttons.m_setup.onclick = () => showSection('setup');


    setupSetupForms();

    // 5. Data Subscriptions
    subscribeToStock((data) => {
        stockData = data || {};
        renderAllViews();
    });

    subscribeToOrders((orders) => {
        activeOrders = orders;
        renderDriverView();
        updateOrderMarkers(orders);
    });

    // 6. Init Map
    initMap('map');
    await initializeDefaultStock();
}

/**
 * --- UI NAVIGATION ---
 */

function showScreen(screenKey) {
    Object.keys(screens).forEach(k => {
        screens[k].classList.toggle('hidden', k !== screenKey);
    });
}

function switchToRole(role) {
    activeRole = role;
    showScreen('main');
    showSection(role);
    labels.role.innerText = `${role.toUpperCase()} VIEW`;

    // Update Desktop Nav Buttons
    ['client', 'supplier', 'driver'].forEach(r => {
        buttons[r].classList.toggle('bg-white', r === role);
        buttons[r].classList.toggle('shadow-sm', r === role);
        buttons[r].classList.toggle('text-primary', r === role);
        buttons[r].classList.toggle('text-slate-500', r !== role);
    });

    // Update Mobile Nav Buttons
    const mobileKeys = { client: 'm_client', supplier: 'm_supplier', driver: 'm_driver' };
    Object.entries(mobileKeys).forEach(([key, btnKey]) => {
        const btn = buttons[btnKey];
        if (btn) {
            if (key === role) {
                btn.classList.add('text-indigo-600');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.remove('text-indigo-600');
                btn.classList.add('text-slate-400');
            }
        }
    });
    // Ensure mobile setup button is not highlighted when switching roles
    if (buttons.m_setup) {
        buttons.m_setup.classList.remove('text-indigo-600');
        buttons.m_setup.classList.add('text-slate-400');
    }

    // Refresh Profile fields in setup
    populateSetupFields();
}

function showSection(sectionKey) {
    Object.keys(views).forEach(k => {
        views[k].classList.toggle('hidden', k !== sectionKey);
    });

    // Special case for mobile setup button highlighting
    if (sectionKey === 'setup') {
        const mSetup = buttons['m_setup'];
        if (mSetup) {
            mSetup.classList.add('text-indigo-600');
            mSetup.classList.remove('text-slate-400');
            // Deactivate other mobile role buttons
            ['m_client', 'm_supplier', 'm_driver'].forEach(k => {
                buttons[k]?.classList.remove('text-indigo-600');
                buttons[k]?.classList.add('text-slate-400');
            });
        }
    } else {
        // If not setup, ensure mobile setup button is not highlighted
        if (buttons.m_setup) {
            buttons.m_setup.classList.remove('text-indigo-600');
            buttons.m_setup.classList.add('text-slate-400');
        }
    }

    // Explicit map resize
    if (sectionKey === 'driver') {
        // Use requestAnimationFrame for more robust map resizing, especially on mobile
        requestAnimationFrame(() => {
            setTimeout(() => {
                const mapEl = document.getElementById('map');
                if (mapEl) window.dispatchEvent(new Event('resize'));
            }, 300);
        });
        startLocationTracking();
    } else {
        stopLocationTracking();
    }
}

/**
 * --- RENDERING ---
 */

function renderAllViews() {
    renderClientView();
    renderSupplierView();
    renderCatalogueList();
}

function renderClientView() {
    containers.clientStock.innerHTML = '';
    const addressLabel = document.getElementById('client-setup-summary');
    addressLabel.innerText = currentProfile?.address ? `📍 ${currentProfile.address.substring(0, 20)}...` : '📍 Set Delivery Address';
    addressLabel.onclick = () => showSection('setup');

    Object.entries(stockData).forEach(([id, item]) => {
        const isSoldOut = item.quantity <= 0;
        const card = document.createElement('div');
        card.className = `role-card bg-white p-4 rounded-[2rem] border shadow-sm transition-all group ${isSoldOut ? 'opacity-60' : ''}`;
        card.innerHTML = `
            <div class="relative h-48 rounded-[1.5rem] overflow-hidden bg-slate-100 mb-4">
                <img src="${item.image}" class="w-full h-full object-cover transition-transform group-hover:scale-110" onerror="this.src='https://placehold.co/600x400?text=${encodeURIComponent(item.name)}'">
                ${isSoldOut ? '<div class="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center"><span class="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black">OUT OF STOCK</span></div>' : ''}
            </div>
            <div class="px-2">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-lg leading-tight">${item.name}</h3>
                    <div class="text-right">
                        <span class="text-primary font-black block leading-none">RM ${item.price}</span>
                        <span class="text-[9px] uppercase font-bold text-slate-400">per ${item.unit}</span>
                    </div>
                </div>
                <button 
                    onclick="handleOrder('${id}', '${item.name}')"
                    ${isSoldOut ? 'disabled' : ''}
                    class="w-full py-3 rounded-2xl font-bold transition-all ${isSoldOut ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'}"
                >
                    Order Now
                </button>
            </div>
        `;
        containers.clientStock.appendChild(card);
    });
}

function renderSupplierView() {
    containers.supplierStock.innerHTML = '';
    Object.entries(stockData).forEach(([id, item]) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors";
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <img src="${item.image}" class="w-12 h-12 rounded-xl object-cover" onerror="this.src='https://placehold.co/100x100?text=IMG'">
                    <span class="font-bold text-slate-700">${item.name}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">${item.quantity} ${item.unit}</span>
            </td>
            <td class="px-6 py-4">
                <input type="number" id="qty-${id}" value="${item.quantity}" class="w-20 px-3 py-2 bg-slate-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-primary outline-none">
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="handleStockUpdate('${id}')" class="bg-dark text-white text-xs font-bold px-4 py-2 rounded-lg hover:shadow-lg transition-all">SAVE</button>
            </td>
        `;
        containers.supplierStock.appendChild(tr);
    });
}

function renderDriverView() {
    containers.driverOrders.innerHTML = '';
    activeOrders.forEach(order => {
        const isPickedUp = order.status === 'picked_up';
        const isNavigating = currentNavOrderId === order.id;

        const div = document.createElement('div');
        div.className = `p-5 rounded-3xl border shadow-sm transition-all group ${isPickedUp ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`;

        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div onclick="handleFocusOrder('${order.id}')" class="cursor-pointer">
                    <h4 class="font-bold group-hover:text-primary transition-colors">${order.itemName}</h4>
                    <p class="text-[10px] text-slate-400 font-bold uppercase">${order.customerName}</p>
                </div>
                <span class="text-[10px] font-black uppercase ${isPickedUp ? 'text-indigo-600' : 'text-emerald-500'} ${isPickedUp ? 'bg-indigo-100' : 'bg-emerald-50'} px-2 py-1 rounded-md">
                    ${order.status}
                </span>
            </div>
            <div class="text-xs text-slate-400 flex items-center space-x-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>${order.address || 'Kuching Area'}</span>
            </div>
            
            <div class="flex space-x-2">
                ${!isPickedUp ? `
                    <button onclick="handlePickup('${order.id}')" class="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all">
                        PICKUP
                    </button>
                ` : `
                    <button onclick="handleComplete('${order.id}')" class="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all">
                        COMPLETE
                    </button>
                `}
                <button onclick="handleFocusOrder('${order.id}')" class="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
            </div>
        `;
        containers.driverOrders.appendChild(div);
    });
}

function renderCatalogueList() {
    containers.catalogueList.innerHTML = '';
    Object.entries(stockData).forEach(([id, item]) => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3 bg-slate-50 rounded-xl group";
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${item.image}" class="w-8 h-8 rounded-lg object-cover">
                <span class="text-sm font-bold text-slate-600">${item.name}</span>
            </div>
            <button onclick="handleDeleteItem('${id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        `;
        containers.catalogueList.appendChild(div);
    });
}

/**
 * --- SETUP & FORMS ---
 */

function setupSetupForms() {
    // Client Form
    document.getElementById('setup-client-form').onsubmit = async (e) => {
        e.preventDefault();
        const address = document.getElementById('setup-client-address').value;
        const phone = document.getElementById('setup-client-phone').value;
        await updateUserProfile(currentUser.uid, { address, phone });
        currentProfile.address = address;
        currentProfile.phone = phone;
        alert("Client profile updated!");
        renderClientView();
    };

    // Driver Form
    document.getElementById('setup-driver-form').onsubmit = async (e) => {
        e.preventDefault();
        const vehicle = document.getElementById('setup-driver-vehicle').value;
        const vehicleType = document.getElementById('setup-driver-type').value;
        await updateUserProfile(currentUser.uid, { vehicle, vehicleType });
        alert("Driver identity verified!");
    };

    // Catalogue Form (Ocean)
    document.getElementById('form-add-item-ocean').onsubmit = async (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('ocean-item-name').value,
            price: parseFloat(document.getElementById('ocean-item-price').value),
            unit: document.getElementById('ocean-item-unit').value,
            image: document.getElementById('ocean-item-image').value,
            quantity: 10 // Default initial stock
        };
        await createStockItem(newItem);
        e.target.reset();
        alert("Added to Ocean!");
    };
}

function populateSetupFields() {
    if (!currentProfile) return;
    document.getElementById('setup-client-address').value = currentProfile.address || '';
    document.getElementById('setup-client-phone').value = currentProfile.phone || '';
    document.getElementById('setup-driver-vehicle').value = currentProfile.vehicle || '';
    document.getElementById('setup-driver-type').value = currentProfile.vehicleType || 'Motorcycle';
}

function startLocationTracking() {
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            driverLocation = [latitude, longitude];
            updateDriverLocation(latitude, longitude);

            // If navigating, update route
            if (currentNavOrderId) {
                const order = activeOrders.find(o => o.id === currentNavOrderId);
                if (order && order.location) {
                    drawRoute(driverLocation, [order.location.lat, order.location.lng]);
                }
            }
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
    );
}

function stopLocationTracking() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    clearRoute();
}

/**
 * --- GLOBAL HANDLERS ---
 */

window.handlePickup = async (orderId) => {
    try {
        await updateOrderStatus(orderId, 'picked_up');
        currentNavOrderId = orderId;

        const order = activeOrders.find(o => o.id === orderId);
        if (order && order.location && driverLocation) {
            drawRoute(driverLocation, [order.location.lat, order.location.lng]);
        }
    } catch (err) {
        console.error(err);
    }
};

window.handleComplete = async (orderId) => {
    try {
        const orderRef = doc(getFirestore(), "orders", orderId);
        await setDoc(orderRef, { status: 'delivered' }, { merge: true });
        if (currentNavOrderId === orderId) {
            currentNavOrderId = null;
            clearRoute();
        }
    } catch (err) {
        console.error(err);
    }
};

window.handleFocusOrder = (id) => focusMarker(id);

window.handleOrder = async (id, name) => {
    if (!currentProfile.address) {
        alert("Please set your delivery address in Setup first!");
        showSection('setup');
        return;
    }

    try {
        const currentQty = stockData[id].quantity;
        if (currentQty > 0) {
            await updateStock(id, currentQty - 1);
            await placeOrder({
                itemId: id,
                itemName: name,
                customerName: currentProfile.name,
                address: currentProfile.address,
                phone: currentProfile.phone
            });
            alert(`Order successful! A driver will pick up your ${name} soon.`);
        }
    } catch (err) {
        console.error(err);
    }
};

window.handleStockUpdate = async (id) => {
    const qty = parseInt(document.getElementById(`qty-${id}`).value);
    if (!isNaN(qty) && qty >= 0) {
        await updateStock(id, qty);
        const btn = event.target;
        btn.innerText = "SAVED!";
        btn.classList.add('bg-emerald-500');
        setTimeout(() => {
            btn.innerText = "SAVE";
            btn.classList.remove('bg-emerald-500');
        }, 1500);
    }
};

window.handleDeleteItem = async (id) => {
    if (confirm(`Remove ${id} from Ocean?`)) {
        await deleteStockItem(id);
    }
};

window.showRoleSelection = () => showScreen('roleSelect');
window.logout = () => logout();
window.showSection = (key) => showSection(key);

// Start App
init();
