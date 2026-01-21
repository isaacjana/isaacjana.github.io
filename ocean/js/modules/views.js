// js/modules/views.js
import { formatCurrency, formatDate } from './utils.js';

export function renderPendingAssignment($el) {
    $el.html(`
        <div class="flex flex-col items-center justify-center text-center h-[70vh] max-w-lg mx-auto">
            <div class="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
            <p class="text-gray-600 text-lg mb-8">
                Welcome to Ocean! Your account has been created, but you must be assigned to a store by an Administrator before you can start ordering.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 w-full">
                <p class="font-semibold text-blue-900 mb-2">What to do next?</p>
                <p class="text-blue-800 text-sm">Please contact the Ocean Admin team to verify your account and assign your store profile.</p>
                <p class="text-xs text-gray-500 mt-4">User ID: <span class="font-mono bg-white px-2 py-1 rounded border">${auth.currentUser.uid}</span></p>
            </div>
        </div>
    `);
}

// Local helper for charts within this module
function initAnalyticsCharts(labels, salesData, productData) {
    const ctx1 = document.getElementById('salesChart');
    if (ctx1) {
        if (window.salesChartInstance) window.salesChartInstance.destroy();
        window.salesChartInstance = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (RM)',
                    data: salesData,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#0ea5e9',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const ctx2 = document.getElementById('productsChart');
    if (ctx2) {
        if (window.productsChartInstance) window.productsChartInstance.destroy();
        window.productsChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: productData.map(([name]) => name),
                datasets: [{
                    data: productData.map(([, qty]) => qty),
                    backgroundColor: ['#0ea5e9', '#1e40af', '#0f2847', '#38bdf8', '#7dd3fc', '#e0f2fe'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } }
                },
                cutout: '70%'
            }
        });
    }
}

