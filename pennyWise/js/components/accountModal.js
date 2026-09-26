/**
 * PennyWise Pro - Google Account Drawer & Manager Modal
 * Displays current Google user information, storage stats, backup export, and sign-out.
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

  const storedPeriods = storage.getStoredPeriods();

  drawerEl.innerHTML = `
    <div class="modal-container account-drawer-container">
      <!-- Modal Drag Handle for Mobile -->
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-brands fa-google text-primary"></i>
          <span>Google Account</span>
        </h2>
        <button id="btn-close-drawer" class="btn btn-subtle btn-icon-sm" title="Close Drawer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Google User Card -->
        <div class="active-user-card">
          <div class="active-user-avatar" style="background: #004b23;">
            ${currentUser.photoURL ? `<img src="${currentUser.photoURL}" alt="${currentUser.displayName}" referrerpolicy="no-referrer">` : `<i class="fa-solid fa-user"></i>`}
          </div>
          <div class="active-user-info">
            <h3 class="active-user-name">${currentUser.displayName}</h3>
            <p class="active-user-email">${currentUser.email || 'Google User'}</p>
            <span class="active-user-badge">
              <i class="fa-solid fa-cloud-check text-[10px] mr-1"></i>
              Google Cloud Synced
            </span>
          </div>
        </div>

        <!-- Account Storage Diagnostics -->
        <div class="storage-info-box">
          <div class="storage-stat">
            <span class="storage-stat-label">Stored Months</span>
            <span class="storage-stat-val font-mono font-bold">${storedPeriods.length}</span>
          </div>
          <div class="storage-stat">
            <span class="storage-stat-label">Active Period</span>
            <span class="storage-stat-val font-mono text-primary font-bold">${store.state.period}</span>
          </div>
          <div class="storage-stat">
            <span class="storage-stat-label">Bank Envelopes</span>
            <span class="storage-stat-val font-mono font-bold">${store.state.banks.length}</span>
          </div>
        </div>

        <!-- Account Cloud Sync Details -->
        <div class="sync-info-card mt-3">
          <div class="flex items-center gap-2 mb-1">
            <i class="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
            <span class="text-xs font-bold text-slate-700">Account Synchronization Active</span>
          </div>
          <p class="text-[11px] text-muted leading-tight">
            Your budget allocations and commitments are automatically backed up to Google Cloud Firestore and cached locally for offline responsiveness.
          </p>
        </div>

        <!-- Backup & Actions -->
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
          <span>Sign Out of Google Account</span>
        </button>
      </div>
    </div>
  `;

  // Bind Events
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeAccountDrawer);

  // Backup Data Button
  document.getElementById('btn-backup-budget')?.addEventListener('click', () => {
    const backupData = {
      user: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        provider: currentUser.provider
      },
      period: store.state.period,
      salary: store.state.salary,
      banks: store.state.banks,
      exportedAt: new Date().toISOString()
    };
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PennyWise_Backup_${(currentUser.displayName || 'GoogleUser').replace(/\s+/g, '_')}_${store.state.period}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Account data exported successfully!', 'success');
  });

  // Sign Out Button
  document.getElementById('btn-signout-drawer')?.addEventListener('click', async () => {
    await authService.signOut();
    store.setUser(null);
    closeAccountDrawer();
    showToast('Signed out of Google account.', 'info');
  });

  requestAnimationFrame(() => drawerEl.classList.add('active'));
}

export function closeAccountDrawer() {
  if (drawerEl) {
    drawerEl.classList.remove('active');
  }
}
