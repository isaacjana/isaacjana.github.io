/**
 * PennyWise Pro - Header Component
 * Displays user profile pill, month switcher, and responsive hero balance
 */

import { store } from '../store.js';
import { formatPeriod, getNextPeriod, getPrevPeriod } from '../utils/format.js';
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

    container.innerHTML = `
      <div class="header-top">
        <div class="brand-badge">
          <div class="brand-dot"></div>
          <div>
            <h1 class="text-xl font-black tracking-tight" style="color: #ffffff;">PennyWise</h1>
            <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--color-primary-200); opacity: 0.85;">
              Personal Budget Pro
            </p>
          </div>
        </div>

        <!-- User Profile Pill -->
        <div class="flex items-center gap-2">
          ${currentUser ? `
            <div id="btn-open-account-header" class="auth-badge cursor-pointer" title="Manage Account & Profiles">
              <div class="text-right leading-tight">
                <p class="text-xs font-bold" style="color: #ffffff;">${currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'User'}</p>
                <p class="text-[10px] text-emerald-200 opacity-80">${currentUser.isLocal ? 'Local Profile' : 'Cloud Sync'}</p>
              </div>
              <div class="auth-avatar" style="background: ${currentUser.avatarBg || 'rgba(255,255,255,0.2)'};">
                ${currentUser.photoURL ? `<img src="${currentUser.photoURL}" alt="User" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid ${currentUser.avatar || 'fa-user'}"></i>`}
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
          <p class="month-picker-title">${periodLabel.toUpperCase()}</p>
          <p class="month-picker-subtitle">Budget & Commitments</p>
        </div>

        <button id="btn-next-month" class="month-picker-btn" title="Next Month">
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>

      <!-- Hero Balance -->
      <div class="balance-hero">
        <p class="balance-label">Available Balance</p>
        <div class="balance-amount-row">
          <span class="balance-currency">RM</span>
          <span id="hero-balance-val" class="balance-value">0.00</span>
        </div>
        <div id="hero-formula-tag" class="balance-formula-tag">
          <i class="fa-solid fa-calculator text-xs"></i>
          <span id="hero-formula-text">SALARY - TOTAL</span>
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

    document.getElementById('btn-open-account-header')?.addEventListener('click', () => {
      openAccountDrawer();
    });
  }

  // Subscribe to store updates
  store.subscribe(render);
  authService.onAuthStateChanged(() => render(store.state));
}
