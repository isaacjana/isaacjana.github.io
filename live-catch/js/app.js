import {
    onAuth, loginWithGoogle, logout, getUserProfile, updateUserProfile,
    subscribeToStock, updateStock, initializeDefaultStock, createStockItem, deleteStockItem,
    placeOrder, subscribeToOrders, updateOrderStatus, updateOrderDriverLocation,
    recordAudit, addWholesaleClient, subscribeToClients, subscribeToAuditLog,
    subscribeToClientStock, createClientStockItem, cancelOrder
} from './firebase-service.js';
import { initMap, updateOrderMarkers, focusMarker, updateDriverLocation, drawRoute, clearRoute, refreshMap } from './map-service.js';

/**
 * --- OCEAN APP STATE ---
 */
let currentUser = null;
let currentProfile = null;
let activeClientId = null;
let clientStockData = {};
let activeOrders = [];
let driverLocation = null;
let watchId = null;
let currentNavOrderId = null;
let currentRole = 'client'; // Default
let stockData = {};
let clientStockUnsubscribe = null;

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
    setup: document.getElementById('view-setup'),
    analytics: document.getElementById('view-analytics')
};

const buttons = {
    client: document.getElementById('side-btn-client'),
    supplier: document.getElementById('side-btn-supplier'),
    driver: document.getElementById('side-btn-driver'),
    analytics: document.getElementById('side-btn-analytics'),
    setup: document.getElementById('side-btn-setup'),
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
    clientOrders: document.getElementById('client-active-orders'),
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
            updateGlobalUI();
            populateSetupFields();

            if (currentProfile.role) {
                switchToRole(currentProfile.role);
            } else {
                showScreen('roleSelect');
            }
        } else {
            showScreen('auth');
            currentUser = null;
            currentProfile = null;
        }
    });

    // 4. Bind Events
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) loginBtn.onclick = () => loginWithGoogle();

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.onclick = () => logout();

    if (buttons.setup) buttons.setup.onclick = () => showSection('setup');
    if (buttons.analytics) buttons.analytics.onclick = () => showSection('analytics');

    const clientSetupBtn = document.getElementById('client-setup-summary');
    if (clientSetupBtn) clientSetupBtn.onclick = () => {
        showSection('setup');
        showSetupTab('profile');
    };

    document.querySelectorAll('.role-selector').forEach(btn => {
        btn.onclick = async () => {
            const role = btn.dataset.role;
            await updateUserProfile(currentUser.uid, { role });
            currentProfile.role = role;
            switchToRole(role);
        };
    });

    // Desktop side nav buttons
    ['client', 'supplier', 'driver'].forEach(role => {
        if (buttons[role]) {
            buttons[role].onclick = () => switchToRole(role);
        }
    });

    // Mobile nav buttons
    ['m_client', 'm_supplier', 'm_driver', 'm_setup'].forEach(btnKey => {
        if (buttons[btnKey]) {
            buttons[btnKey].onclick = () => {
                const target = btnKey === 'm_setup' ? 'setup' : btnKey.substring(2);
                if (target === 'setup') showSection('setup');
                else switchToRole(target);
            };
        }
    });

    setupSetupForms();
    setupBusinessLogic();

    // 5. Data Subscriptions
    subscribeToStock((data) => {
        stockData = data || {};
        renderAllViews();
    });

    subscribeToOrders((orders) => {
        activeOrders = orders;
        renderAllViews(); // Render all views to update active order lists
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
    currentRole = role;
    showScreen('main');
    showSection(role);
}

function updateGlobalUI() {
    if (!currentUser || !currentProfile) return;

    // Update Global Navigation Info
    const navName = document.getElementById('user-display-name');
    const navEmail = document.getElementById('user-display-email');
    if (navName) navName.innerText = currentProfile.name || currentUser.displayName || 'Ocean User';
    if (navEmail) navEmail.innerText = currentProfile.email || currentUser.email || 'user@ocean.my';

    const navAvatar = document.getElementById('user-avatar');
    if (navAvatar && (currentProfile.avatar || currentUser.photoURL)) {
        navAvatar.src = currentProfile.avatar || currentUser.photoURL;
    }
}


function showSection(sectionKey) {
    Object.keys(views).forEach(k => {
        if (views[k]) views[k].classList.toggle('hidden', k !== sectionKey);
    });

    if (sectionKey === 'setup') {
        const activeTab = document.querySelector('.setup-tab-btn.bg-white');
        if (!activeTab) showSetupTab('profile');
    }

    // Update Global UI (Name, Avatar, Sidebar)
    updateGlobalUI();

    // Side Navigation Highlighting
    const sideBtnKeys = ['client', 'supplier', 'driver', 'analytics', 'setup'];
    sideBtnKeys.forEach(key => {
        const btn = document.getElementById(`side-btn-${key}`);
        if (btn) {
            const isActive = (key === sectionKey);
            btn.classList.toggle('bg-slate-100', isActive);
            btn.classList.toggle('text-slate-800', isActive);
            btn.classList.toggle('text-slate-500', !isActive);
            btn.classList.toggle('bg-transparent', !isActive);
        }
    });

    // Dynamic Role Label in Header
    const roleLabel = document.getElementById('nav-current-role');
    if (roleLabel) {
        if (sectionKey === 'setup') roleLabel.innerText = "System Config";
        else if (sectionKey === 'analytics') roleLabel.innerText = "Audit & Intel";
        else roleLabel.innerText = `${sectionKey.toUpperCase()} VIEW`;
    }

    // Role Label in Sidebar
    if (labels.role) {
        labels.role.innerText = `${sectionKey.toUpperCase()} VIEW`;
    }

    // Update Mobile Nav Highlighting
    const mobileKeys = { client: 'm_client', supplier: 'm_supplier', driver: 'm_driver', setup: 'm_setup' };
    Object.entries(mobileKeys).forEach(([key, btnKey]) => {
        const btn = buttons[btnKey];
        if (btn) {
            const isActive = (key === sectionKey);
            btn.classList.toggle('text-indigo-600', isActive);
            btn.classList.toggle('text-slate-400', !isActive);
        }
    });

    if (sectionKey === 'driver') {
        requestAnimationFrame(() => {
            setTimeout(() => refreshMap(), 300);
        });
        startLocationTracking();
    } else {
        stopLocationTracking();
    }

    renderAllViews(sectionKey);
}

/**
 * --- SETUP TAB LOGIC ---
 */

window.showSetupTab = (tabId) => {
    // Buttons
    document.querySelectorAll('.setup-tab-btn').forEach(btn => {
        const isTarget = btn.id === `setup-tab-btn-${tabId}`;
        btn.classList.toggle('bg-white', isTarget);
        btn.classList.toggle('text-slate-800', isTarget);
        btn.classList.toggle('shadow-sm', isTarget);
        btn.classList.toggle('text-slate-500', !isTarget);
        btn.classList.toggle('hover:bg-white/50', !isTarget);
    });

    // Sections
    document.querySelectorAll('.setup-tab-view').forEach(view => {
        view.classList.toggle('hidden', view.id !== `setup-tab-${tabId}`);
    });

    // If switching TO profile, ensure we show the active node status
    if (tabId === 'profile') {
        renderNodeStatus();
    }
};

function renderNodeStatus() {
    const summary = document.getElementById('client-setup-summary');
    const nodeBadge = document.getElementById('active-node-badge');

    if (activeClientId) {
        const nodeName = activeClientId.replace(/_/g, ' ').toUpperCase();
        const statusHTML = `
            <div class="flex items-center space-x-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span class="text-[10px] font-black uppercase tracking-wider">Linked Node: ${nodeName}</span>
            </div>
        `;
        if (summary) summary.innerHTML = statusHTML;
        if (nodeBadge) nodeBadge.innerHTML = statusHTML;
    } else {
        const retailHTML = `
            <div class="flex items-center space-x-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                <span class="text-[10px] font-black uppercase tracking-wider">Independent Retail</span>
            </div>
        `;
        if (summary) summary.innerHTML = retailHTML;
        if (nodeBadge) nodeBadge.innerHTML = retailHTML;
    }
}

/**
 * --- RENDERING ---
 */

function renderAllViews(currentView = null) {
    if (!currentProfile) return; // Wait for profile before rendering data-dependent views

    // Role-specific renders
    if (!currentView || currentView === 'client') {
        renderClientView();
        renderClientOrders();
    }
    if (!currentView || currentView === 'supplier') {
        renderSupplierView();
    }
    if (!currentView || currentView === 'driver') {
        renderDriverView();
    }

    // Always render global catalogue if in setup
    if (!currentView || currentView === 'setup') {
        renderCatalogueList();
    }
}

function renderClientView() {
    containers.clientStock.innerHTML = '';
    // Use client specific stock if available, else primary
    const displayStock = (activeClientId && Object.keys(clientStockData).length > 0) ? clientStockData : stockData;

    Object.entries(displayStock).forEach(([id, item]) => {
        const isSoldOut = item.quantity <= 0;
        const card = document.createElement('div');
        card.className = `role-card bg-white p-4 rounded-[2rem] border shadow-sm transition-all group ${isSoldOut ? 'opacity-60' : ''}`;
        card.innerHTML = `
            <div class="relative h-48 rounded-[1.5rem] overflow-hidden bg-slate-100 mb-4">
                <img src="${item.image}" class="w-full h-full object-cover transition-transform group-hover:scale-110" onerror="this.src='https://placehold.co/600x400?text=${encodeURIComponent(item.name)}'">
                ${isSoldOut ? '<div class="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center"><span class="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black">OUT OF STOCK</span></div>' : ''}
                ${activeClientId && clientStockData[id] ? '<div class="absolute top-3 left-3 bg-indigo-600 text-[8px] font-black text-white px-2 py-1 rounded-md uppercase">B2B Exclusive</div>' : ''}
            </div>
            <div class="px-2">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-lg leading-tight text-slate-800">${item.name}</h3>
                    <div class="text-right">
                        <span class="text-primary font-black block leading-none text-xl">RM ${item.price}</span>
                        <span class="text-[9px] uppercase font-bold text-slate-400">per ${item.unit}</span>
                    </div>
                </div>
                <button 
                    onclick="handleOrder('${id}', '${item.name}')"
                    ${isSoldOut ? 'disabled' : ''}
                    class="w-full py-4 rounded-2xl font-black transition-all ${isSoldOut ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-900 active:scale-95'}"
                >
                    PLACE ORDER
                </button>
            </div>
        `;
        containers.clientStock.appendChild(card);
    });
}

function renderClientOrders() {
    if (!containers.clientOrders || !currentProfile) return;
    containers.clientOrders.innerHTML = '';

    const myOrders = activeOrders.filter(o => o.customerName === currentProfile.name && o.status !== 'delivered' && o.status !== 'cancelled');

    if (myOrders.length === 0) {
        containers.clientOrders.innerHTML = '<p class="text-xs text-slate-500 italic">No active orders found.</p>';
        return;
    }

    myOrders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all';
        const accessCode = order.id.substring(0, 6).toUpperCase();

        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black uppercase text-indigo-400 tracking-widest">${order.status}</span>
                <span class="text-[10px] font-black text-slate-500">CODE: <b class="text-white">${accessCode}</b></span>
            </div>
            <h4 class="text-sm font-bold text-white mb-1">${order.itemName}</h4>
            <div class="flex items-center justify-between mt-3">
                <span class="text-[9px] text-slate-400">Total: RM ${order.total.toFixed(2)}</span>
                <button onclick="navigator.clipboard.writeText('${accessCode}'); alert('Access Code copied!')" class="text-[8px] font-black uppercase text-slate-500 hover:text-white transition-colors">Copy Code</button>
            </div>
        `;
        containers.clientOrders.appendChild(div);
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
                <button onclick="handleStockUpdate('${id}', this)" class="bg-dark text-white text-xs font-bold px-4 py-2 rounded-lg hover:shadow-lg transition-all">SAVE</button>
            </td>
        `;
        containers.supplierStock.appendChild(tr);
    });
}

