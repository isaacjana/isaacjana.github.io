// js/modules/views.js
import { formatCurrency, formatDate } from './utils.js';

export function renderPendingAssignment($el) {
    $el.html(`
        <div class="flex flex-col items-center justify-center text-center h-[80vh] max-w-lg mx-auto animate-slide-up">
            <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-8 shadow-inner animate-pulse-soft">
                <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-12.214A9.003 9.003 0 0012 21.75c1.012 0 1.983-.167 2.887-.476m5.215-4.493a9.001 9.001 0 01-11.875-11.875M16.5 6a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"></path>
                </svg>
            </div>
            <h2 class="text-3xl font-extrabold text-blue-900 mb-4 tracking-tight">Access Restricted</h2>
            <p class="text-gray-600 text-lg mb-8 leading-relaxed">
                Welcome to Ocean. Your account is verified, but you need to be assigned to a business profile before you can access the seafood catalog and place orders.
            </p>
            <div class="card p-8 w-full border-t-4 border-blue-600">
                <p class="font-bold text-gray-900 mb-3 text-lg">Next Steps</p>
                <p class="text-gray-600 text-sm mb-6 leading-relaxed">Please contact your account manager or the Ocean administration team to complete your store profile setup.</p>
                <div class="flex flex-col gap-3">
                    <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 text-left">
                        <p class="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">Your Account ID</p>
                        <p class="font-mono text-blue-600 text-sm truncate">${auth.currentUser.uid}</p>
                    </div>
                </div>
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
        <div class="page-header animate-slide-in-right">
            <div>
                <h2 class="page-title">Executive Dashboard</h2>
                <p class="text-gray-500">Live operational oversight and business health metrics.</p>
            </div>
             <div class="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span class="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    ${new Date().toLocaleDateString('en-MY', { dateStyle: 'long' })}
                </span>
            </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
            <div class="stat-card hover-lift">
                <div class="stat-icon blue"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                <div class="stat-label">Daily Revenue</div>
                <div class="stat-value" id="stat-daily">RM 0</div>
                <div class="stat-change up"><span>Live</span> Estimate</div>
            </div>
            <div class="stat-card hover-lift">
                <div class="stat-icon green"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div>
                <div class="stat-label">Monthly Revenue</div>
                <div class="stat-value" id="stat-monthly">RM 0</div>
            </div>
            <div class="stat-card hover-lift">
                <div class="stat-icon orange"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                <div class="stat-label">Active Orders</div>
                <div class="stat-value" id="stat-orders">0</div>
            </div>
             <div class="stat-card hover-lift">
                <div class="stat-icon purple"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                <div class="stat-label">Total Clients</div>
                <div class="stat-value" id="stat-clients">0</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.1s">
            <!-- Charts Section (Span 2 Cols) -->
            <div class="lg:col-span-2 space-y-6">
                <div class="card h-[400px]">
                    <div class="card-header border-b border-gray-100 flex justify-between items-center">
                        <h3 class="card-title">Sales Trends (Last 7 Days)</h3>
                        <div class="p-1 bg-gray-50 rounded-lg flex items-center gap-1">
                             <div class="px-3 py-1 bg-white shadow-sm rounded-md text-[10px] font-bold text-blue-600 uppercase">Weekly View</div>
                        </div>
                    </div>
                    <div class="card-body h-full relative p-6">
                        <canvas id="salesChart"></canvas>
                    </div>
                </div>
                
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div class="card h-[320px]">
                        <div class="card-header border-b border-gray-100">
                            <h3 class="card-title">Product Distribution</h3>
                        </div>
                         <div class="card-body h-full relative p-6 flex items-center justify-center">
                            <canvas id="productsChart"></canvas>
                        </div>
                    </div>
                    <!-- Low Stock Widget -->
                    <div class="card h-[320px] flex flex-col border-l-4 border-l-red-500">
                        <div class="card-header flex justify-between items-center bg-red-50/30">
                            <h3 class="card-title text-red-700 font-extrabold flex items-center gap-2">
                                <span class="relative flex h-2 w-2">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Inventory Alerts
                            </h3>
                            <button onclick="loadView('stock')" class="text-[10px] bg-white text-red-600 font-bold px-2 py-1 rounded-md border border-red-100 shadow-sm hover:bg-red-50 uppercase tracking-wider transition-colors">Manage</button>
                        </div>
                        <div class="card-header-divider h-px bg-red-100"></div>
                        <div class="card-body relative p-0 overflow-y-auto flex-1">
                            <div id="low-stock-list" class="divide-y divide-gray-50">
                                <div class="p-8 text-center"><div class="shimmer w-full h-6 rounded mb-2"></div><div class="shimmer w-3/4 h-4 rounded"></div></div>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Recent Activity / Quick Actions (Span 1 Col) -->
             <div class="space-y-6">
                <div class="card">
                     <div class="card-header border-b border-gray-100">
                        <h3 class="card-title uppercase tracking-widest text-[11px] font-black text-gray-400">Quick Portal</h3>
                    </div>
                    <div class="card-body p-5 grid grid-cols-2 gap-4">
                        <button onclick="openAddProductModal()" class="flex flex-col items-center justify-center p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-100/50 transition-all text-blue-700 gap-2 group">
                             <div class="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></div>
                             <span class="text-[10px] font-bold uppercase tracking-wider">Add Stock</span>
                        </button>
                         <button onclick="loadView('orders')" class="flex flex-col items-center justify-center p-4 bg-emerald-50/50 rounded-2xl hover:bg-emerald-100/50 transition-all text-emerald-700 gap-2 group">
                             <div class="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div>
                             <span class="text-[10px] font-bold uppercase tracking-wider">Orders</span>
                        </button>
                        <button onclick="loadView('clients')" class="flex flex-col items-center justify-center p-4 bg-indigo-50/50 rounded-2xl hover:bg-indigo-100/50 transition-all text-indigo-700 gap-2 group">
                             <div class="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
                             <span class="text-[10px] font-bold uppercase tracking-wider">Clients</span>
                        </button>
                         <button onclick="loadView('invoices')" class="flex flex-col items-center justify-center p-4 bg-amber-50/50 rounded-2xl hover:bg-amber-100/50 transition-all text-amber-700 gap-2 group">
                             <div class="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                             <span class="text-[10px] font-bold uppercase tracking-wider">Billing</span>
                        </button>
                    </div>
                </div>

                <div class="card bg-gradient-to-br from-[#0f2847] to-[#1e40af] text-white relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                        <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 15.01l1.5 1.48z"></path></svg>
                    </div>
                    <div class="card-body p-8 relative z-10">
                        <p class="text-blue-300 text-[10px] uppercase font-bold tracking-[0.2em] mb-2">Operations Center</p>
                        <h4 class="text-2xl font-black mb-6 leading-tight">System<br/>Infrastructure Status</h4>
                        <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                             <span class="relative flex h-3 w-3">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span class="text-xs font-bold uppercase tracking-wider">All instances online</span>
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
        <div class="page-header animate-slide-in-right">
            <div>
                <h2 class="page-title">Client Portfolio</h2>
                <p class="text-gray-500">Manage business associates and custom pricing agreements.</p>
            </div>
        </div>
        <div class="card animate-slide-up">
            <div class="table-container">
                <table class="data-table w-full">
                    <thead>
                        <tr>
                            <th>Client Identity</th>
                            <th>Business Profile</th>
                            <th>Location</th>
                            <th>Agreement</th>
                        </tr>
                    </thead>
                    <tbody id="clients-list">
                        ${users.map(u => `
                            <tr class="table-row-hover">
                                <td>
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                                            ${(u.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-900">${u.name}</div>
                                            <div class="text-[10px] text-gray-400 font-mono tracking-tighter">${u.uid.slice(0, 12)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="font-bold text-blue-900">${u.storeName || 'Walk-in'}</div>
                                    <div class="text-[10px] text-gray-500 font-mono">${u.storeId || 'UNASSIGNED'}</div>
                                    ${!u.storeId ? '<span class="inline-block mt-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded uppercase tracking-widest">Pending</span>' : ''}
                                </td>
                                <td class="max-w-[200px]">
                                    <div class="text-sm text-gray-600 truncate" title="${u.address || 'N/A'}">${u.address || 'No address registered'}</div>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <button onclick="openEditClientModal('${u.uid}')" class="btn btn-secondary text-[10px] uppercase font-bold h-9 px-4 flex items-center gap-2">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                            Profile
                                        </button>
                                        <button onclick="openManagePricesModal('${u.uid}', '${u.name}')" class="btn btn-primary text-[10px] uppercase font-bold h-9 px-4 shadow-sm">Rates</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `);
}
