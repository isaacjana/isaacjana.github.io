// js/app.js

let currentUser = null;
let currentRole = null;
let listeners = [];
let cart = [];

// DOM Ready
$(document).ready(function () {
    // Auth Check
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Initialize User
                currentUser = await dbAPI.getUserProfile(user.uid);

                // If user doesn't exist in DB but is auth'd (edge case), create them
                if (!currentUser) {
                    const profile = {
                        name: user.displayName || 'User',
                        email: user.email,
                        role: 'client',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    await db.collection('users').doc(user.uid).set(profile);
                    currentUser = { uid: user.uid, ...profile };
                }

                currentRole = currentUser.role || 'client';

                // Update Sidebar Profile
                $('#user-name').text(currentUser.name || user.email);
                $('#user-role').text(currentRole);
                const initial = (currentUser.name || user.email).charAt(0).toUpperCase();
                $('#user-avatar').text(initial);

                // Initialize Dashboard
                initDashboard(currentRole);
            } catch (error) {
                console.error("Auth Error:", error);
                showToast('Error loading profile', 'error');
            }
        } else {
            // Redirect to login if on dashboard
            if (window.location.href.includes('dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    });

    // Sidebar Toggles
    const toggleSidebar = () => {
        $('#sidebar').toggleClass('open');
        $('#sidebar-overlay').toggleClass('active');
    };

    $('#open-sidebar').click(toggleSidebar);
    $('#close-sidebar').click(toggleSidebar);
    $('#sidebar-overlay').click(toggleSidebar);
});

function signOut() {
    auth.signOut().then(() => window.location.href = 'index.html');
}

function initDashboard(role) {
    renderNav(role);
    // Determine default view based on role
    const defaultView = role === 'admin' ? 'analytics' : (role === 'driver' ? 'jobs' : 'shop');
    loadView(defaultView);
}

function renderNav(role) {
    const $nav = $('#nav-menu');
    $nav.empty();

    const items = [];

    if (role === 'admin') {
        items.push({ id: 'analytics', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' });
        items.push({ id: 'stock', label: 'Live Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' });
        items.push({ id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' });
        items.push({ id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
        items.push({ id: 'clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
    } else if (role === 'client') {
        items.push({ id: 'shop', label: 'Live Seafood', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' });
        items.push({ id: 'my-orders', label: 'My Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' });
    } else if (role === 'driver') {
        items.push({ id: 'jobs', label: 'Available Jobs', icon: 'M13 10V3L4 14h7v7l9-11h-7z' });
        items.push({ id: 'my-deliveries', label: 'My Deliveries', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' });
    }

    items.forEach(item => {
        $nav.append(`
            <li class="nav-item">
                <a href="#" onclick="loadView('${item.id}'); return false;" id="nav-${item.id}" class="nav-link">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path></svg>
                    <span>${item.label}</span>
                </a>
            </li>
        `);
    });
}

function loadView(viewId) {
    // Unsubscribe from previous listeners
    listeners.forEach(unsub => unsub());
    listeners = [];

    // Update Nav UI
    $('.nav-link').removeClass('active');
    $(`#nav-${viewId}`).addClass('active');

    // Handle Mobile Sidebar
    $('#sidebar').removeClass('open');
    $('#sidebar-overlay').removeClass('active');

    // Show Loading & Render
    const $main = $('#main-view');
    $main.find('> :not(#view-loading)').remove();
    $('#view-loading').removeClass('hidden');

    setTimeout(() => {
        $('#view-loading').addClass('hidden');
        const $content = $('<div class="view-transition"></div>').appendTo($main);

        switch (viewId) {
            case 'analytics': renderAnalytics($content); break;
            case 'stock': renderStock($content); break;
            case 'shop': renderShop($content); break;
            case 'orders': renderOrdersAdmin($content); break;
            case 'my-orders': renderOrdersClient($content); break;
            case 'jobs': renderDriverJobs($content); break;
            case 'my-deliveries': renderDriverDeliveries($content); break;
            case 'invoices': renderInvoices($content); break;
            case 'clients': renderClients($content); break;
            default: $content.html('<div class="empty-state"><p class="empty-state-text">View under maintenance</p></div>');
        }
    }, 400); // Small artificial delay for smooth transition feel
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================

function renderAnalytics($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Dashboard Overview</h2>
             <div class="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                Today: ${new Date().toLocaleDateString('en-MY', { dateStyle: 'long' })}
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat-card stat-card-animated">
                <div class="stat-icon blue"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                <div class="stat-label">Daily Revenue</div>
                <div class="stat-value" id="stat-daily">RM 0</div>
                <div class="stat-change up"><span>+12.5%</span> vs yesterday</div>
            </div>
            <div class="stat-card stat-card-animated">
                <div class="stat-icon green"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div>
                <div class="stat-label">Monthly Revenue</div>
                <div class="stat-value" id="stat-monthly">RM 0</div>
                <div class="stat-change up"><span>+5.2%</span> vs last month</div>
            </div>
            <div class="stat-card stat-card-animated">
                <div class="stat-icon orange"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                <div class="stat-label">Active Orders</div>
                <div class="stat-value" id="stat-orders">0</div>
                <div class="stat-change down text-gray-500 bg-gray-100"><span class="text-gray-600">Processing</span></div>
            </div>
             <div class="stat-card stat-card-animated">
                <div class="stat-icon purple"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                <div class="stat-label">Total Clients</div>
                <div class="stat-value" id="stat-clients">0</div>
                <div class="stat-change up"><span>New</span> added recently</div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card h-[400px]">
                <div class="card-header">
                    <h3 class="card-title">Sales Trends</h3>
                </div>
                <div class="card-body h-full relative p-4">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>
            <div class="card h-[400px]">
                <div class="card-header">
                    <h3 class="card-title">Top Products</h3>
                </div>
                 <div class="card-body h-full relative p-4 flex items-center justify-center">
                    <canvas id="productsChart"></canvas>
                </div>
            </div>
        </div>
    `);

    // Logic: Fetch Order Data
    const unsub = dbAPI.getOrders('admin', null, (orders) => {
        let daily = 0, monthly = 0, active = 0;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        orders.forEach(o => {
            const total = parseFloat(o.total || 0);
            const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();

            if (['pending', 'accepted', 'delivering'].includes(o.status)) active++;
            if (['completed', 'accepted', 'delivering'].includes(o.status)) { // count committed revenue
                if (date >= startOfDay) daily += total;
                if (date >= startOfMonth) monthly += total;
            }
        });

        $('#stat-daily').text(`RM ${daily.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        $('#stat-monthly').text(`RM ${monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        $('#stat-orders').text(active);

        // Chart Init (Mock Data until advanced aggregation is built)
        initCharts(orders);
    });
    listeners.push(unsub);

    // Fetch clients count
    const unsubClients = dbAPI.getUsers('client', (users) => {
        $('#stat-clients').text(users.length);
    });
    listeners.push(unsubClients);
}

function initCharts(orders) {
    // Simple mock logic for visualization
    const ctx1 = document.getElementById('salesChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue (RM)',
                    data: [1200, 1900, 1500, 2100, 1800, 2500, 3200], // Placeholder
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const ctx2 = document.getElementById('productsChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Lobster', 'Grouper', 'Crab', 'Prawns'],
                datasets: [{
                    data: [35, 25, 25, 15], // Placeholder
                    backgroundColor: ['#0ea5e9', '#1e40af', '#0f2847', '#38bdf8']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function renderStock($el) {
    if (!$('#add-prod-fab').length) {
        $('body').append(`<button id="add-prod-fab" onclick="openAddProductModal()" class="fab"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button>`);
    }

    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Live Stock Management</h2>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Product Details</th>
                        <th>Supplier</th>
                        <th>Live Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="stock-list">
                    <!-- Loaded dynamically -->
                    <tr><td colspan="5" class="p-8 text-center"><div class="shimmer w-full h-12 rounded"></div></td></tr>
                </tbody>
            </table>
        </div>
    `);

    const unsub = dbAPI.getProducts((products) => {
        if (products.length === 0) {
            $('#stock-list').html(`<tr><td colspan="5" class="p-8 text-center text-gray-500">No products found. Add one to get started.</td></tr>`);
            return;
        }

        const rows = products.map(p => {
            const statusClass = p.quantity > 50 ? 'in-stock' : (p.quantity > 0 ? 'low-stock' : 'out-of-stock');
            const statusText = p.quantity > 50 ? 'In Stock' : (p.quantity > 0 ? 'Low Stock' : 'Out of Stock');

            return `
            <tr class="table-row-hover">
                <td>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <div>
                            <div class="font-bold text-gray-900">${p.name}</div>
                            <div class="text-xs text-gray-500">Sell: RM ${p.price}/${p.unit}</div>
                        </div>
                    </div>
                </td>
                <td>${p.supplier}</td>
                <td>
                    <span class="font-bold text-lg">${p.quantity}</span> 
                    <span class="text-sm text-gray-400">${p.unit}</span>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="stock-indicator ${statusClass}"></div>
                        <span class="text-sm font-medium text-gray-700">${statusText}</span>
                    </div>
                </td>
                <td>
                    <div class="flex gap-2">
                        <button onclick="openRestockModal('${p.id}', '${p.name}', '${p.supplier}')" class="btn btn-secondary text-xs py-1 px-3 h-8">Restock</button>
                        <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-600 p-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        $('#stock-list').html(rows);
    });
    listeners.push(unsub);
}

function renderShop($el) {
    if (!$('#cart-fab').length) {
        $('body').append(`
            <button id="cart-fab" onclick="goToCart()" class="fab">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <span id="cart-badge" class="fab-badge hidden">0</span>
            </button>
         `);
    }

    $el.html(`
        <div class="page-header">
            <div>
                <h2 class="page-title">Live Seafood Catalog</h2>
                <p class="text-gray-500">Premium selection, delivered live.</p>
            </div>
        </div>
        <div class="product-grid" id="shop-container">
            <!-- Loading -->
             ${Array(6).fill('<div class="product-card h-96"><div class="skeleton w-full h-48"></div><div class="p-4 space-y-3"><div class="skeleton w-3/4 h-6"></div><div class="skeleton w-1/2 h-4"></div></div></div>').join('')}
        </div>
    `);

    const unsub = dbAPI.getProducts((products) => {
        if (products.length === 0) {
            $('#shop-container').html('<div class="col-span-full empty-state"><div class="empty-state-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div><p class="empty-state-text">No products available at the moment.</p></div>');
            return;
        }

        const cards = products.map(p => `
            <div class="product-card product-card-hover group">
                <div class="product-image">
                    <img src="https://source.unsplash.com/800x600/?seafood,${p.name}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Ocean+Live'">
                    <div class="product-stock-badge">
                        <div class="stock-indicator ${p.quantity > 0 ? 'in-stock' : 'out-of-stock'}"></div>
                        ${p.quantity} left
                    </div>
                </div>
                <div class="product-content">
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-supplier">Direct from ${p.supplier}</p>
                    
                    <div class="product-footer">
                        <div>
                            <span class="text-xs text-gray-500 uppercase">Est. Price</span>
                            <div class="product-price">RM ${p.price}<span class="text-sm font-normal text-gray-400">/${p.unit}</span></div>
                        </div>
                        <div class="flex items-center gap-2">
                             <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.quantity}" class="qty-input">
                             <button onclick="addToCart('${p.id}', '${p.name}', ${p.price}, parseInt($('#qty-${p.id}').val()))" class="btn btn-primary px-3 py-2 rounded-lg">
                                + Add
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        $('#shop-container').html(cards);
    });
    listeners.push(unsub);
}

function renderOrdersAdmin($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Order Management</h2>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="10%">ID</th>
                        <th width="20%">Client</th>
                        <th width="15%">Status</th>
                        <th width="15%">Total</th>
                        <th width="20%">Driver</th>
                        <th width="20%">Actions</th>
                    </tr>
                </thead>
                <tbody id="orders-list">
                    <tr><td colspan="6" class="p-8 text-center"><div class="shimmer w-full h-12 rounded"></div></td></tr>
                </tbody>
            </table>
        </div>
    `);

    const unsub = dbAPI.getOrders('admin', null, (orders) => {
        if (orders.length === 0) {
            $('#orders-list').html(`<tr><td colspan="6" class="empty-state"><p class="empty-state-text">No orders yet.</p></td></tr>`);
            return;
        }

        const rows = orders.map(o => `
            <tr class="table-row-hover">
                <td class="font-mono text-xs text-gray-500">#${o.id.slice(0, 6)}</td>
                <td>
                    <div class="font-bold text-gray-900">${o.clientName || 'Unknown'}</div>
                    <div class="text-xs text-gray-500">${o.storeName || 'Store'}</div>
                </td>
                <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
                <td class="font-bold text-gray-900">${o.total > 0 ? 'RM ' + parseFloat(o.total).toFixed(2) : '-'}</td>
                <td>
                    <div class="flex items-center gap-2">
                         ${o.driverId ? `<div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">D</div><span class="text-sm">Assigned</span>` : '<span class="text-gray-400 italic text-sm">Unassigned</span>'}
                    </div>
                </td>
                <td>
                    <div class="flex gap-2">
                        ${['requested', 'pending'].includes(o.status) ?
                `<button onclick="openProcessOrderModal('${o.id}', '${o.clientId}')" class="btn btn-primary text-xs py-1 px-3 h-8">Process Quote</button>` : ''}
                        ${o.status === 'completed' && !o.invoiced ? `<button onclick="createInvoice('${o.id}')" class="btn btn-success text-xs py-1 px-3 h-8">Invoice</button>` : ''}
                        ${o.invoiced ? '<span class="text-xs text-green-600 font-bold flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Invoiced</span>' : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        $('#orders-list').html(rows);
    });
    listeners.push(unsub);
}

function renderOrdersClient($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">My Order History</h2>
        </div>
        <div class="grid grid-cols-1 gap-4" id="client-orders-list"></div>
    `);

    const unsub = dbAPI.getOrders('client', currentUser.uid, (orders) => {
        if (orders.length === 0) {
            $('#client-orders-list').html('<div class="empty-state"><div class="empty-state-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div><p class="empty-state-text">You haven\'t placed any orders yet.</p></div>');
            return;
        }

        const cards = orders.map(o => `
            <div class="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-bold text-lg text-gray-900">Order #${o.id.slice(0, 8)}</h3>
                        <span class="badge badge-${o.status.toLowerCase()}">${o.status}</span>
                    </div>
                    <div class="text-sm text-gray-500 mb-2">${new Date(o.createdAt.seconds * 1000).toLocaleString()}</div>
                    <div class="flex gap-2 flex-wrap">
                        ${o.items.map(i => `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">${i.name} x${i.qty}</span>`).join('')}
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-500 uppercase">Total Amount</p>
                    <p class="text-2xl font-bold text-blue-900">${o.total > 0 ? 'RM ' + parseFloat(o.total).toFixed(2) : '<span class="text-sm text-gray-400 italic">Pending Quote</span>'}</p>
                </div>
            </div>
        `).join('');
        $('#client-orders-list').html(cards);
    });
    listeners.push(unsub);
}

function renderDriverJobs($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Available Deliveries</h2>
            <p class="text-gray-500">Pick a job to start delivery.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="jobs-grid"></div>
    `);

    // Drivers see orders that are 'accepted' but have no driver assigned
    const unsub = dbAPI.getOrders('driver', null, (orders) => {
        const available = orders.filter(o => o.status === 'accepted' && !o.driverId);

        if (available.length === 0) {
            $('#jobs-grid').html('<div class="col-span-full empty-state"><div class="empty-state-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div><p class="empty-state-text">No jobs available right now. Check back later.</p></div>');
            return;
        }

        const cards = available.map(o => `
            <div class="card p-6 border-l-4 border-blue-500 flex flex-col h-full">
                <div class="flex justify-between items-start mb-4">
                     <div>
                        <span class="text-xs font-mono text-gray-400">#${o.id.slice(0, 6)}</span>
                        <h3 class="font-bold text-lg">${o.storeName || 'Client Store'}</h3>
                     </div>
                     <span class="font-bold text-blue-600">RM ${o.total}</span>
                </div>
                
                <div class="flex-1 space-y-3 mb-6">
                    <div class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <p class="text-sm text-gray-600">${o.deliveryAddress || 'No address provided'}</p>
                    </div>
                </div>

                <button onclick="pickJob('${o.id}')" class="btn btn-primary w-full shadow-lg shadow-blue-200">
                    Accept Job
                </button>
            </div>
        `).join('');
        $('#jobs-grid').html(cards);
    });
    listeners.push(unsub);
}

function renderDriverDeliveries($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">My Deliveries</h2>
        </div>
        <div class="space-y-4" id="my-deliveries-list"></div>
    `);

    const uid = auth.currentUser.uid;
    const unsub = dbAPI.getOrders('driver', null, (orders) => {
        const mine = orders.filter(o => o.driverId === uid && o.status !== 'completed');

        if (mine.length === 0) {
            $('#my-deliveries-list').html('<div class="empty-state"><p class="empty-state-text">You have no active deliveries.</p></div>');
            return;
        }

        const cards = mine.map(o => `
            <div class="bg-white rounded-xl p-6 shadow-card border border-blue-100 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                
                <div class="flex-1">
                     <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-bold text-xl text-gray-900">Order #${o.id.slice(0, 6)}</h3>
                        <span class="badge badge-${o.status.toLowerCase()}">${o.status}</span>
                     </div>
                     <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <p class="font-bold text-gray-800">${o.storeName || 'Client'}</p>
                        <p class="text-gray-600 mb-2">${o.deliveryAddress}</p>
                        <button onclick="window.open('https://maps.google.com/?q=' + encodeURIComponent('${o.deliveryAddress}'))" class="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                            Navigate
                        </button>
                     </div>
                </div>
                
                <div class="flex flex-col justify-center gap-3 md:w-48">
                    ${o.status === 'accepted' || o.status === 'associating_driver' ?
                `<button onclick="updateStatus('${o.id}', 'delivering')" class="btn btn-warning w-full">Start Delivery</button>` : ''
            }
                    ${o.status === 'delivering' ?
                `<button onclick="updateStatus('${o.id}', 'completed')" class="btn btn-success w-full">Complete Order</button>` : ''
            }
                </div>
            </div>
        `).join('');
        $('#my-deliveries-list').html(cards);
    });
    listeners.push(unsub);
}

function renderClients($el) {
    if (!$('#add-client-fab').length) {
        $('body').append(`<button id="add-client-fab" onclick="openAddClientModal()" class="fab"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button>`);
    }

    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Client Management</h2>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Store</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="clients-list"></tbody>
            </table>
        </div>
    `);

    const unsub = dbAPI.getUsers('client', (users) => {
        const rows = users.map(u => `
            <tr class="table-row-hover">
                <td>
                    <div class="font-bold text-gray-900">${u.name}</div>
                    <div class="text-xs text-gray-500">${u.email}</div>
                </td>
                <td>${u.storeName || '-'}</td>
                <td class="max-w-xs truncate">${u.address || '-'}</td>
                <td>
                    <button onclick="openManagePricesModal('${u.uid}', '${u.name}')" class="btn btn-secondary text-xs h-8 px-3">Custom Prices</button>
                </td>
            </tr>
        `).join('');
        $('#clients-list').html(rows);
    });
    listeners.push(unsub);
}

function renderInvoices($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Invoices</h2>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Order Ref</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>LHDN Status</th>
                    </tr>
                </thead>
                <tbody id="invoices-list"></tbody>
            </table>
        </div>
    `);

    const unsub = dbAPI.getInvoices((invoices) => {
        if (invoices.length === 0) {
            $('#invoices-list').html(`<tr><td colspan="5" class="empty-state"><p class="empty-state-text">No invoices generated.</p></td></tr>`);
            return;
        }

        const rows = invoices.map(i => `
            <tr class="table-row-hover">
                <td class="font-mono text-gray-600">NV-${i.id.slice(0, 6)}</td>
                <td class="font-mono text-xs">#${i.orderId.slice(0, 6)}</td>
                <td class="font-bold">RM ${i.amount.toFixed(2)}</td>
                <td class="text-sm text-gray-500">${new Date(i.createdAt.seconds * 1000).toLocaleDateString()}</td>
                <td><span class="badge badge-completed">Validated</span></td>
            </tr>
        `).join('');
        $('#invoices-list').html(rows);
    });
    listeners.push(unsub);
}

// ==========================================
// HELPERS & MODALS
// ==========================================

function addToCart(id, name, price, qty) {
    if (qty < 1) return;
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, name, price, qty });

    // Update Badge
    const count = cart.reduce((acc, i) => acc + i.qty, 0);
    if (count > 0) {
        $('#cart-badge').text(count).removeClass('hidden');
    }

    showToast(`Added ${qty} ${name} to cart`, 'success');
}

function showToast(message, type = 'info') {
    const icon = type === 'success' ?
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
        (type === 'error' ?
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>' :
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>');

    const toast = $(`
        <div class="toast toast-${type}">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        </div>
    `).appendTo('#toast-container');

    setTimeout(() => {
        toast.addClass('toast-out');
        setTimeout(() => toast.remove(), 200);
    }, 3000);
}

// Global Modal Functions
window.openAddProductModal = () => {
    const html = `
     <div class="modal-backdrop" id="modal-bg">
        <div class="modal slide-in">
            <div class="modal-header">
                <h3 class="modal-title">Add New Product</h3>
                <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <form id="add-product-form">
                <div class="modal-body space-y-4">
                     <div>
                        <label class="form-label">Product Name</label>
                        <input type="text" class="form-input" name="name" required>
                     </div>
                     <div>
                        <label class="form-label">Supplier</label>
                        <input type="text" class="form-input" name="supplier" required>
                     </div>
                     <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Price (RM)</label>
                            <input type="number" step="0.01" class="form-input" name="price" required>
                        </div>
                        <div>
                            <label class="form-label">Unit</label>
                            <input type="text" class="form-input" name="unit" placeholder="kg, pcs" required>
                        </div>
                     </div>
                     <div>
                        <label class="form-label">Initial Quantity</label>
                        <input type="number" class="form-input" name="quantity" required>
                     </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="$('#modal-bg').remove()" class="btn btn-ghost">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Product</button>
                </div>
            </form>
        </div>
     </div>
    `;
    $('#modal-container').html(html);

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
        showToast('Product added successfully', 'success');
    });
};

window.goToCart = () => {
    if (cart.length === 0) { showToast("Your cart is empty", "warning"); return; }

    const html = `
     <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Your Order</h3>
                <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div class="modal-body max-h-[60vh] overflow-y-auto">
                <div class="space-y-4">
                ${cart.map(i => `
                    <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p class="font-bold text-gray-900">${i.name}</p>
                            <p class="text-sm text-gray-500">Approx. RM ${i.price} / ${i.qty} units</p>
                        </div>
                        <div class="font-bold text-lg bg-white px-3 py-1 rounded border">x${i.qty}</div>
                    </div>
                `).join('')}
                </div>
                <p class="mt-4 text-sm text-gray-500 bg-blue-50 p-3 rounded text-center">
                    Note: Final pricing will be quoted by the Admin.
                </p>
            </div>
            <div class="modal-footer">
                 <button onclick="$('#modal-bg').remove()" class="btn btn-ghost">Continue Shopping</button>
                 <button onclick="submitOrder()" class="btn btn-primary">Submit Request</button>
            </div>
        </div>
     </div>
    `;
    $('#modal-container').html(html);
};

window.submitOrder = async () => {
    try {
        const order = {
            clientId: auth.currentUser.uid,
            clientName: currentUser.name || 'Unknown',
            storeName: currentUser.storeName || '',
            deliveryAddress: currentUser.address || 'No address provided',
            items: cart,
            total: 0,
            status: 'requested',
            driverId: null
        };
        await dbAPI.createOrder(order);
        cart = [];
        $('#cart-badge').addClass('hidden');
        $('#modal-bg').remove();
        showToast("Order submitted! Waiting for quote.", "success");
        loadView('my-orders');
    } catch (e) {
        showToast("Failed to submit order", "error");
    }
};

window.openRestockModal = (id, name, currentSupplier) => {
    const html = `
     <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Restock Inventory</h3>
                <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <form id="restock-form">
                <div class="modal-body space-y-4">
                    <p class="text-gray-500">Updating stock for <strong>${name}</strong></p>
                    <div>
                        <label class="form-label">Supplier</label>
                        <input type="text" class="form-input" name="supplier" value="${currentSupplier}" required>
                    </div>
                    <div>
                        <label class="form-label">Quantity to Add</label>
                        <input type="number" class="form-input" name="quantity" required min="1">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="$('#modal-bg').remove()" class="btn btn-ghost">Cancel</button>
                    <button type="submit" class="btn btn-primary">Confirm & Update</button>
                </div>
            </form>
        </div>
     </div>
    `;
    $('#modal-container').html(html);

    $('#restock-form').submit(async (e) => {
        e.preventDefault();
        const addedQty = parseInt($('input[name="quantity"]').val());
        const supplier = $('input[name="supplier"]').val();

        await db.collection('products').doc(id).update({
            quantity: firebase.firestore.FieldValue.increment(addedQty),
            supplier: supplier,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        $('#modal-bg').remove();
        showToast('Stock updated successfully', 'success');
    });
};

window.openProcessOrderModal = async (orderId, clientId) => {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();

    window.tempQuoteItems = orderData.items.map(i => ({ ...i, finalPrice: i.price, itemTotal: i.price * i.qty }));

    const html = `
     <div class="modal-backdrop" id="modal-bg">
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3 class="modal-title">Process Quote: #${orderId.slice(0, 6)}</h3>
                <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div class="modal-body">
                <div class="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
                    <div>
                        <p class="font-bold text-blue-900">${orderData.clientName}</p>
                        <p class="text-sm text-blue-700">${orderData.storeName}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-500 uppercase">Items</p>
                        <p class="font-bold">${orderData.items.length}</p>
                    </div>
                </div>
                
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="border-b text-gray-500">
                            <th class="pb-2">Product</th>
                            <th class="pb-2">Qty</th>
                            <th class="pb-2 text-right">Price (RM)</th>
                            <th class="pb-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody class="space-y-2">
                        ${orderData.items.map((item, idx) => `
                        <tr class="border-b border-gray-100">
                            <td class="py-3">${item.name}</td>
                            <td class="py-3 font-bold">${item.qty}</td>
                            <td class="py-3 text-right">
                                <input type="number" step="0.01" class="border rounded p-1 w-24 text-right" 
                                       value="${item.price}" 
                                       onchange="updateProcessTotal(${idx}, this.value, ${item.qty})">
                            </td>
                            <td class="py-3 text-right font-bold text-gray-800" id="item-total-${idx}">
                                RM ${(item.price * item.qty).toFixed(2)}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="flex justify-between items-center mt-6 pt-4 border-t px-4">
                    <span class="text-lg font-bold">Grand Total</span>
                    <span class="text-2xl font-bold text-blue-600" id="grand-total">RM ${window.tempQuoteItems.reduce((a, b) => a + b.itemTotal, 0).toFixed(2)}</span>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="$('#modal-bg').remove()" class="btn btn-ghost">Cancel</button>
                <button onclick="confirmQuote('${orderId}')" class="btn btn-primary">Send Quote & Accept</button>
            </div>
        </div>
     </div>
    `;
    $('#modal-container').html(html);
};

window.updateProcessTotal = (idx, newPrice, qty) => {
    const price = parseFloat(newPrice) || 0;
    const total = price * qty;
    window.tempQuoteItems[idx].finalPrice = price;
    window.tempQuoteItems[idx].itemTotal = total;

    $('#item-total-' + idx).text(`RM ${total.toFixed(2)}`);
    const grand = window.tempQuoteItems.reduce((a, b) => a + b.itemTotal, 0);
    $('#grand-total').text(`RM ${grand.toFixed(2)}`);
};

window.confirmQuote = async (orderId) => {
    const total = window.tempQuoteItems.reduce((sum, item) => sum + item.itemTotal, 0);
    await dbAPI.updateOrderStatus(orderId, 'accepted');
    await db.collection('orders').doc(orderId).update({
        total: total,
        items: window.tempQuoteItems
    });
    $('#modal-bg').remove();
    showToast("Quote sent & Order Accepted!", "success");
};

window.updateStatus = async (id, status) => {
    await dbAPI.updateOrderStatus(id, status, status === 'delivering' ? auth.currentUser.uid : null);
    showToast(`Order marked as ${status}`, "success");
};

window.pickJob = async (id) => {
    const uid = auth.currentUser.uid;
    await dbAPI.updateOrderStatus(id, 'delivering', uid);
    showToast("Job accepted! Drive safely.", "success");
    loadView('my-deliveries');
}

window.createInvoice = async (orderId) => {
    const doc = await db.collection('orders').doc(orderId).get();
    await dbAPI.generateInvoice(orderId, doc.data());
    await db.collection('orders').doc(orderId).update({ invoiced: true });
    showToast("Invoice generated successfully", "success");
}

window.deleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
        await dbAPI.deleteProduct(id);
        showToast("Product deleted", "success");
    }
};

window.openAddClientModal = () => {
    const html = `
     <div class="modal-backdrop" id="modal-bg">
        <div class="modal slide-in">
            <div class="modal-header">
                <h3 class="modal-title">Register New Client</h3>
                <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <form id="add-client-form">
                <div class="modal-body space-y-4">
                     <div>
                        <label class="form-label">Client Name</label>
                        <input type="text" class="form-input" name="name" required>
                     </div>
                     <div>
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" required>
                     </div>
                     <div>
                        <label class="form-label">Store Name</label>
                        <input type="text" class="form-input" name="storeName" required>
                     </div>
                     <div>
                        <label class="form-label">Delivery Address</label>
                        <textarea class="form-input h-24" name="address" required></textarea>
                     </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="$('#modal-bg').remove()" class="btn btn-ghost">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Client</button>
                </div>
            </form>
        </div>
     </div>
    `;
    $('#modal-container').html(html);

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
        showToast('Client added manually', 'success');
    });
};

window.openManagePricesModal = async (uid, clientName) => {
    // Fetch products once
    const products = await new Promise(resolve => {
        const unsub = dbAPI.getProducts(data => {
            unsub(); // Stop listening immediately
            resolve(data);
        });
    });

    const html = `
     <div class="modal-backdrop" id="modal-bg">
        <div class="modal" style="max-width: 600px;">
            <div class="modal-header">
                <h3 class="modal-title">Custom Prices: ${clientName}</h3>
                <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div class="modal-body">
                <p class="text-sm text-gray-500 mb-4">Set specific pricing for this client. If left blank, standard pricing applies.</p>
                <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    ${products.map(p => `
                        <div class="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                            <span class="font-medium">${p.name} <span class="text-xs text-gray-400">(${p.unit})</span></span>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-400">RM</span>
                                <input type="number" step="0.01" value="${p.price}" 
                                    class="form-input w-24 text-right" 
                                    onchange="saveClientPrice('${uid}', '${p.id}', this.value)">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="$('#modal-bg').remove()" class="btn btn-primary">Done</button>
            </div>
        </div>
     </div>
    `;
    $('#modal-container').html(html);
};

window.saveClientPrice = async (userId, productId, price) => {
    if (!price) return;
    await dbAPI.setCustomPrice(userId, productId, price);
    showToast("Price updated for client", "success");
};
