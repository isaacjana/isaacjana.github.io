// js/app.js

let currentUser = null;
let currentRole = null;
let listeners = [];

$(document).ready(function () {
    // Auth Check
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = await dbAPI.getUserProfile(user.uid);
            if (!currentUser) {
                // Should handle creation if not exists or redirect
                alert('User profile not found. Please contact support.');
                signOut();
                return;
            }
            currentRole = currentUser.role || 'client';

            $('#user-name').text(currentUser.name || user.email);
            $('#user-role').text(currentRole);
            $('#user-avatar').text((currentUser.name || user.email).charAt(0).toUpperCase());

            initDashboard(currentRole);
        } else {
            window.location.href = 'index.html';
        }
    });

    // Mobile Sidebar Toggle
    $('#open-sidebar').click(() => $('#sidebar').removeClass('-translate-x-full'));
    $('#close-sidebar').click(() => $('#sidebar').addClass('-translate-x-full'));
});

function signOut() {
    auth.signOut().then(() => window.location.href = 'index.html');
}

function initDashboard(role) {
    renderNav(role);
    // Default View
    if (role === 'admin') loadView('analytics');
    else if (role === 'client') loadView('shop');
    else if (role === 'driver') loadView('jobs');
}

function renderNav(role) {
    const $nav = $('#nav-menu');
    $nav.empty();

    const items = [];

    if (role === 'admin') {
        items.push({ id: 'analytics', label: 'Dashboard', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' }); // Chart icon placeholder
        items.push({ id: 'stock', label: 'Live Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' });
        items.push({ id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' });
        items.push({ id: 'invoices', label: 'Invoices (LHDN)', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
    } else if (role === 'client') {
        items.push({ id: 'shop', label: 'Live Seafood', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' });
        items.push({ id: 'my-orders', label: 'My Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' });
    } else if (role === 'driver') {
        items.push({ id: 'jobs', label: 'Available Jobs', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }); // Lightning/Flash icon for quick jobs
        items.push({ id: 'my-deliveries', label: 'My Deliveries', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' });
    }

    items.forEach(item => {
        $nav.append(`
            <li>
                <a href="#" onclick="loadView('${item.id}'); return false;" id="nav-${item.id}" class="flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                    <svg class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path></svg>
                    ${item.label}
                </a>
            </li>
        `);
    });
}
window.loadView = loadView; // Global export

function loadView(viewId) {
    // Clear existing listeners
    // (Implementation: we should store unsubscribe functions in 'listeners' array and call them here)
    listeners.forEach(unsub => unsub());
    listeners = [];

    // UI Updates
    $('#nav-menu a').removeClass('active-nav');
    $(`#nav-${viewId}`).addClass('active-nav');
    $('#view-loading').removeClass('hidden');
    $('#sidebar').addClass('-translate-x-full'); // Close mobile sidebar

    const $main = $('#main-view');
    $main.children().not('#view-loading').remove();

    // Logic for each view
    setTimeout(() => { // Simulate tiny delay/transition or just wait for render
        $('#view-loading').addClass('hidden');

        switch (viewId) {
            case 'analytics': renderAnalytics($main); break;
            case 'stock': renderStockManagement($main); break;
            case 'shop': renderShop($main); break;
            case 'orders': renderOrdersAdmin($main); break;
            case 'my-orders': renderOrdersClient($main); break;
            case 'jobs': renderDriverJobs($main); break;
            case 'my-deliveries': renderDriverDeliveries($main); break;
            case 'invoices': renderInvoices($main); break;
            default: $main.html('<p>View not implemented</p>');
        }
    }, 300);
}

// --- Render Functions (Basic Implementation) ---

function renderAnalytics($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">Monthly Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Total Revenue (Month)</p>
                <h3 class="text-3xl font-bold text-blue-900 mt-2">RM 12,450</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Active Orders</p>
                <h3 class="text-3xl font-bold text-orange-600 mt-2">8</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Live Stock Items</p>
                <h3 class="text-3xl font-bold text-green-600 mt-2">145</h3>
            </div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
            [Chart Placeholder: Sales by Product Category]
        </div>
    `);
}

function renderStockManagement($container) {
    $container.html(`
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Live Stock Management</h2>
            <button onclick="openAddProductModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Stock</button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm min-w-[600px]">
                    <thead class="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th class="p-4 font-semibold text-gray-600">Product</th>
                            <th class="p-4 font-semibold text-gray-600">Supplier</th>
                            <th class="p-4 font-semibold text-gray-600">Price (RM)</th>
                            <th class="p-4 font-semibold text-gray-600">Qty</th>
                            <th class="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `);

    const unsub = dbAPI.getProducts((products) => {
        const rows = products.map(p => `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-4 font-medium">${p.name}</td>
                <td class="p-4 text-gray-500">${p.supplier}</td>
                <td class="p-4">${p.price}/${p.unit}</td>
                <td class="p-4 ${p.quantity < 10 ? 'text-red-500 font-bold' : ''}">${p.quantity}</td>
                <td class="p-4">
                    <button class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button class="text-red-600 hover:text-red-800" onclick="deleteProduct('${p.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
        $('#stock-table-body').html(rows);
    });
    listeners.push(unsub);
}

function renderShop($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">Live Seafood Catalog</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="shop-grid"></div>
        
        <!-- Floating Cart Button -->
        <button onclick="goToCart()" class="fixed bottom-6 right-6 bg-blue-900 text-white p-4 rounded-full shadow-lg hover:bg-blue-800 flex items-center justify-center w-16 h-16">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </button>
    `);

    const unsub = dbAPI.getProducts((products) => {
        const cards = products.map(p => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                <div class="h-48 bg-gray-200">
                    <img src="https://via.placeholder.com/400x300?text=${p.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-5 flex-1 flex flex-col">
                    <h3 class="text-lg font-bold text-gray-900 mb-1">${p.name}</h3>
                    <p class="text-sm text-gray-500 mb-3">${p.supplier}</p>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="text-xl font-bold text-blue-900">RM ${p.price}<span class="text-sm text-gray-500 font-normal"> / ${p.unit}</span></span>
                        <button class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors" onclick="addToCart('${p.id}', '${p.name}', ${p.price})">
                            Add to Order
                        </button>
                    </div>
                    <div class="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span> ${p.quantity} in stock
                    </div>
                </div>
            </div>
        `).join('');
        $('#shop-grid').html(cards);
    });
    listeners.push(unsub);
}

// --- Additional Render Functions ---

function renderOrdersAdmin($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">Order Management</h2>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm min-w-[800px]">
                    <thead class="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th class="p-4">Order ID</th>
                            <th class="p-4">Client</th>
                            <th class="p-4">Items</th>
                            <th class="p-4">Total</th>
                            <th class="p-4">Status</th>
                            <th class="p-4">Driver</th>
                            <th class="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="orders-table-body"></tbody>
                </table>
            </div>
        </div>
    `);

    const unsub = dbAPI.getOrders('admin', null, (orders) => {
        const rows = orders.map(o => `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-4 font-mono text-xs">${o.id.slice(0, 8)}</td>
                <td class="p-4">${o.clientId}</td> <!-- In real app, fetch user name -->
                <td class="p-4">${o.items.length} items</td>
                <td class="p-4 font-bold">RM ${o.total}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold ${getStatusColor(o.status)}">${o.status.toUpperCase()}</span></td>
                <td class="p-4">${o.driverId ? 'Assigned' : '-'}</td>
                <td class="p-4">
                    ${o.status === 'pending' ? `<button onclick="updateStatus('${o.id}', 'accepted')" class="text-blue-600 hover:underline mr-2">Accept</button>` : ''}
                    ${o.status === 'completed' && !o.invoiced ? `<button onclick="createInvoice('${o.id}')" class="text-green-600 hover:underline">Invoice</button>` : ''}
                </td>
            </tr>
        `).join('');
        $('#orders-table-body').html(rows);
    });
    listeners.push(unsub);
}

function renderOrdersClient($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">My Orders</h2>
        <div class="space-y-4" id="client-orders-list"></div>
    `);

    const unsub = dbAPI.getOrders('client', currentUser ? currentUser.uid : auth.currentUser.uid, (orders) => {
        const list = orders.map(o => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-sm text-gray-400">#${o.id}</span>
                        <p class="font-bold text-lg">RM ${o.total}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(o.status)}">${o.status.toUpperCase()}</span>
                </div>
                <div class="space-y-2">
                    ${o.items.map(i => `<div class="flex justify-between text-sm text-gray-600"><span>${i.name} x${i.qty}</span><span>RM ${i.price * i.qty}</span></div>`).join('')}
                </div>
            </div>
        `).join('');
        $('#client-orders-list').html(list);
    });
    listeners.push(unsub);
}

function renderDriverJobs($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">Available Jobs</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="jobs-grid"></div>
    `);

    // Fetch all orders for driver (optimization needed for real scale)
    const unsub = dbAPI.getOrders('driver', null, (orders) => {
        const available = orders.filter(o => o.status === 'accepted' && !o.driverId);
        const cards = available.map(o => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div class="flex justify-between mb-4">
                     <h3 class="font-bold text-lg">Order #${o.id.slice(0, 6)}</h3>
                     <span class="text-blue-600 font-bold">RM ${o.total}</span>
                </div>
                <p class="text-gray-500 text-sm mb-4">Location: Client Address...</p>
                <button onclick="pickJob('${o.id}')" class="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Pick Job</button>
            </div>
        `).join('');
        $('#jobs-grid').html(cards);
    });
    listeners.push(unsub);
}

function renderDriverDeliveries($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">My Deliveries</h2>
         <div class="space-y-4" id="delivery-list"></div>
    `);

    const uid = auth.currentUser.uid;
    const unsub = dbAPI.getOrders('driver', null, (orders) => {
        const mine = orders.filter(o => o.driverId === uid && o.status !== 'completed'); // Active deliveries
        const cards = mine.map(o => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-600">
                <div class="flex justify-between mb-2">
                     <h3 class="font-bold">Order #${o.id.slice(0, 6)}</h3>
                     <span class="text-blue-600 font-bold">RM ${o.total}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="updateStatus('${o.id}', 'delivering', '${uid}')" class="flex-1 bg-yellow-100 text-yellow-800 py-2 rounded text-sm font-semibold hover:bg-yellow-200">Start Delivery</button>
                    <button onclick="updateStatus('${o.id}', 'completed')" class="flex-1 bg-green-100 text-green-800 py-2 rounded text-sm font-semibold hover:bg-green-200">Complete</button>
                </div>
            </div>
        `).join('');
        $('#delivery-list').html(cards);
    });
    listeners.push(unsub);
}

function renderInvoices($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">Invoices (LHDN)</h2>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                 <table class="w-full text-left text-sm min-w-[600px]">
                    <thead class="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th class="p-4">Invoice ID</th>
                            <th class="p-4">Order Ref</th>
                            <th class="p-4">Amount</th>
                            <th class="p-4">Date</th>
                            <th class="p-4">LHDN Status</th>
                        </tr>
                    </thead>
                    <tbody id="invoice-table-body"></tbody>
                </table>
            </div>
        </div>
    `);

    const unsub = dbAPI.getInvoices((invoices) => {
        const rows = invoices.map(i => `
             <tr class="border-b border-gray-50">
                <td class="p-4 font-mono text-xs">${i.id}</td>
                <td class="p-4 font-mono text-xs">${i.orderId}</td>
                <td class="p-4">RM ${i.amount}</td>
                <td class="p-4 text-gray-500">${i.createdAt ? new Date(i.createdAt.seconds * 1000).toLocaleDateString() : 'Now'}</td>
                <td class="p-4"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Validated</span></td>
             </tr>
        `).join('');
        $('#invoice-table-body').html(rows);
    });
    listeners.push(unsub);
}


// --- Helper Logic ---

let cart = [];

window.addToCart = function (id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, name, price, qty: 1 });

    // Simple toast feedback
    const toast = $(`<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50">Added to cart</div>`);
    $('body').append(toast);
    setTimeout(() => toast.remove(), 2000);
}

window.goToCart = function () {
    if (cart.length === 0) { alert("Cart is empty"); return; }

    // Render Modal Cart
    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="cart-modal">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Your Order</h3>
            <div class="space-y-3 mb-4 max-h-60 overflow-y-auto">
                ${cart.map(i => `
                    <div class="flex justify-between items-center text-sm">
                        <span>${i.name} x ${i.qty}</span>
                        <span class="font-bold">RM ${i.price * i.qty}</span>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total</span>
                <span>RM ${total}</span>
            </div>
            <div class="flex justify-end gap-3 pt-4">
                 <button onclick="$('#cart-modal').remove()" class="px-4 py-2 text-gray-500">Close</button>
                 <button onclick="submitOrder(${total})" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Place Order</button>
            </div>
        </div>
     </div>
    `;
    $('body').append(html);
}

window.submitOrder = async function (total) {
    const order = {
        clientId: auth.currentUser.uid,
        items: cart,
        total: total,
        status: 'pending',
        driverId: null
    };
    await dbAPI.createOrder(order);
    cart = [];
    $('#cart-modal').remove();
    alert("Order Placed Successfully!");
    loadView('my-orders'); // Refresh or switch view
}

window.updateStatus = async function (id, status, driverId = null) {
    await dbAPI.updateOrderStatus(id, status, driverId);
}

window.pickJob = async function (id) {
    const uid = auth.currentUser.uid;
    await dbAPI.updateOrderStatus(id, 'associating_driver', uid); // Intermediate or direct update
    // Actually we just update driverId and status to delivering? 
    // Flow: Pending -> Accepted (by Admin) -> Delivering (picked by Driver) -> Completed
    // Or Pending -> Picked (by Driver) -> Delivering... 
    // Simplest: Accepted -> Driver Picks -> Delivering
    await dbAPI.updateOrderStatus(id, 'delivering', uid);
    loadView('my-deliveries');
}

window.createInvoice = async function (orderId) {
    // Retrieve order data first (not efficient but simple)
    // In real app, pass data or fetch
    const orderSnap = await db.collection('orders').doc(orderId).get();
    window.dbAPI.generateInvoice(orderId, orderSnap.data());
    // alert("Invoice Generated");
    // Update local order to show it's invoiced to avoid duplicate? 
    // We should probably update order doc to say invoiced: true
    await db.collection('orders').doc(orderId).update({ invoiced: true });
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'accepted': return 'bg-blue-100 text-blue-800';
        case 'delivering': return 'bg-indigo-100 text-indigo-800';
        case 'completed': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function openAddProductModal() {
    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="modal-bg">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Add New Product</h3>
            <form id="add-product-form" class="space-y-4">
                <input type="text" placeholder="Product Name" class="w-full border p-2 rounded" required name="name">
                <input type="text" placeholder="Supplier" class="w-full border p-2 rounded" required name="supplier">
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Price" class="w-full border p-2 rounded" required name="price">
                    <input type="text" placeholder="Unit (kg, pcs)" class="w-full border p-2 rounded" required name="unit">
                </div>
                <input type="number" placeholder="Initial Quantity" class="w-full border p-2 rounded" required name="quantity">
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" onclick="$('#modal-bg').remove()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                </div>
            </form>
        </div>
     </div>
   `;
    $('body').append(html);

    $('#add-product-form').submit(async (e) => {
        e.preventDefault();
        const data = {
            name: $('input[name="name"]').val(),
            supplier: $('input[name="supplier"]').val(),
            price: parseFloat($('input[name="price"]').val()),
            unit: $('input[name="unit"]').val(),
            quantity: parseInt($('input[name="quantity"]').val())
        };
        await dbAPI.addProduct(data);
        $('#modal-bg').remove();
    });
}
