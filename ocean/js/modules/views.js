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

export function renderAnalytics($el) {
    // ... (Existing Analytics code moved here)
    // We will call initCharts from here or pass data back
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
                <div class="stat-change up"><span>Live</span> Estimate</div>
            </div>
            <div class="stat-card stat-card-animated">
                <div class="stat-icon green"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div>
                <div class="stat-label">Monthly Revenue</div>
                <div class="stat-value" id="stat-monthly">RM 0</div>
            </div>
            <div class="stat-card stat-card-animated">
                <div class="stat-icon orange"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                <div class="stat-label">Active Orders</div>
                <div class="stat-value" id="stat-orders">0</div>
            </div>
             <div class="stat-card stat-card-animated">
                <div class="stat-icon purple"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                <div class="stat-label">Total Clients</div>
                <div class="stat-value" id="stat-clients">0</div>
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

    // Bind listeners via callbacks passed from main controller if we wanted true clean architecture
    // For now we assume initCharts exists globally or we import it.
    // We'll rely on global `initCharts` being available or moved here.
    // To minimize breakage, we will expose this render function but the logic stays in app.js for now or moves to actions.
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
