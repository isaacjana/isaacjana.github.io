/**
 * PennyWise Pro - Mobile Bottom Navigation Component
 * Ergonomic one-thumb bottom bar designed for mobile phones & tablets
 */

import { openItemModal } from './modals.js';
import { openNotepadModal } from './notepadModal.js';
import { openAccountDrawer } from './accountModal.js';
import { store } from '../store.js';

export function initBottomNav() {
  const container = document.getElementById('mobile-bottom-nav');
  if (!container) return;

  container.innerHTML = `
    <div class="bottom-nav-inner">
      <button id="nav-btn-dashboard" class="bottom-nav-item active" title="Financial Dashboard">
        <i class="fa-solid fa-chart-pie"></i>
        <span>Overview</span>
      </button>

      <button id="nav-btn-banks" class="bottom-nav-item" title="Bank Envelopes">
        <i class="fa-solid fa-building-columns"></i>
        <span>Banks</span>
      </button>

      <!-- Center Action Button -->
      <button id="nav-btn-quick-add" class="bottom-nav-fab" title="Add New Commitment">
        <div class="bottom-nav-fab-circle">
          <i class="fa-solid fa-plus"></i>
        </div>
      </button>

      <button id="nav-btn-notepad" class="bottom-nav-item" title="Notepad View">
        <i class="fa-solid fa-file-lines"></i>
        <span>Notepad</span>
      </button>

      <button id="nav-btn-account" class="bottom-nav-item" title="User Account">
        <i class="fa-solid fa-circle-user"></i>
        <span id="nav-account-label">Account</span>
      </button>
    </div>
  `;

  // Bind Events
  const btnDashboard = document.getElementById('nav-btn-dashboard');
  const btnBanks = document.getElementById('nav-btn-banks');
  const btnQuickAdd = document.getElementById('nav-btn-quick-add');
  const btnNotepad = document.getElementById('nav-btn-notepad');
  const btnAccount = document.getElementById('nav-btn-account');

  function setActiveNav(btn) {
    container.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  btnDashboard?.addEventListener('click', () => {
    setActiveNav(btnDashboard);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btnBanks?.addEventListener('click', () => {
    setActiveNav(btnBanks);
    const banksEl = document.getElementById('banks-section');
    if (banksEl) {
      banksEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  btnQuickAdd?.addEventListener('click', () => {
    const firstBankId = store.state.banks[0]?.id;
    openItemModal(firstBankId);
  });

  btnNotepad?.addEventListener('click', () => {
    setActiveNav(btnNotepad);
    openNotepadModal();
  });

  btnAccount?.addEventListener('click', () => {
    setActiveNav(btnAccount);
    openAccountDrawer();
  });
}
