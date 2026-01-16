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
        items.push({ id: 'clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
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
            case 'clients': renderClients($main); break;
            default: $main.html('<p>View not implemented</p>');
        }
    }, 300);
}

// --- Render Functions (Basic Implementation) ---

function renderAnalytics($container) {
    $container.html(`
        <h2 class="text-2xl font-bold mb-6">Sales Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Today's Sales</p>
                <h3 class="text-2xl font-bold text-blue-900 mt-2" id="sales-today">RM 0</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Weekly Sales</p>
                <h3 class="text-2xl font-bold text-blue-900 mt-2" id="sales-weekly">RM 0</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Monthly Sales</p>
                <h3 class="text-2xl font-bold text-blue-900 mt-2" id="sales-monthly">RM 0</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-gray-500 text-sm">Yearly Sales</p>
                <h3 class="text-2xl font-bold text-green-600 mt-2" id="sales-yearly">RM 0</h3>
            </div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
            [Chart Placeholder: Sales Trend Line]
        </div>
    `);

    // Calculate Sales
    // We fetch ALL orders for Admin to calculate (or limit to last year if optimization needed)
    const unsub = dbAPI.getOrders('admin', null, (orders) => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const tempDate = new Date(now);
        const startOfWeek = new Date(tempDate.setDate(tempDate.getDate() - tempDate.getDay())); // Start of week (Sunday)

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let today = 0, weekly = 0, monthly = 0, yearly = 0;

        orders.forEach(o => {
            if (o.status === 'completed' || o.status === 'accepted' || o.status === 'delivering') {
                const date = o.createdAt ? new Date(o.createdAt.seconds * 1000) : new Date();
                const total = parseFloat(o.total);

                if (date >= startOfDay) today += total;
                if (date >= startOfWeek) weekly += total;
                if (date >= startOfMonth) monthly += total;
                if (date >= startOfYear) yearly += total;
            }
        });

        $('#sales-today').text(`RM ${today.toFixed(2)}`);
        $('#sales-weekly').text(`RM ${weekly.toFixed(2)}`);
        $('#sales-monthly').text(`RM ${monthly.toFixed(2)}`);
        $('#sales-yearly').text(`RM ${yearly.toFixed(2)}`);
    });
    listeners.push(unsub);
}

