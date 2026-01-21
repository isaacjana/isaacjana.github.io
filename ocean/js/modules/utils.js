// js/modules/utils.js

export function formatCurrency(amount) {
    return 'RM ' + parseFloat(amount).toFixed(2);
}

export function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function showToast(message, type = 'info') {
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

// Make globally available for legacy/inline calls if needed
window.showToast = showToast;