export function renderAnalytics($el) {
    $el.html(`
        <div class="page-header">
            <h2 class="page-title">Dashboard</h2>
             <div class="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                ${new Date().toLocaleDateString('en-MY', { dateStyle: 'long' })}
            </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat-card stat-card-animated transition-all hover:scale-105 duration-200">
                <div class="stat-icon blue"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                <div class="stat-label">Daily Revenue</div>
                <div class="stat-value" id="stat-daily">RM 0</div>
                <div class="stat-change up"><span>Live</span> Estimate</div>
            </div>
            <div class="stat-card stat-card-animated transition-all hover:scale-105 duration-200">
                <div class="stat-icon green"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div>
                <div class="stat-label">Monthly Revenue</div>
                <div class="stat-value" id="stat-monthly">RM 0</div>
            </div>
            <div class="stat-card stat-card-animated transition-all hover:scale-105 duration-200">
                <div class="stat-icon orange"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                <div class="stat-label">Active Orders</div>
                <div class="stat-value" id="stat-orders">0</div>
            </div>
             <div class="stat-card stat-card-animated transition-all hover:scale-105 duration-200">
                <div class="stat-icon purple"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                <div class="stat-label">Total Clients</div>
                <div class="stat-value" id="stat-clients">0</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Charts Section (Span 2 Cols) -->
            <div class="lg:col-span-2 space-y-6">
                <div class="card h-[400px]">
                    <div class="card-header">
                        <h3 class="card-title">Sales Trends (Last 7 Days)</h3>
                    </div>
                    <div class="card-body h-full relative p-4">
                        <canvas id="salesChart"></canvas>
                    </div>
                </div>
                
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div class="card h-[300px]">
                        <div class="card-header">
                            <h3 class="card-title">Top Products</h3>
                        </div>
                         <div class="card-body h-full relative p-4 flex items-center justify-center">
                            <canvas id="productsChart"></canvas>
                        </div>
                    </div>
                    <!-- Low Stock Widget (New Feature) -->
                    <div class="card h-[300px] flex flex-col">
                        <div class="card-header flex justify-between items-center">
                            <h3 class="card-title text-red-600 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                Low Stock Alert
                            </h3>
                            <button onclick="loadView('stock')" class="text-xs text-blue-600 font-bold hover:underline">Manage</button>
                        </div>
                        <div class="card-body relative p-0 overflow-y-auto flex-1">
                            <div id="low-stock-list" class="divide-y divide-gray-100">
                                <div class="p-4 text-center text-gray-400 text-sm">Checking stock...</div>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Recent Activity / Quick Actions (Span 1 Col) -->
             <div class="space-y-6">
                <div class="card">
                     <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="card-body p-4 grid grid-cols-2 gap-3">
                        <button onclick="openAddProductModal()" class="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 gap-1">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                             <span class="text-xs font-bold">Add Product</span>
                        </button>
                         <button onclick="loadView('orders')" class="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-green-700 gap-1">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                             <span class="text-xs font-bold">Process Orders</span>
                        </button>
                        <button onclick="loadView('clients')" class="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-purple-700 gap-1">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                             <span class="text-xs font-bold">Manage Clients</span>
                        </button>
                         <button onclick="loadView('invoices')" class="flex flex-col items-center justify-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-orange-700 gap-1">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                             <span class="text-xs font-bold">Invoices</span>
                        </button>
                    </div>
                </div>

                <div class="card bg-gradient-to-br from-indigo-900 to-blue-900 text-white">
                    <div class="card-body p-6 text-center">
                        <p class="text-indigo-200 text-sm mb-1">System Status</p>
                        <h4 class="text-xl font-bold mb-4">Ocean Platform Live</h4>
                        <div class="flex items-center justify-center gap-2">
                             <span class="relative flex h-3 w-3">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span class="text-sm font-medium">All systems operational</span>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    `);

    const unsubs = [];

    // 1. Fetch Order Data for Lists & Charts
    const unsubOrders = dbAPI.getOrders('admin', null, (orders) => {
        let daily = 0, monthly = 0, active = 0;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-MY', { weekday: 'short' });
        }).reverse();

        const salesData = Array(7).fill(0);
        const productStats = {};

        orders.forEach(o => {
            const total = parseFloat(o.total || 0);
            const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
            const dateStr = date.toLocaleDateString('en-MY', { weekday: 'short' });

            if (['pending', 'accepted', 'delivering'].includes(o.status)) active++;

            if (['completed', 'accepted', 'delivering'].includes(o.status)) {
                if (date >= startOfDay) daily += total;
                if (date >= startOfMonth) monthly += total;

                // Chart: Sales (Last 7 Days)
                const dayIndex = last7Days.indexOf(dateStr);
                if (dayIndex !== -1) salesData[dayIndex] += total;

                // Chart: Top Products
                if (o.items) {
                    o.items.forEach(i => {
                        productStats[i.name] = (productStats[i.name] || 0) + i.qty;
                    });
                }
            }
        });

        $('#stat-daily').text(`RM ${daily.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        $('#stat-monthly').text(`RM ${monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        $('#stat-orders').text(active);

        const sortedProducts = Object.entries(productStats).sort(([, a], [, b]) => b - a).slice(0, 5);
        initAnalyticsCharts(last7Days, salesData, sortedProducts);
    });
    unsubs.push(unsubOrders);

    // 2. Fetch Clients Count
    const unsubClients = dbAPI.getUsers('client', (users) => {
        $('#stat-clients').text(users.length);
    });
    unsubs.push(unsubClients);

    // 3. Low Stock Widget (New Feature Logic)
    const unsubProducts = dbAPI.getProducts((products) => {
        const lowStock = products.filter(p => p.quantity <= 10).sort((a, b) => a.quantity - b.quantity).slice(0, 5);

        if (lowStock.length === 0) {
            $('#low-stock-list').html('<div class="p-4 text-center text-green-500 text-sm font-medium">All stock levels abundant!</div>');
        } else {
            $('#low-stock-list').html(lowStock.map(p => `
                <div class="p-3 flex items-center justify-between hover:bg-red-50 transition-colors">
                    <div>
                        <div class="font-medium text-gray-800 text-sm">${p.name}</div>
                        <div class="text-xs text-gray-500">${p.supplier}</div>
                    </div>
                    <div class="text-right">
                         <div class="font-bold text-red-600 text-lg">${p.quantity}</div>
                         <div class="text-xs text-gray-400">${p.unit}</div>
                    </div>
                </div>
             `).join(''));
        }
    });
    unsubs.push(unsubProducts);

    // Return a function that unsubscribes from all listeners
    return () => unsubs.forEach(u => u());
}

export function renderClients($el, users) {
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
                        <th>Store (ID)</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="clients-list">
                    ${users.map(u => `
                        <tr class="table-row-hover">
                            <td>
                                <div class="font-bold text-gray-900">${u.name}</div>
                                <div class="text-xs text-gray-500">${u.email}</div>
                                ${!u.storeId ? '<span class="text-xs text-orange-500 font-bold">Unassigned</span>' : ''}
                            </td>
                            <td>
                                <div class="font-medium">${u.storeName || '-'}</div>
                                <div class="text-xs text-mono text-gray-400">${u.storeId || 'No Store ID'}</div>
                            </td>
                            <td class="max-w-xs truncate text-sm">${u.address || '-'}</td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="openEditClientModal('${u.uid}')" class="btn btn-secondary text-xs h-8 px-3">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        Edit
                                    </button>
                                    <button onclick="openManagePricesModal('${u.uid}', '${u.name}')" class="btn btn-secondary text-xs h-8 px-3">Prices</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `);
}