function renderStockManagement($container) {
    $container.html(`
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Stock & Procurement</h2>
            <button onclick="openAddProductModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add New Product</button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm min-w-[800px]">
                    <thead class="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th class="p-4 font-semibold text-gray-600">Product</th>
                            <th class="p-4 font-semibold text-gray-600">Current Supplier</th>
                            <th class="p-4 font-semibold text-gray-600">Stock (Physical)</th>
                            <th class="p-4 font-semibold text-gray-600">Pending Requests</th>
                            <th class="p-4 font-semibold text-gray-600">Status</th>
                            <th class="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `);

    // Fetch Products AND Orders to calculate demand
    // Nested listeners are tricky, so we'll fetch orders once per product update or independently?
    // Independent listeners updating a shared state or re-rendering is properly reactive.
    // For simplicity: specific render function that takes both.

    let localProducts = [];
    let localOrders = [];

    const renderTable = () => {
        // Calculate Demand
        const demand = {};
        localOrders.forEach(o => {
            if (o.status === 'pending') {
                o.items.forEach(i => {
                    demand[i.id] = (demand[i.id] || 0) + i.qty;
                });
            }
        });

        const rows = localProducts.map(p => {
            const pendingQty = demand[p.id] || 0;
            const status = p.quantity >= pendingQty ?
                '<span class="text-green-600 font-bold">Sufficient</span>' :
                `<span class="text-red-600 font-bold">Deficit (${p.quantity - pendingQty})</span>`;

            return `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-4">
                    <div class="font-medium text-gray-900">${p.name}</div>
                    <div class="text-xs text-gray-500">Sell: RM ${p.price}/${p.unit}</div>
                </td>
                <td class="p-4 text-gray-500">${p.supplier || '-'}</td>
                <td class="p-4 font-bold text-lg">${p.quantity} <span class="text-xs font-normal text-gray-400">${p.unit}</span></td>
                <td class="p-4">
                    ${pendingQty > 0 ? `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold">${pendingQty} ${p.unit}</span>` : '-'}
                </td>
                <td class="p-4">${status}</td>
                <td class="p-4 flex gap-2">
                    <button onclick="openRestockModal('${p.id}', '${p.name}', '${p.supplier || ''}')" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 border border-indigo-200">Restock</button>
                    <button class="text-gray-400 hover:text-red-600 ml-2" onclick="deleteProduct('${p.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
        $('#stock-table-body').html(rows);
    };

    const unsubProducts = dbAPI.getProducts((products) => {
        localProducts = products;
        renderTable();
    });
    const unsubOrders = dbAPI.getOrders('admin', null, (orders) => {
        localOrders = orders;
        renderTable();
    });

    listeners.push(unsubProducts);
    listeners.push(unsubOrders);
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
                        <span class="text-lg font-bold text-gray-700">Available</span> 
                        <div class="flex gap-2 items-center">
                            <input type="number" id="qty-${p.id}" value="1" min="1" class="w-16 border rounded p-1 text-center text-sm" onclick="event.stopPropagation()">
                            <button class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors" onclick="addToCart('${p.id}', '${p.name}', ${p.price}, parseInt($('#qty-${p.id}').val()))">
                                Add
                            </button>
                        </div>
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
                    ${o.status === 'pending' || o.status === 'requested' ? `<button onclick="openProcessOrderModal('${o.id}', '${o.clientId}')" class="text-blue-600 hover:underline mr-2">Process Quote</button>` : ''}
                    ${o.status === 'completed' && !o.invoiced ? `<button onclick="createInvoice('${o.id}')" class="text-green-600 hover:underline">Invoice</button>` : ''}
                </td>
            </tr>
        `).join('');
        $('#orders-table-body').html(rows);
    });
    listeners.push(unsub);
}

// ... (renderOrdersClient, renderDriverJobs etc remain same)

// New Process Order Modal
window.openProcessOrderModal = async function (orderId, clientId) {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();

    // Fetch Products to get base prices + Names
    // Fetch Client Custom Prices
    const [productsSnap, customPricesSnap] = await Promise.all([
        db.collection('products').get(),
        db.collection('users').doc(clientId).collection('customPrices').get()
    ]);

    const products = [];
    productsSnap.forEach(d => products.push({ id: d.id, ...d.data() }));

    const customPrices = {};
    customPricesSnap.forEach(d => customPrices[d.id] = d.data().price);

    // Calculate proposed total
    let total = 0;
    const itemsWithPrices = orderData.items.map(item => {
        const product = products.find(p => p.id === item.id) || {};
        const basePrice = product.price || 0;
        const finalPrice = customPrices[item.id] !== undefined ? customPrices[item.id] : basePrice;
        const itemTotal = finalPrice * item.qty;
        total += itemTotal;

        return { ...item, finalPrice, itemTotal };
    });

    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="modal-bg">
        <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Process Quote: Order #${orderId.slice(0, 8)}</h3>
            
            <div class="space-y-2 mb-4">
                <div class="grid grid-cols-12 gap-2 font-bold bg-gray-50 p-2">
                    <div class="col-span-5">Item</div>
                    <div class="col-span-2">Qty</div>
                    <div class="col-span-2">Price (RM)</div>
                    <div class="col-span-3 text-right">Total</div>
                </div>
                ${itemsWithPrices.map((item, idx) => `
                <div class="grid grid-cols-12 gap-2 items-center border-b pb-2">
                    <div class="col-span-5">${item.name}</div>
                    <div class="col-span-2">${item.qty}</div>
                    <div class="col-span-2">
                        <input type="number" step="0.01" class="border rounded w-full px-1" 
                               value="${item.finalPrice}" 
                               onchange="updateProcessTotal(${idx}, this.value, ${item.qty})">
                    </div>
                    <div class="col-span-3 text-right font-bold" id="item-total-${idx}">RM ${item.itemTotal.toFixed(2)}</div>
                </div>
                `).join('')}
            </div>
            
            <div class="flex justify-between items-center text-xl font-bold mb-6">
                <span>Grand Total</span>
                <span id="grand-total">RM ${total.toFixed(2)}</span>
            </div>

            <div class="flex justify-end gap-3">
                <button onclick="$('#modal-bg').remove()" class="px-4 py-2 text-gray-500">Cancel</button>
                <button onclick="confirmQuote('${orderId}', ${total})" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Quote & Accept</button>
            </div>
        </div>
     </div>
    `;
    $('body').append(html);

    // Store items temporarily for the confirm function to grab updated prices? 
    // Simplified: We assume the Admin modifies inputs, but we need to re-calculate effectively.
    // For MVP, we stick to the initial auto-calc. If they edit, we need a way to track it.
    // Let's attach a global object to store temp edits.
    window.tempQuoteItems = itemsWithPrices;
}

window.updateProcessTotal = (idx, newPrice, qty) => {
    const price = parseFloat(newPrice) || 0;
    const total = price * qty;
    window.tempQuoteItems[idx].finalPrice = price;
    window.tempQuoteItems[idx].itemTotal = total;

    $(`#item-total-${idx}`).text(`RM ${total.toFixed(2)}`);

    const grandTotal = window.tempQuoteItems.reduce((sum, item) => sum + item.itemTotal, 0);
    $('#grand-total').text(`RM ${grandTotal.toFixed(2)}`);
}

window.confirmQuote = async (orderId) => {
    const total = window.tempQuoteItems.reduce((sum, item) => sum + item.itemTotal, 0);

    // Update Order with Price and Status
    await db.collection('orders').doc(orderId).update({
        total: total,
        status: 'pending', // Or 'accepted' directly? Prompt says "Admin should able have a setup... billing/invoice done by business admin"
        // Let's set it to 'accepted' so it goes to Drivers, AND it has a price now.
        // Wait, "Requested" -> Admin Quotes -> "Pending Payment/Accepted"?
        // Previous flow: Client orders -> Pending -> Admin Accepts -> Driver...
        // New flow: Client Requests -> Requested -> Admin Quotes -> Pending (Client Config) OR Accepted (Direct).
        // Let's make it status: 'accepted' so it flows to drivers immediately, assuming 'Quote' implies acceptance of contract.
        // Actually, let's keep it 'pending' if client needs to pay, OR 'accepted' if COD/Credit. 
        // Let's go with 'accepted' to maintain previous driver flow compatibility.
        status: 'accepted',
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
        // Save the frozen prices to the order items so invoice is accurate later
        items: window.tempQuoteItems
    });

    // Trigger Inventory Deduction (since we skipped it in updateOrderStatus for 'requested' -> 'accepted' transition if we use this function)
    const items = window.tempQuoteItems;
    await Promise.all(items.map(async (item) => {
        const productRef = db.collection('products').doc(item.id);
        await productRef.update({ quantity: firebase.firestore.FieldValue.increment(-item.qty) });
    }));

    $('#modal-bg').remove();
    alert("Quote Sent & Order Accepted!");
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
                        <span class="text-sm text-gray-400">#${o.id.slice(0, 8)}</span>
                        <p class="font-bold text-lg">${o.total > 0 ? 'RM ' + o.total : '<span class="text-gray-500 italic">Quote Pending</span>'}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(o.status)}">${o.status.toUpperCase()}</span>
                </div>
                <div class="space-y-2">
                    ${o.items.map(i => `<div class="flex justify-between text-sm text-gray-600"><span>${i.name} x${i.qty}</span><span>${o.total > 0 ? 'RM ' + (i.price * i.qty).toFixed(2) : '-'}</span></div>`).join('')}
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
                <div class="mb-4">
                    <p class="font-bold text-gray-800">${o.storeName || o.clientName || 'Client'}</p>
                    <p class="text-gray-500 text-sm truncate">${o.deliveryAddress || 'No address'}</p>
                </div>
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
                <div class="mb-4 p-3 bg-gray-50 rounded text-sm">
                    <p class="font-bold text-gray-800">${o.storeName || o.clientName || 'Client'}</p>
                    <p class="text-gray-600">${o.deliveryAddress || 'No address provided'}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(o.deliveryAddress || '')}" target="_blank" class="text-blue-500 hover:underline text-xs mt-1 block">Open in Maps</a>
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

function renderClients($container) {
    $container.html(`
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Client Management</h2>
            <button onclick="openAddClientModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Client</button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                 <table class="w-full text-left text-sm min-w-[600px]">
                    <thead class="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th class="p-4">Name</th>
                            <th class="p-4">Email</th>
                            <th class="p-4">Store Name</th>
                            <th class="p-4">Address</th>
                            <th class="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clients-table-body"></tbody>
                </table>
            </div>
        </div>
    `);

    const unsub = dbAPI.getUsers('client', (users) => {
        const rows = users.map(u => `
            <tr class="border-b border-gray-50">
                <td class="p-4 font-bold text-gray-800">${u.name || '-'}</td>
                <td class="p-4 text-gray-500">${u.email}</td>
                <td class="p-4">${u.storeName || '<span class="text-gray-300 italic">Not Set</span>'}</td>
                <td class="p-4 truncate max-w-xs">${u.address || '<span class="text-gray-300 italic">Not Set</span>'}</td>
                <td class="p-4">
                    <button onclick="openEditClientModal('${u.uid}', '${u.name || ''}', '${u.storeName || ''}', '${u.address || ''}')" class="text-blue-600 hover:underline mr-2">Edit</button>
                    <button onclick="openManagePricesModal('${u.uid}', '${u.name || 'Client'}')" class="text-green-600 hover:underline">Manage Prices</button>
                </td>
            </tr>
        `).join('');
        $('#clients-table-body').html(rows);
    });
    listeners.push(unsub);
}


// --- Helper Logic ---

let cart = [];

window.addToCart = function (id, name, price, qty = 1) {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, name, price, qty: qty });

    // Simple toast feedback
    const toast = $(`<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50">Added to cart</div>`);
    $('body').append(toast);
    setTimeout(() => toast.remove(), 2000);
}

