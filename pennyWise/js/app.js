/**
 * PennyWise Pro - Application Entry Point
 * Orchestrates Login-First lifecycle, component mounting, and responsive event routing
 */

import { store } from './store.js';
import { storage } from './services/storage.js';
import { authService } from './services/auth.js';
import { renderLoginView } from './components/loginView.js';
import { initHeader } from './components/header.js';
import { initSummary } from './components/summary.js';
import { initBankList } from './components/bankList.js';
import { initNotepadModal, openNotepadModal } from './components/notepadModal.js';
import { initBottomNav } from './components/bottomNav.js';
import { initAccountDrawer } from './components/accountModal.js';
import { openItemModal } from './components/modals.js';

class App {
  constructor() {
    this.uiMounted = false;
  }

  start() {
    console.log('%c PennyWise Pro Initializing... ', 'background: #004B23; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

    const loginContainer = document.getElementById('login-view-container');
    const appWrapper = document.getElementById('app-wrapper');
    const bottomNav = document.getElementById('mobile-bottom-nav');
    const quickAddFab = document.getElementById('floating-quick-add');

    // 1. Auth Lifecycle (Login First)
    authService.onAuthStateChanged(user => {
      if (!user) {
        // Unauthenticated -> Show Login Screen
        if (appWrapper) appWrapper.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
        if (quickAddFab) quickAddFab.style.display = 'none';
        if (loginContainer) {
          loginContainer.style.display = 'flex';
          renderLoginView(loginContainer, (loggedInUser) => {
            // Handled reactively by onAuthStateChanged
          });
        }
      } else {
        // Authenticated -> Show Main Budget App
        if (loginContainer) loginContainer.style.display = 'none';
        if (appWrapper) appWrapper.style.display = 'block';
        if (bottomNav) bottomNav.style.display = 'block';
        if (quickAddFab) quickAddFab.style.display = 'inline-flex';

        // Load data strictly for this user
        store.setUser(user);

        // Mount UI components once
        if (!this.uiMounted) {
          this.uiMounted = true;
          this.mountUI();
        }

        // Setup real-time cloud sync for authenticated Google user
        storage.subscribeToCloudBudget(store.state.period, cloudData => {
          if (cloudData && cloudData.period === store.state.period) {
            store.replaceBudgetData(cloudData);
          }
        });

        console.log(`%c Signed in with Google: ${user.displayName} %c (${user.email || 'Google Account'})`, 'color: #10b981; font-weight: bold;', 'color: #64748b;');
      }
    });

    // 2. Global Keyboard Shortcuts
    this.bindKeyboardShortcuts();
  }

  mountUI() {
    initHeader();
    initSummary();
    initBankList();
    initNotepadModal();
    initBottomNav();
    initAccountDrawer();

    // Floating Action Button
    document.getElementById('floating-quick-add')?.addEventListener('click', () => {
      const firstBankId = store.state.banks[0]?.id;
      openItemModal(firstBankId);
    });
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore if inside an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      // Ignore shortcuts if not logged in
      if (!authService.isAuthenticated()) {
        return;
      }

      // 'N' or 'n' -> Open Notepad View
      if (e.key === 'n' || e.key === 'N') {
        openNotepadModal();
      }

      // '+' -> Add Commitment
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
