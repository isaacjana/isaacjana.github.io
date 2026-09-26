/**
 * PennyWise Pro - Modal Dialogs & Action Sheets
 * All in English, mobile-first bottom sheet ergonomics, custom confirmation dialogs
 */

import { store } from '../store.js';
import { evaluateFormula } from '../utils/math.js';
import { formatRM, getNextPeriod, formatPeriod } from '../utils/format.js';
import { BANK_PRESETS } from '../config.js';
import { storage } from '../services/storage.js';
import { showToast } from './toast.js';

let sharedModalEl = null;

function getSharedModal() {
  if (!sharedModalEl) {
    sharedModalEl = document.createElement('div');
    sharedModalEl.id = 'general-modal-overlay';
    sharedModalEl.className = 'modal-overlay';
    document.body.appendChild(sharedModalEl);

    sharedModalEl.addEventListener('click', (e) => {
      if (e.target === sharedModalEl) closeModal();
    });
  }
  return sharedModalEl;
}

export function closeModal() {
  if (sharedModalEl) {
    sharedModalEl.classList.remove('active');
  }
}

/**
 * Open Modal to Add or Edit a Budget Item
 */
export function openItemModal(bankId, itemId = null) {
  const modal = getSharedModal();
  const bank = store.state.banks.find(b => b.id === bankId) || store.state.banks[0];
  const item = itemId && bank ? bank.items.find(i => i.id === itemId) : null;
  const isEdit = !!item;

  if (store.state.banks.length === 0) {
    showToast('Please create a bank account first.', 'info');
    openBankModal();
    return;
  }

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid ${isEdit ? 'fa-pen-to-square text-sky' : 'fa-circle-plus text-primary'}"></i>
          <span>${isEdit ? 'Edit Commitment' : 'Add New Commitment'}</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Target Bank Selection -->
        <div class="form-group">
          <label class="form-label">Bank Account / Channel</label>
          <select id="modal-item-bank" class="form-input">
            ${store.state.banks.map(b => `
              <option value="${b.id}" ${b.id === bank?.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
          </select>
        </div>

        <!-- Item Name -->
        <div class="form-group">
          <label class="form-label">Commitment / Expense Name</label>
          <input 
            type="text" 
            id="modal-item-name" 
            class="form-input font-bold" 
            placeholder="e.g. CAR INSTALLMENT, ROADTAX + INSURANCE, FUEL"
            value="${item ? item.name : ''}"
            required
          />
        </div>

        <!-- Formula / Amount -->
        <div class="form-group">
          <div class="flex items-center justify-between mb-1">
            <label class="form-label" style="margin-bottom: 0;">Amount / Formula</label>
            <span class="text-xs text-muted">Supports math: 95 * 2, 100 * 2, 461</span>
          </div>
          <div class="relative">
            <input 
              type="text" 
              id="modal-item-formula" 
              class="form-input font-mono font-bold text-lg" 
              placeholder="e.g. 95 * 2 or 461"
              value="${item ? (item.formula || item.amount) : ''}"
              required
            />
          </div>
          <div id="modal-formula-preview" class="mt-2 text-xs font-mono p-2 bg-subtle rounded-md border border-subtle flex items-center justify-between">
            <span class="text-muted">Calculated Value:</span>
            <span id="modal-calculated-val" class="font-bold text-primary">RM 0.00</span>
          </div>
        </div>

        <!-- Note / Context -->
        <div class="form-group">
          <label class="form-label">Note / Sinking Fund (Optional)</label>
          <input 
            type="text" 
            id="modal-item-note" 
            class="form-input" 
            placeholder="e.g. 12 MTHS = 1104, 6 MTHS = 600, ASB"
            value="${item ? (item.note || '') : ''}"
          />
        </div>

        <!-- Paid Status -->
        <div class="flex items-center gap-2 pt-1">
          <input 
            type="checkbox" 
            id="modal-item-paid" 
            class="item-checkbox" 
            ${item && item.paid ? 'checked' : ''}
          />
          <label for="modal-item-paid" class="text-sm font-semibold cursor-pointer">
            Mark as paid / transferred
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-modal" class="btn btn-secondary text-xs">Cancel</button>
        <button id="btn-save-item" class="btn btn-primary text-xs">
          <i class="fa-solid fa-check"></i> ${isEdit ? 'Save Changes' : 'Add Commitment'}
        </button>
      </div>
    </div>
  `;

  // Bind live formula calculation
  const formulaInput = document.getElementById('modal-item-formula');
  const calcValEl = document.getElementById('modal-calculated-val');

  function updateCalcPreview() {
    const raw = formulaInput?.value || '';
    const res = evaluateFormula(raw);
    if (res.success) {
      calcValEl.textContent = formatRM(res.value);
      calcValEl.style.color = 'var(--color-primary-700)';
    } else {
      calcValEl.textContent = 'RM 0.00';
      calcValEl.style.color = 'var(--color-text-muted)';
    }
  }

  formulaInput?.addEventListener('input', updateCalcPreview);
  updateCalcPreview();

  // Close bindings
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

  // Save Item
  document.getElementById('btn-save-item')?.addEventListener('click', () => {
    const targetBankId = document.getElementById('modal-item-bank')?.value;
    const name = document.getElementById('modal-item-name')?.value.trim();
    const formula = formulaInput?.value.trim();
    const note = document.getElementById('modal-item-note')?.value.trim();
    const paid = document.getElementById('modal-item-paid')?.checked;

    if (!name) {
      showToast('Please enter a commitment name', 'error');
      return;
    }

    const evalRes = evaluateFormula(formula);
    if (!evalRes.success && isNaN(parseFloat(formula))) {
      showToast('Please enter a valid amount or formula', 'error');
      return;
    }

    const itemData = {
      name,
      formula,
      amount: evalRes.value,
      note,
      paid
    };

    if (isEdit) {
      if (targetBankId !== bank.id) {
        store.deleteItem(bank.id, item.id);
        store.addItem(targetBankId, itemData);
      } else {
        store.updateItem(bank.id, item.id, itemData);
      }
      showToast('Commitment updated', 'success');
    } else {
      store.addItem(targetBankId, itemData);
      showToast('Commitment added successfully', 'success');
    }

    closeModal();
  });

  requestAnimationFrame(() => modal.classList.add('active'));
}

/**
 * Open Modal to Add or Edit a Bank / Channel
 */
export function openBankModal(bankId = null) {
  const modal = getSharedModal();
  const bank = bankId ? store.state.banks.find(b => b.id === bankId) : null;
  const isEdit = !!bank;

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid fa-building-columns text-primary"></i>
          <span>${isEdit ? 'Edit Bank Account' : 'Add Bank Account / Channel'}</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Preset quick selection -->
        <div class="form-group">
          <label class="form-label">Quick Preset (Optional)</label>
          <div class="flex flex-wrap gap-1.5">
            ${BANK_PRESETS.map(p => `
              <button type="button" class="btn btn-subtle text-xs btn-preset-bank" 
                data-name="${p.name}" data-color="${p.color}" data-bg="${p.bg}" data-icon="${p.icon}">
                <span class="w-2.5 h-2.5 rounded-full mr-1" style="background: ${p.color};"></span>
                ${p.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Bank Name -->
        <div class="form-group">
          <label class="form-label">Bank / Channel Name</label>
          <input 
            type="text" 
            id="modal-bank-name" 
            class="form-input font-bold uppercase" 
            placeholder="e.g. AFFIN BANK, MAY BANK, SETEL, TNG"
            value="${bank ? bank.name : ''}"
            required
          />
        </div>

        <!-- Bank Subtotal Code (e.g. TOTAL A) -->
        <div class="form-group">
          <label class="form-label">Subtotal Label Code</label>
          <input 
            type="text" 
            id="modal-bank-code" 
            class="form-input font-mono font-bold" 
            placeholder="e.g. TOTAL A, TOTAL B"
            value="${bank ? (bank.code || '') : `TOTAL ${String.fromCharCode(65 + (store.state.banks.length % 26))}`}"
          />
        </div>

        <!-- Color & Icon -->
        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Brand Color</label>
            <input 
              type="color" 
              id="modal-bank-color" 
              class="form-input" 
              style="height: 44px; padding: 2px;"
              value="${bank ? bank.color : '#1b7a44'}"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Icon</label>
            <select id="modal-bank-icon" class="form-input">
              <option value="fa-building-columns">Bank (Building)</option>
              <option value="fa-vault">Vault / Savings</option>
              <option value="fa-gas-pump">Petrol / Fuel Station</option>
              <option value="fa-mobile-screen-button">E-Wallet (TNG/Boost)</option>
              <option value="fa-car">Vehicle / Transport</option>
              <option value="fa-piggy-bank">Savings / Piggy Bank</option>
              <option value="fa-shield-halved">Insurance / Protection</option>
              <option value="fa-wifi">Telecom / Internet</option>
              <option value="fa-hand-holding-heart">Family / Allowance</option>
              <option value="fa-receipt">Receipt / Expenses</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-modal" class="btn btn-secondary text-xs">Cancel</button>
        <button id="btn-save-bank" class="btn btn-primary text-xs">
          <i class="fa-solid fa-check"></i> ${isEdit ? 'Save Changes' : 'Add Bank'}
        </button>
      </div>
    </div>
  `;

  // Bind Preset Click
  modal.querySelectorAll('.btn-preset-bank').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-bank-name').value = btn.dataset.name;
      document.getElementById('modal-bank-color').value = btn.dataset.color;
      document.getElementById('modal-bank-icon').value = btn.dataset.icon;
    });
  });

  // Bind Close
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

  // Save Bank
  document.getElementById('btn-save-bank')?.addEventListener('click', () => {
    const name = document.getElementById('modal-bank-name')?.value.trim();
    const code = document.getElementById('modal-bank-code')?.value.trim();
    const color = document.getElementById('modal-bank-color')?.value;
    const icon = document.getElementById('modal-bank-icon')?.value;

    if (!name) {
      showToast('Please enter a bank name', 'error');
      return;
    }

    if (isEdit) {
      store.updateBank(bank.id, { name, code, color, icon });
      showToast('Bank account updated', 'success');
    } else {
      store.addBank({ name, code, color, icon });
      showToast('Bank account added', 'success');
    }

    closeModal();
  });

  requestAnimationFrame(() => modal.classList.add('active'));
}