window.goToCart = function () {
    if (cart.length === 0) { alert("Cart is empty"); return; }

    // Render Modal Cart
    // Client view: NO PRICE
    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="cart-modal">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Your Order Request</h3>
            <div class="space-y-3 mb-4 max-h-60 overflow-y-auto">
                ${cart.map(i => `
                    <div class="flex justify-between items-center text-sm border-b pb-2">
                        <span class="font-medium text-lg">${i.name}</span>
                        <span class="font-bold text-lg bg-gray-100 px-3 py-1 rounded">Qty: ${i.qty}</span>
                    </div>
                `).join('')}
            </div>
            <p class="text-sm text-gray-500 mb-4">You will receive a quote/invoice from the admin once confirmed.</p>
            <div class="flex justify-end gap-3 pt-4">
                 <button onclick="$('#cart-modal').remove()" class="px-4 py-2 text-gray-500">Close</button>
                 <button onclick="submitOrder()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Request</button>
            </div>
        </div>
     </div>
    `;
    $('body').append(html);
}

window.submitOrder = async function (total = 0) {
    const order = {
        clientId: auth.currentUser.uid,
        clientName: currentUser.name || 'Unknown',
        storeName: currentUser.storeName || '',
        deliveryAddress: currentUser.address || 'No address provided',
        items: cart,
        total: 0, // Pending Admin Pricing
        status: 'requested', // New Initial Status
        driverId: null
    };
    await dbAPI.createOrder(order);
    cart = [];
    $('#cart-modal').remove();
    alert("Order Request Sent! Waiting for Admin Confirmation.");
    loadView('my-orders');
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
        case 'requested': return 'bg-gray-100 text-gray-600 border border-gray-300';
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

function openEditClientModal(uid, name, storeName, address) {
    // If values are 'undefined' string or null, reset
    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="modal-bg">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Edit Client Profile</h3>
            <form id="edit-client-form" class="space-y-4">
                <input type="hidden" name="uid" value="${uid}">
                <div>
                     <label class="block text-sm font-medium text-gray-700">Client Name</label>
                     <input type="text" class="w-full border p-2 rounded" name="name" value="${name}">
                </div>
                <div>
                     <label class="block text-sm font-medium text-gray-700">Store Name</label>
                     <input type="text" class="w-full border p-2 rounded" name="storeName" value="${storeName}">
                </div>
                <div>
                     <label class="block text-sm font-medium text-gray-700">Address (Delivery)</label>
                     <textarea class="w-full border p-2 rounded" name="address" rows="3">${address}</textarea>
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" onclick="$('#modal-bg').remove()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                </div>
            </form>
        </div>
     </div>
    `;
    $('body').append(html);

    $('#edit-client-form').submit(async (e) => {
        e.preventDefault();
        const data = {
            name: $('input[name="name"]').val(),
            storeName: $('input[name="storeName"]').val(),
            address: $('textarea[name="address"]').val()
        };
        await dbAPI.updateUserProfile(uid, data);
        $('#modal-bg').remove();
    });
}
window.openEditClientModal = openEditClientModal;
window.openAddProductModal = openAddProductModal;
window.openAddClientModal = openAddClientModal;

