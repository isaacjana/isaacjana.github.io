/**
 * PennyWise Pro - Account Drawer & Profile Manager Modal
 * Handles switching accounts, viewing storage diagnostics, and signing out.
 */

import { authService } from '../services/auth.js';
import { storage } from '../services/storage.js';
import { store } from '../store.js';
import { showToast } from './toast.js';

let drawerEl = null;

export function initAccountDrawer() {
  if (!drawerEl) {
    drawerEl = document.getElementById('account-drawer-overlay');
    if (!drawerEl) {
      drawerEl = document.createElement('div');
      drawerEl.id = 'account-drawer-overlay';
      drawerEl.className = 'modal-overlay';
      document.body.appendChild(drawerEl);
    }

    drawerEl.addEventListener('click', (e) => {
      if (e.target === drawerEl) closeAccountDrawer();
    });
  }
}

export function openAccountDrawer() {
  initAccountDrawer();
  const currentUser = authService.getUser();
  if (!currentUser) return;

  const localAccounts = authService.getLocalAccounts();
  const storedPeriods = storage.getStoredPeriods();

  drawerEl.innerHTML = `
    <div class="modal-container account-drawer-container">
      <!-- Modal Drag Handle for Mobile -->
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid fa-circle-user text-primary"></i>
          <span>Account & Profile</span>
        </h2>
        <button id="btn-close-drawer" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Current Active Profile Card -->
        <div class="active-user-card">
          <div class="active-user-avatar" style="background: ${currentUser.avatarBg || '#004b23'};">
            ${currentUser.photoURL ? `<img src="${currentUser.photoURL}" alt="${currentUser.displayName}">` : `<i class="fa-solid ${currentUser.avatar || 'fa-user'}"></i>`}
          </div>
          <div class="active-user-info">
            <h3 class="active-user-name">${currentUser.displayName}</h3>
            <p class="active-user-email">${currentUser.email || 'No email registered'}</p>
            <span class="active-user-badge">
              <i class="fa-solid ${currentUser.isLocal ? 'fa-hard-drive' : 'fa-cloud'} text-[10px] mr-1"></i>
              ${currentUser.isLocal ? 'Local Vault (Private)' : 'Cloud Synchronized'}
            </span>
          </div>
        </div>

        <!-- Account Storage Diagnostics -->
        <div class="storage-info-box">
          <div class="storage-stat">
            <span class="storage-stat-label">Stored Budget Periods</span>
            <span class="storage-stat-val font-mono font-bold">${storedPeriods.length}</span>
          </div>
          <div class="storage-stat">
            <span class="storage-stat-label">Active Period</span>
            <span class="storage-stat-val font-mono text-primary font-bold">${store.state.period}</span>
          </div>
          <div class="storage-stat">
            <span class="storage-stat-label">Total Bank Channels</span>
            <span class="storage-stat-val font-mono font-bold">${store.state.banks.length}</span>
          </div>
        </div>

        <!-- Switch Accounts Section -->
        <div class="mt-4">
          <label class="form-label">Switch Account</label>
          <div class="switch-accounts-list">
            ${localAccounts.map(acc => {
              const isActive = acc.uid === currentUser.uid;
              return `
                <div class="switch-account-item ${isActive ? 'is-active-acc' : ''}" data-uid="${acc.uid}">
                  <div class="switch-acc-avatar" style="background: ${acc.avatarBg || '#004b23'};">
                    <i class="fa-solid ${acc.avatar || 'fa-user'} text-xs"></i>
                  </div>
                  <div class="switch-acc-info">
                    <p class="switch-acc-name">${acc.displayName}</p>
                    <p class="switch-acc-role">${acc.role || acc.email}</p>
                  </div>
                  ${isActive ? `
                    <span class="badge badge-primary text-[10px]">ACTIVE</span>
                  ` : `
                    <button class="btn btn-subtle btn-icon-sm btn-select-switch" title="Switch to this account">
                      <i class="fa-solid fa-arrow-right-arrow-left text-[11px]"></i>
                    </button>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Backup & Clear Actions -->
        <div class="mt-4 pt-3 border-t border-subtle flex flex-col gap-2">
          <button id="btn-backup-budget" class="btn btn-secondary text-xs w-full justify-start">
            <i class="fa-solid fa-file-arrow-down text-sky"></i>
            <span>Export & Backup Account Data (JSON)</span>
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-signout-drawer" class="btn btn-secondary text-xs text-coral font-bold w-full justify-center">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Sign Out from ${currentUser.displayName}</span>
        </button>
      </div>
    </div>
  `;

  // Bind Events
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeAccountDrawer);

  // Switch Account Clicks
  drawerEl.querySelectorAll('.switch-account-item').forEach(item => {
    item.addEventListener('click', () => {
      const uid = item.dataset.uid;
      if (uid === currentUser.uid) return;
      try {
        const switched = authService.signInWithLocalAccount(uid);
        store.setUser(switched);
        showToast(`Switched account to ${switched.displayName}`, 'success');
        closeAccountDrawer();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Backup Data Button
  document.getElementById('btn-backup-budget')?.addEventListener('click', () => {
    const backupData = {
      user: currentUser,
      period: store.state.period,
      salary: store.state.salary,
      banks: store.state.banks,
      exportedAt: new Date().toISOString()
    };
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PennyWise_Backup_${currentUser.displayName}_${store.state.period}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Account data exported successfully!', 'success');
  });

  // Sign Out Button
  document.getElementById('btn-signout-drawer')?.addEventListener('click', async () => {
    await authService.signOut();
    store.setUser(null);
    closeAccountDrawer();
    showToast('Signed out successfully.', 'info');
  });

  requestAnimationFrame(() => drawerEl.classList.add('active'));
}

export function closeAccountDrawer() {
  if (drawerEl) {
    drawerEl.classList.remove('active');
  }
}
