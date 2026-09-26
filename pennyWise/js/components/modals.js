/**
 * PennyWise Pro - Item, Bank & Month Clone Modals
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

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid ${isEdit ? 'fa-pen-to-square text-sky' : 'fa-circle-plus text-primary'}"></i>
          <span>${isEdit ? 'Kemaskini Komitmen' : 'Tambah Komitmen Baru'}</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Target Bank Selection -->
        <div class="form-group">
          <label class="form-label">Akaun Bank / Saluran</label>
          <select id="modal-item-bank" class="form-input">
            ${store.state.banks.map(b => `
              <option value="${b.id}" ${b.id === bank?.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
          </select>
        </div>

        <!-- Item Name -->
        <div class="form-group">
          <label class="form-label">Nama Komitmen / Perbelanjaan</label>
          <input 
            type="text" 
            id="modal-item-name" 
            class="form-input font-bold" 
            placeholder="cth. CAR INSTALLMENT, ROADTAX + INSURANCE, FUEL"
            value="${item ? item.name : ''}"
            required
          />
        </div>

        <!-- Formula / Amount -->
        <div class="form-group">
          <div class="flex items-center justify-between mb-1">
            <label class="form-label" style="margin-bottom: 0;">Jumlah / Formula Kiraan</label>
            <span class="text-xs text-muted">Boleh taip: 95 * 2, 100 * 2, 461, dll.</span>
          </div>
          <div class="relative">
            <input 
              type="text" 
              id="modal-item-formula" 
              class="form-input font-mono font-bold text-lg" 
              placeholder="cth. 95 * 2 atau 461"
              value="${item ? (item.formula || item.amount) : ''}"
              required
            />
          </div>
          <div id="modal-formula-preview" class="mt-2 text-xs font-mono p-2 bg-subtle rounded-md border border-subtle flex items-center justify-between">
            <span class="text-muted">Hasil Kiraan:</span>
            <span id="modal-calculated-val" class="font-bold text-primary">RM 0.00</span>
          </div>
        </div>

        <!-- Note / Context -->
        <div class="form-group">
          <label class="form-label">Nota Tambahan / Sinking Fund (Pilihan)</label>
          <input 
            type="text" 
            id="modal-item-note" 
            class="form-input" 
            placeholder="cth. 12 MTHS = 1104, 6 MTHS = 600, ASB"
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
            Tandakan sebagai telah dibayar / dipindah (Paid)
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-modal" class="btn btn-secondary text-xs">Batal</button>
        <button id="btn-save-item" class="btn btn-primary text-xs">
          <i class="fa-solid fa-check"></i> ${isEdit ? 'Simpan Perubahan' : 'Tambah Komitmen'}
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
      showToast('Sila masukkan nama komitmen', 'error');
      return;
    }

    const evalRes = evaluateFormula(formula);
    if (!evalRes.success && isNaN(parseFloat(formula))) {
      showToast('Sila masukkan formula atau jumlah yang sah', 'error');
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
      // If bank changed, move item
      if (targetBankId !== bank.id) {
        store.deleteItem(bank.id, item.id);
        store.addItem(targetBankId, itemData);
      } else {
        store.updateItem(bank.id, item.id, itemData);
      }
      showToast('Komitmen dikemaskini', 'success');
    } else {
      store.addItem(targetBankId, itemData);
      showToast('Komitmen berjaya ditambah', 'success');
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
      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-solid fa-building-columns text-primary"></i>
          <span>${isEdit ? 'Kemaskini Akaun Bank' : 'Tambah Akaun Bank / Saluran'}</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Preset quick selection -->
        <div class="form-group">
          <label class="form-label">Pilih Templat Cepat (Pilihan)</label>
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
          <label class="form-label">Nama Bank / Saluran</label>
          <input 
            type="text" 
            id="modal-bank-name" 
            class="form-input font-bold uppercase" 
            placeholder="cth. AFFIN BANK, MAY BANK, SETEL, TNG"
            value="${bank ? bank.name : ''}"
            required
          />
        </div>

        <!-- Bank Subtotal Code (e.g. TOTAL A) -->
        <div class="form-group">
          <label class="form-label">Kod Jumlah (Subtotal Label)</label>
          <input 
            type="text" 
            id="modal-bank-code" 
            class="form-input font-mono font-bold" 
            placeholder="cth. TOTAL A, TOTAL B"
            value="${bank ? (bank.code || '') : `TOTAL ${String.fromCharCode(65 + (store.state.banks.length % 26))}`}"
          />
        </div>

        <!-- Color & Icon -->
        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Warna Jenama</label>
            <input 
              type="color" 
              id="modal-bank-color" 
              class="form-input" 
              style="height: 44px; padding: 2px;"
              value="${bank ? bank.color : '#1b7a44'}"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Ikon FontAwesome</label>
            <select id="modal-bank-icon" class="form-input">
              <option value="fa-building-columns">Bank (Bangunan)</option>
              <option value="fa-vault">Peti Besi (Vault)</option>
              <option value="fa-gas-pump">Stesen Minyak (Petrol)</option>
              <option value="fa-mobile-screen-button">E-Wallet (TNG/Boost)</option>
              <option value="fa-car">Kenderaan (Car)</option>
              <option value="fa-piggy-bank">Tabung (Savings)</option>
              <option value="fa-shield-halved">Insurans (Shield)</option>
              <option value="fa-wifi">Bil / Utiliti (Telco)</option>
              <option value="fa-hand-holding-heart">Keluarga (Family)</option>
              <option value="fa-receipt">Resit / Belanja</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-modal" class="btn btn-secondary text-xs">Batal</button>
        <button id="btn-save-bank" class="btn btn-primary text-xs">
          <i class="fa-solid fa-check"></i> ${isEdit ? 'Simpan' : 'Tambah Bank'}
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
      showToast('Sila masukkan nama bank', 'error');
      return;
    }

    if (isEdit) {
      store.updateBank(bank.id, { name, code, color, icon });
      showToast('Akaun bank dikemaskini', 'success');
    } else {
      store.addBank({ name, code, color, icon });
      showToast('Akaun bank ditambah', 'success');
    }

    closeModal();
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
      <div class="modal-header">
        <h2 class="modal-title flex items-center gap-2">
          <i class="fa-regular fa-copy text-gold"></i>
          <span>Salin Bajet ke Bulan Baru</span>
        </h2>
        <button id="btn-close-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="text-sm text-muted mb-4">
          Ciri ini memudahkan anda menyalin semua akaun bank, komitmen, formula, dan catatan dari bulan semasa ke bulan baharu tanpa perlu menaip semula!
        </p>

        <div class="form-group">
          <label class="form-label">Bulan Asal (Sumber)</label>
          <input type="text" class="form-input font-bold" value="${formatPeriod(currentPeriod)}" disabled />
        </div>

        <div class="form-group">
          <label class="form-label">Salin ke Bulan Sasaran</label>
          <input type="month" id="modal-target-period" class="form-input font-bold" value="${targetPeriod}" required />
        </div>

        <div class="p-3 bg-subtle rounded-md border border-subtle text-xs text-muted flex items-start gap-2">
          <i class="fa-solid fa-circle-info text-sky mt-0.5"></i>
          <span>Status bayaran (Paid) akan di-reset semula ke "Belum Bayar" untuk bulan baharu tersebut.</span>
        </div>
      </div>

      <div class="modal-footer">
        <button id="btn-cancel-modal" class="btn btn-secondary text-xs">Batal</button>
        <button id="btn-confirm-clone" class="btn btn-gold text-xs">
          <i class="fa-regular fa-copy"></i> Gandakan Bajet Sekarang
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

  document.getElementById('btn-confirm-clone')?.addEventListener('click', () => {
    const dest = document.getElementById('modal-target-period')?.value;
    if (!dest) {
      showToast('Sila pilih bulan sasaran', 'error');
      return;
    }

    storage.cloneBudget(currentPeriod, dest);
    store.setPeriod(dest);
    showToast(`Berjaya menyalin bajet ke ${formatPeriod(dest)}!`, 'success');
    closeModal();
  });

  requestAnimationFrame(() => modal.classList.add('active'));
}
