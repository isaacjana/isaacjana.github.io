/**
 * PennyWise Pro - Header Component
 */

import { store } from '../store.js';
import { formatPeriod, getNextPeriod, getPrevPeriod } from '../utils/format.js';
import { authService } from '../services/auth.js';
import { showToast } from './toast.js';

export function initHeader() {
  const container = document.getElementById('header-section');
  if (!container) return;

  function render(state) {
    const periodLabel = formatPeriod(state.period);
    const currentUser = authService.getUser();

    container.innerHTML = `
      <div class="header-top">
        <div class="brand-badge">
          <div class="brand-dot"></div>
          <div>
            <h1 class="text-xl font-black tracking-tight" style="color: #ffffff;">PennyWise</h1>
            <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--color-primary-200); opacity: 0.85;">
              Sarawak Pro 2026
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Auth Badge -->
          <div id="auth-status-btn" class="auth-badge cursor-pointer" title="${currentUser ? 'Logged in as ' + currentUser.displayName : 'Sign in to sync with Cloud'}">
            ${currentUser ? `
              <div class="text-right">
                <p class="text-xs font-bold leading-tight" style="color: #ffffff;">${currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'User'}</p>
                <button id="btn-sign-out" class="text-xs text-coral font-bold hover:underline" style="font-size: 0.65rem;">Keluar</button>
              </div>
              <div class="auth-avatar">
                ${currentUser.photoURL ? `<img src="${currentUser.photoURL}" alt="User" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fa-solid fa-user"></i>'}
              </div>
            ` : `
              <button id="btn-sign-in" class="flex items-center gap-1.5 text-xs font-bold text-white hover:text-emerald-300">
                <i class="fa-brands fa-google text-xs"></i>
                <span>Sign In</span>
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Month Navigation Pill -->
      <div class="month-picker-container">
        <button id="btn-prev-month" class="month-picker-btn" title="Previous Month">
          <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>

        <div class="month-picker-label">
          <p class="month-picker-title">${periodLabel.toUpperCase()}</p>
          <p class="month-picker-subtitle">Personal Budget Planner</p>
        </div>

        <button id="btn-next-month" class="month-picker-btn" title="Next Month">
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>

      <!-- Hero Balance -->
      <div class="balance-hero">
        <p class="balance-label">Baki Tersedia (Balance)</p>
        <div class="balance-amount-row">
          <span class="balance-currency">RM</span>
          <span id="hero-balance-val" class="balance-value">0.00</span>
        </div>
        <div id="hero-formula-tag" class="balance-formula-tag">
          <i class="fa-solid fa-calculator text-xs"></i>
          <span id="hero-formula-text">SALARY - G.TOTAL</span>
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

    document.getElementById('btn-sign-in')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await authService.signInWithGoogle();
        showToast('Successfully signed in with Google!', 'success');
      } catch (err) {
        showToast(err.message || 'Sign in failed', 'error');
      }
    });

    document.getElementById('btn-sign-out')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await authService.signOut();
      showToast('Signed out', 'info');
    });
  }

  // Subscribe to store updates
  store.subscribe(render);
  authService.onAuthStateChanged(() => render(store.state));
}
