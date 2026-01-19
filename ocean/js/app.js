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

        $('#stat-daily').text(`RM ${daily.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        $('#stat-monthly').text(`RM ${monthly.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
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
    if(ctx1) {
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
    if(ctx2) {
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
             ${ Array(6).fill('<div class="product-card h-96"><div class="skeleton w-full h-48"></div><div class="p-4 space-y-3"><div class="skeleton w-3/4 h-6"></div><div class="skeleton w-1/2 h-4"></div></div></div>').join('') }
        </div>
    `);

    const unsub = dbAPI.getProducts((products) => {
        if(products.length === 0) {
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

// ... Additional helper functions continue in next block