function openAddClientModal() {
    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="modal-bg">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Add New Client</h3>
            <form id="add-client-form" class="space-y-4">
                <div>
                     <label class="block text-sm font-medium text-gray-700">Client Name</label>
                     <input type="text" class="w-full border p-2 rounded" name="name" required>
                </div>
                <div>
                     <label class="block text-sm font-medium text-gray-700">Email (Optional)</label>
                     <input type="email" class="w-full border p-2 rounded" name="email">
                </div>
                <div>
                     <label class="block text-sm font-medium text-gray-700">Store Name</label>
                     <input type="text" class="w-full border p-2 rounded" name="storeName" required>
                </div>
                <div>
                     <label class="block text-sm font-medium text-gray-700">Address (Delivery)</label>
                     <textarea class="w-full border p-2 rounded" name="address" rows="3" required></textarea>
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" onclick="$('#modal-bg').remove()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                </div>
            </form>
        </div>
     </div>
    `;
    $('body').append(html);

    $('#add-client-form').submit(async (e) => {
        e.preventDefault();
        const data = {
            name: $('input[name="name"]').val(),
            email: $('input[name="email"]').val(),
            storeName: $('input[name="storeName"]').val(),
            address: $('textarea[name="address"]').val()
        };
        await dbAPI.addUser(data);
        $('#modal-bg').remove();
    });
}

window.openAddClientModal = openAddClientModal;

function openManagePricesModal(userId, userName) {
    const html = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="modal-bg">
       <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
           <div class="flex justify-between items-center mb-4">
               <h3 class="text-xl font-bold">Manage Custom Prices: ${userName}</h3>
               <button onclick="$('#modal-bg').remove()" class="text-gray-500 hover:text-red-500">Close</button>
           </div>
           <p class="text-sm text-gray-500 mb-4">Set specific prices for this client. If left blank, default price applies.</p>
           
           <div class="space-y-4" id="price-list-container">
               <p>Loading products...</p>
           </div>
       </div>
    </div>
   `;
    $('body').append(html);

    // Fetch products and current custom prices
    Promise.all([
        db.collection('products').orderBy('name').get(),
        db.collection('users').doc(userId).collection('customPrices').get()
    ]).then(([productsSnap, customPricesSnap]) => {
        const products = [];
        productsSnap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

        const customPrices = {};
        customPricesSnap.forEach(doc => customPrices[doc.id] = doc.data().price);

        const rows = products.map(p => {
            const currentPrice = customPrices[p.id] !== undefined ? customPrices[p.id] : '';
            return `
            <div class="flex justify-between items-center border-b pb-2">
                <div>
                    <p class="font-bold">${p.name}</p>
                    <p class="text-xs text-gray-400">Default: RM ${p.price}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-gray-600">RM</span>
                    <input type="number" step="0.01" class="border rounded p-1 w-24 text-right" 
                           value="${currentPrice}" 
                           placeholder="Default"
                           onchange="saveCustomPrice('${userId}', '${p.id}', this.value)">
                </div>
            </div>`;
        }).join('');

        $('#price-list-container').html(rows);
    });
}
window.openManagePricesModal = openManagePricesModal;
window.saveCustomPrice = async (userId, productId, price) => {
    if (price === '') return; // Handle delete?
    await dbAPI.setCustomPrice(userId, productId, price);
    // Optional: show small 'Saved' text
};

