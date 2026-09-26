const CONFIG = {
    toastDuration: 4000
};

export function showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    }, CONFIG.toastDuration);
}

export function showError(msg) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.innerHTML = `
            <div style="text-align: center; padding: 2rem; max-width: 400px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p class="serif" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem;">Oops!</p>
                <p style="color: var(--text-muted);">${msg}</p>
            </div>
        `;
    } else {
        alert(msg);
    }
}