/**
 * Mobile-friendly Bank Action Sheet
 */
export function openBankActionSheet(bankId) {
  const modal = getSharedModal();
  const bank = store.state.banks.find(b => b.id === bankId);
  if (!bank) return;

  const allPaid = (bank.items || []).every(i => i.paid);

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid ${bank.icon || 'fa-building-columns'}" style="color: ${bank.color};"></i>
          <span>${bank.name}</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body flex flex-col gap-2">
        <button id="btn-sheet-add-item" class="btn btn-secondary text-sm justify-start py-3">
          <i class="fa-solid fa-plus text-primary"></i>
          <span>Add Commitment to this Bank</span>
        </button>

        <button id="btn-sheet-toggle-paid" class="btn btn-secondary text-sm justify-start py-3">
          <i class="fa-solid ${allPaid ? 'fa-rotate-left text-gold' : 'fa-check-double text-emerald'}"></i>
          <span>${allPaid ? 'Reset All Items to Unpaid' : 'Mark All Items as Paid'}</span>
        </button>

        <button id="btn-sheet-edit-bank" class="btn btn-secondary text-sm justify-start py-3">
          <i class="fa-solid fa-pen text-sky"></i>
          <span>Edit Bank Name & Appearance</span>
        </button>

        <button id="btn-sheet-delete-bank" class="btn btn-secondary text-sm text-coral font-bold justify-start py-3">
          <i class="fa-solid fa-trash-can"></i>
          <span>Delete Bank & All Its Items</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);

  document.getElementById('btn-sheet-add-item')?.addEventListener('click', () => {
    closeModal();
    openItemModal(bank.id);
  });

  document.getElementById('btn-sheet-toggle-paid')?.addEventListener('click', () => {
    store.toggleAllBankPaid(bank.id);
    closeModal();
    showToast(allPaid ? 'Reset all items' : 'All items marked paid', 'info');
  });

  document.getElementById('btn-sheet-edit-bank')?.addEventListener('click', () => {
    closeModal();
    openBankModal(bank.id);
  });

  document.getElementById('btn-sheet-delete-bank')?.addEventListener('click', () => {
    closeModal();
    openConfirmModal({
      title: 'Delete Bank Account?',
      message: `Are you sure you want to delete "${bank.name}" along with all ${(bank.items || []).length} commitments inside it? This cannot be undone.`,
      confirmText: 'Delete Bank',
      isDanger: true,
      onConfirm: () => {
        store.deleteBank(bank.id);
        showToast(`Bank "${bank.name}" deleted`, 'info');
      }
    });
  });

  requestAnimationFrame(() => modal.classList.add('active'));
}