function renderDriverView() {
    containers.driverOrders.innerHTML = '';
    activeOrders.filter(o => o.status !== 'cancelled').forEach(order => {
        const isPickedUp = order.status === 'picked_up';
        const isDelivered = order.status === 'delivered';
        if (isDelivered) return;

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
            
            <div class="grid grid-cols-2 gap-2">
                ${!isPickedUp ? `
                    <button onclick="handlePickup('${order.id}')" class="col-span-2 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase hover:shadow-lg transition-all">PICKUP</button>
                    <button onclick="handleCancelOrder('${order.id}')" class="py-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-bold">CANCEL</button>
                    <button onclick="handleFocusOrder('${order.id}')" class="py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold">LOCATE</button>
                ` : `
                    <button onclick="handleComplete('${order.id}')" class="col-span-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:shadow-lg transition-all tracking-widest">COMPLETE</button>
                    <button onclick="handleUndoPickup('${order.id}')" class="py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold">UNDO PICKUP</button>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${order.location.lat},${order.location.lng}&travelmode=driving" target="_blank" 
                       class="py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold text-center flex items-center justify-center space-x-1">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       <span>NAVIGATE</span>
                    </a>
                `}
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
    };
}

function setupBusinessLogic() {
    // 1. Manage Wholesale Client Registry
    document.getElementById('form-manage-client').onsubmit = async (e) => {
        e.preventDefault();
        const bizName = document.getElementById('client-biz-name').value;
        const bizAddress = document.getElementById('client-biz-address').value;

        if (!bizName || !bizAddress) return;

        await addWholesaleClient(currentUser.uid, { name: bizName, address: bizAddress });
        await recordAudit(currentUser.uid, 'ADD_CLIENT', `Registered wholesale client: ${bizName}`);

        e.target.reset();
    };

    // 2. Client Registry Subscription
    subscribeToClients(null, (clients) => {
        const list = document.getElementById('registry-client-list');
        if (!list) return;
        list.innerHTML = '';
        document.getElementById('stats-clients').innerText = clients.length;

        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-800">${client.name}</td>
                <td class="px-6 py-4 text-slate-500">${client.address}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="handleSelectClient('${client.name}', '${client.address}')" class="text-[10px] font-black uppercase text-indigo-600 hover:underline">Select Client</button>
                </td>
            `;
            list.appendChild(tr);
        });
    });

    // 3. Audit Log Subscription
    subscribeToAuditLog((logs) => {
        const list = document.getElementById('audit-log-list');
        if (!list) return;
        list.innerHTML = '';
        logs.forEach(log => {
            const time = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : '...';
            const div = document.createElement('div');
            div.className = "flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border-l-4 border-slate-800";
            div.innerHTML = `
                <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${log.action}</span>
                        <span class="text-[9px] font-bold text-slate-300">${time}</span>
                    </div>
                    <p class="text-xs font-semibold text-slate-600 leading-tight">${log.details}</p>
                </div>
            `;
            list.appendChild(div);
        });
    });
}

window.handleSelectClient = (name, address) => {
    // Note: Link the session to this Wholesale Node
    const clientId = name.replace(/\s+/g, '_').toLowerCase();
    activeClientId = clientId;

    // UI Feedback: Show connection status instead of overwriting profile
    renderNodeStatus();

    // Switch stock subscription to show B2B exclusive items/pricing
    if (clientStockUnsubscribe) clientStockUnsubscribe();
    clientStockUnsubscribe = subscribeToClientStock(clientId, (data) => {
        clientStockData = data || {};
        renderClientView();
    });

    alert(`Ecosystem Dynamic: Session linked to wholesale node [${name.toUpperCase()}]. B2B pricing and exclusive inventory enabled.`);
};

window.handleManageItems = (id, name) => {
    const itemName = prompt(`Add Custom Item for ${name}:`);
    if (!itemName) return;
    const price = parseFloat(prompt(`Price for ${name} (RM):`));
    if (isNaN(price)) return;

    createClientStockItem(id, {
        name: itemName,
        price: price,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1559737558-2f57377f6b98?q=80&w=200&auto=format&fit=crop',
        quantity: 100
    });

    recordAudit(currentUser.uid, 'ADD_CLIENT_ITEM', `Added ${itemName} to ${name} catalog.`);
};

window.handleUndoPickup = async (orderId) => {
    if (confirm("Revert pickup and return order to pending local pool?")) {
        await updateOrderStatus(orderId, 'pending');
        await recordAudit(currentUser.uid, 'UNDO_PICKUP', `Driver reverted pickup for order ${orderId.substring(0, 8)}`);
        if (currentNavOrderId === orderId) {
            currentNavOrderId = null;
            clearRoute();
        }
    }
};

window.handleCancelOrder = async (orderId) => {
    if (confirm("Cancel this order permanently?")) {
        await cancelOrder(orderId);
        await recordAudit(currentUser.uid, 'CANCEL_ORDER', `Order ${orderId.substring(0, 8)} was cancelled.`);
    }
};

window.refreshAnalytics = () => {
    // Recalculate financial stats locally from activeOrders
    let totalRevenue = 0;
    let sstPool = 0;
    let commission = 0;

    activeOrders.forEach(o => {
        if (o.status === 'delivered') {
            const price = parseFloat(o.price || 0);
            totalRevenue += price;
            sstPool += price * 0.06;
            commission += 5.00; // Mock Sarawak Rider commission RM 5 / trip
        }
    });

    const revEl = document.getElementById('stats-revenue');
    const sstEl = document.getElementById('stats-sst');
    const comEl = document.getElementById('stats-commission');

    if (revEl) revEl.innerText = `RM ${totalRevenue.toFixed(2)}`;
    if (sstEl) sstEl.innerText = `RM ${sstPool.toFixed(2)}`;
    if (comEl) comEl.innerText = `RM ${commission.toFixed(2)}`;
};

function populateSetupFields() {
    if (!currentProfile) return;
    document.getElementById('setup-client-address').value = currentProfile.address || '';
    document.getElementById('setup-client-phone').value = currentProfile.phone || '';
    document.getElementById('setup-driver-vehicle').value = currentProfile.vehicle || '';
    document.getElementById('setup-driver-type').value = currentProfile.vehicleType || 'Motorcycle';

    renderNodeStatus();
}

function startLocationTracking() {
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            driverLocation = [latitude, longitude];
            updateDriverLocation(latitude, longitude);

            // If navigating, update route and sync with Firestore for client tracking
            if (currentNavOrderId) {
                const order = activeOrders.find(o => o.id === currentNavOrderId);
                if (order && order.location) {
                    drawRoute(driverLocation, [order.location.lat, order.location.lng]);

                    // NEW: Update Firestore so client can see live tracking
                    try {
                        await updateOrderDriverLocation(currentNavOrderId, latitude, longitude);
                    } catch (e) {
                        console.warn("Failed to sync location to order doc", e);
                    }
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

window.handleOrder = async (id, name) => {
    if (!currentProfile.address) {
        alert("Please set your delivery address in Setup first!");
        showSection('setup');
        return;
    }

    try {
        // Robust item source selection
        let item = null;
        if (activeClientId && clientStockData && clientStockData[id]) {
            item = clientStockData[id];
        } else if (stockData && stockData[id]) {
            item = stockData[id];
        }

        if (!item) {
            alert("Error: Item no longer available. Please refresh.");
            return;
        }

        const subtotal = parseFloat(item.price);
        if (isNaN(subtotal)) {
            console.error("Invalid price for item:", id, item);
            alert("Error: Item price is invalid. Please contact support.");
            return;
        }

        const sst = subtotal * 0.06;
        const total = subtotal + sst;

        if (item.quantity > 0) {
            await updateStock(id, item.quantity - 1, activeClientId);
            const orderId = await placeOrder({
                itemId: id,
                itemName: name || item.name || "Unknown Item",
                price: subtotal,
                total: total,
                customerName: currentProfile.name || "Guest",
                address: currentProfile.address,
                phone: currentProfile.phone || "",
                clientId: activeClientId || 'retail'
            });

            const accessCode = orderId.substring(0, 6).toUpperCase();
            await recordAudit(currentUser.uid, 'PLACE_ORDER', `Order placed: ${name} (Total: RM ${total.toFixed(2)}) for ${activeClientId || 'Retail'}`);

            alert(`Order successful!\n\nAccess Code: ${accessCode}\nTotal: RM ${total.toFixed(2)} (incl. 6% SST)\n\nGive this code to others to track your order!`);
            refreshAnalytics();
        }
    } catch (err) {
        console.error(err);
    }
};

window.handlePickup = async (orderId) => {
    try {
        await updateOrderStatus(orderId, 'picked_up');
        await recordAudit(currentUser.uid, 'PICKUP_ORDER', `Driver picked up order ID: ${orderId.substring(0, 8)}`);
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
        await updateOrderStatus(orderId, 'delivered');
        await recordAudit(currentUser.uid, 'DELIVER_ORDER', `Delivery completed for order ID: ${orderId.substring(0, 8)}`);

        if (currentNavOrderId === orderId) {
            currentNavOrderId = null;
            clearRoute();
        }
        refreshAnalytics();
    } catch (err) {
        console.error(err);
    }
};

window.handleFocusOrder = (id) => focusMarker(id);
window.handleStockUpdate = async (id, btn) => {
    const qty = parseInt(document.getElementById(`qty-${id}`).value);
    if (!isNaN(qty) && qty >= 0) {
        await updateStock(id, qty);
        await recordAudit(currentUser.uid, 'UPDATE_STOCK', `Updated stock for ${id} to ${qty}`);
        if (!btn) return;
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
        await recordAudit(currentUser.uid, 'DELETE_STOCK', `Removed item from catalogue: ${id}`);
    }
};

window.handleUndoPickup = async (orderId) => {
    if (confirm("Revert pickup and return order to pending local pool?")) {
        await updateOrderStatus(orderId, 'pending');
        await recordAudit(currentUser.uid, 'UNDO_PICKUP', `Driver reverted pickup for order ${orderId.substring(0, 8)}`);
        if (currentNavOrderId === orderId) {
            currentNavOrderId = null;
            clearRoute();
        }
    }
};

window.handleCancelOrder = async (orderId) => {
    if (confirm("Cancel this order permanently?")) {
        await cancelOrder(orderId);
        await recordAudit(currentUser.uid, 'CANCEL_ORDER', `Order ${orderId.substring(0, 8)} was cancelled.`);
    }
};

window.showRoleSelection = () => showScreen('roleSelect');
window.logout = () => logout();
window.showSection = (key) => showSection(key);

// Start App
init();
