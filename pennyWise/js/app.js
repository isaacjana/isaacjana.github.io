/**
 * PennyWise Pro - Application Entry Point
 * Orchestrates components, state lifecycle, and global event listeners
 */

import { store } from './store.js';
import { storage } from './services/storage.js';
import { authService } from './services/auth.js';
import { initHeader } from './components/header.js';
import { initSummary } from './components/summary.js';
import { initBankList } from './components/bankList.js';
import { initNotepadModal, openNotepadModal } from './components/notepadModal.js';
import { openItemModal } from './components/modals.js';
import { showToast } from './components/toast.js';

class App {
  constructor() {
    this.initialized = false;
  }

  async start() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('%c PennyWise Pro Sarawak 2026 Initializing... ', 'background: #004B23; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

    // 1. Setup Auth listener
    authService.onAuthStateChanged(user => {
      storage.setUser(user);
      if (user) {
        // Sync current period with cloud
        storage.subscribeToCloudBudget(store.state.period, cloudData => {
          if (cloudData && cloudData.period === store.state.period) {
            store.replaceBudgetData(cloudData);
          }
        });
      }
    });

    // 2. Initialize UI Components
    initHeader();
    initSummary();
    initBankList();
    initNotepadModal();

    // 3. Initialize Store with April 2026 (or stored period)
    const initialPeriod = '2026-04';
    store.init(initialPeriod);

    // 4. Global Keyboard Shortcuts
    this.bindKeyboardShortcuts();

    // 5. Floating Action Button Bindings
    document.getElementById('floating-quick-add')?.addEventListener('click', () => {
      const firstBankId = store.state.banks[0]?.id;
      openItemModal(firstBankId);
    });

    console.log('%c PennyWise Pro Ready! %c Budget loaded for ' + store.state.period, 'color: #10b981; font-weight: bold;', 'color: #64748b;');
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore if inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      // 'N' or 'n' -> Open Notepad View
      if (e.key === 'n' || e.key === 'N') {
        openNotepadModal();
      }

      // '+' -> Add Item
      if (e.key === '+') {
        const firstBankId = store.state.banks[0]?.id;
        openItemModal(firstBankId);
      }
    });
  }
}

// Start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start();
});