function openRestockModal(id, name, currentSupplier) {
    const html = `
     <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="modal-bg">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Restock / Supplier Order</h3>
            <p class="text-sm text-gray-500 mb-4">Ordering stock for: <strong>${name}</strong></p>
            <form id="restock-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Supplier</label>
                    <input type="text" class="w-full border p-2 rounded" name="supplier" value="${currentSupplier}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Quantity to Order</label>
                    <input type="number" class="w-full border p-2 rounded" name="quantity" required min="1">
                </div>
                <!-- 
                <div>
                    <label class="block text-sm font-medium text-gray-700">Total Cost (RM)</label>
                    <input type="number" class="w-full border p-2 rounded" name="cost" placeholder="Optional">
                </div>
                -->
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" onclick="$('#modal-bg').remove()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm Purchase</button>
                </div>
            </form>
        </div>
     </div>
    `;
    $('body').append(html);

    $('#restock-form').submit(async (e) => {
        e.preventDefault();
        const addedQty = parseInt($('input[name="quantity"]').val());
        const supplier = $('input[name="supplier"]').val();

        // Get current product to add to existing quantity
        const doc = await db.collection('products').doc(id).get();
        const currentQty = doc.data().quantity || 0;

        await dbAPI.updateProduct(id, {
            quantity: currentQty + addedQty,
            supplier: supplier // Update supplier if changed
        });

        $('#modal-bg').remove();
    });
}
window.openRestockModal = openRestockModal;
