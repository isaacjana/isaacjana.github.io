/**
 * PennyWise Pro - Header Component
 * Displays user profile pill, month switcher, and responsive hero balance
 */

import { store } from '../store.js';
import { formatPeriod, getNextPeriod, getPrevPeriod, getCurrentPeriodKey, formatRM } from '../utils/format.js';
import { authService } from '../services/auth.js';
import { openAccountDrawer } from './accountModal.js';
import { showToast } from './toast.js';

export function initHeader() {
  const container = document.getElementById('header-section');
  if (!container) return;

  function render(state) {
    const periodLabel = formatPeriod(state.period);
    const currentUser = authService.getUser();
    const grandTotal = store.getGrandTotal();
    const balance = store.getBalance();
    const currentPeriodKey = getCurrentPeriodKey();
    const isCurrentMonth = state.period === currentPeriodKey;

    let healthBadgeHtml = '';
    if (balance > 0) {
      healthBadgeHtml = `
        <div class="hero-status-pill surplus">
          <i class="fa-solid fa-circle-check"></i>
          <span>RM ${formatRM(balance, false)} Surplus Balance</span>
        </div>
      `;
    } else if (balance < 0) {
      healthBadgeHtml = `
        <div class="hero-status-pill deficit">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>RM ${formatRM(Math.abs(balance), false)} Over Budget</span>
        </div>
      `;
    } else {
      healthBadgeHtml = `
        <div class="hero-status-pill balanced">
          <i class="fa-solid fa-scale-balanced"></i>
          <span>Zero-Balanced Budget</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="header-top">
        <div class="brand-badge">
          <img src="assets/icons/favicon-32x32.png" alt="PennyWise" class="brand-logo-img">
          <div>
            <h1 class="text-xl font-black tracking-tight" style="color: #ffffff;">PennyWise</h1>
            <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--color-primary-200); opacity: 0.9;">
              Personal Budget Pro
            </p>
          </div>
        </div>

        <!-- Google User Pill -->
        <div class="flex items-center gap-2">
          ${currentUser ? `
            <div id="btn-open-account-header" class="auth-badge cursor-pointer" title="Google Account & Cloud Sync">
              <div class="text-right leading-tight">
                <p class="text-xs font-bold" style="color: #ffffff;">${currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Google User'}</p>
                <p class="text-[10px] text-emerald-200 opacity-90 flex items-center justify-end gap-1">
                  <span class="live-sync-dot"></span> Google Sync
                </p>
              </div>
              <div class="auth-avatar">
                ${currentUser.photoURL ? `<img src="${currentUser.photoURL}" alt="User" referrerpolicy="no-referrer">` : `<i class="fa-brands fa-google text-sm text-white"></i>`}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Month Navigation Pill -->
      <div class="month-picker-container">
        <button id="btn-prev-month" class="month-picker-btn" title="Previous Month">
          <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>

        <div class="month-picker-label">
          <div class="flex items-center justify-center gap-1.5">
            <p class="month-picker-title">${periodLabel.toUpperCase()}</p>
            ${!isCurrentMonth ? `
              <button id="btn-jump-current-month" class="badge-jump-today" title="Jump to Current Month">
                Current
              </button>
            ` : ''}
          </div>
          <p class="month-picker-subtitle">Budget & Commitments</p>
        </div>

        <button id="btn-next-month" class="month-picker-btn" title="Next Month">
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>

      <!-- Hero Balance Display -->
      <div class="balance-hero">
        <div class="flex items-center justify-center gap-2 mb-1">
          <p class="balance-label">Available Balance</p>
          <button id="btn-quick-edit-salary" class="hero-salary-pill" title="Click to adjust monthly salary">
            <i class="fa-solid fa-wallet text-[10px]"></i>
            <span>Income: RM ${formatRM(state.salary, false)}</span>
            <i class="fa-solid fa-pen text-[9px] opacity-70"></i>
          </button>
        </div>

        <div class="balance-amount-row">
          <span class="balance-currency">RM</span>
          <span id="hero-balance-val" class="balance-value" style="color: ${balance < 0 ? 'var(--color-coral)' : '#ffffff'};">
            ${formatRM(balance, false)}
          </span>
        </div>

        ${healthBadgeHtml}

        <div id="hero-formula-tag" class="balance-formula-tag">
          <i class="fa-solid fa-calculator text-[11px]"></i>
          <span id="hero-formula-text">RM ${formatRM(state.salary, false)} - RM ${formatRM(grandTotal, false)} = RM ${formatRM(balance, false)}</span>
        </div>
      </div>
    `;

    // Event Bindings
    document.getElementById('btn-prev-month')?.addEventListener('click', () => {
      const prev = getPrevPeriod(store.state.period);
      store.setPeriod(prev);
    });

    document.getElementById('btn-next-month')?.addEventListener('click', () => {
      const next = getNextPeriod(store.state.period);
      store.setPeriod(next);
    });

    document.getElementById('btn-jump-current-month')?.addEventListener('click', () => {
      store.setPeriod(currentPeriodKey);
      showToast(`Switched to current month (${formatPeriod(currentPeriodKey, true)})`, 'info');
    });

    document.getElementById('btn-open-account-header')?.addEventListener('click', () => {
      openAccountDrawer();
    });

    document.getElementById('btn-quick-edit-salary')?.addEventListener('click', () => {
      const salaryInput = document.getElementById('input-salary');
      if (salaryInput) {
        salaryInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        salaryInput.focus();
        salaryInput.select();
      }
    });
  }

  // Subscribe to store updates
  store.subscribe(render);
  authService.onAuthStateChanged(() => render(store.state));
}