/**
 * Mobile-friendly Confirmation Modal
 */
export function openConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) {
  const modal = getSharedModal();

  modal.innerHTML = `
    <div class="modal-container" style="max-width: 440px;">
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid ${isDanger ? 'fa-triangle-exclamation text-coral' : 'fa-circle-question text-primary'}"></i>
          <span>${title}</span>
        </h2>
        <button id="btn-close-confirm" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="text-sm text-muted">${message}</p>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-confirm" class="btn btn-secondary text-xs">${cancelText}</button>
        <button id="btn-ok-confirm" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'} text-xs">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-confirm')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-confirm')?.addEventListener('click', closeModal);
  document.getElementById('btn-ok-confirm')?.addEventListener('click', () => {
    closeModal();
    onConfirm?.();
  });

  requestAnimationFrame(() => modal.classList.add('active'));
}

/**
 * Open Modal to Clone Budget to Next Month
 */
export function openCloneModal() {
  const modal = getSharedModal();
  const currentPeriod = store.state.period;
  const targetPeriod = getNextPeriod(currentPeriod);

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-regular fa-copy text-gold"></i>
          <span>Clone Budget to New Month</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="text-sm text-muted mb-4">
          Easily copy all your bank envelopes, commitments, formulas, and notes from this month into a new month without retyping!
        </p>

        <div class="form-group">
          <label class="form-label">Source Month</label>
          <input type="text" class="form-input font-bold" value="${formatPeriod(currentPeriod)}" disabled />
        </div>

        <div class="form-group">
          <label class="form-label">Target Month</label>
          <input type="month" id="modal-target-period" class="form-input font-bold" value="${targetPeriod}" required />
        </div>

        <div class="p-3 bg-subtle rounded-md border border-subtle text-xs text-muted flex items-start gap-2">
          <i class="fa-solid fa-circle-info text-sky mt-0.5"></i>
          <span>All payment statuses will be reset to unpaid for the new month so you can track fresh transfers.</span>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-modal" class="btn btn-secondary text-xs">Cancel</button>
        <button id="btn-confirm-clone" class="btn btn-gold text-xs">
          <i class="fa-regular fa-copy"></i> Clone Budget Now
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

  document.getElementById('btn-confirm-clone')?.addEventListener('click', () => {
    const dest = document.getElementById('modal-target-period')?.value;
    if (!dest) {
      showToast('Please select a target month', 'error');
      return;
    }

    storage.cloneBudget(currentPeriod, dest);
    store.setPeriod(dest);
    showToast(`Budget cloned to ${formatPeriod(dest)}!`, 'success');
    closeModal();
  });

  requestAnimationFrame(() => modal.classList.add('active'));
}
