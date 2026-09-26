/**
 * PennyWise Pro - Bank Accounts & Items Component
 * Touch-optimized bank envelope cards and commitment rows in English
 */

import { store } from '../store.js';
import { formatRM } from '../utils/format.js';
import { openItemModal, openBankModal, openCloneModal, openBankActionSheet, openConfirmModal } from './modals.js';
import { openNotepadModal } from './notepadModal.js';
import { showToast } from './toast.js';

export function initBankList() {
  const container = document.getElementById('banks-section');
  if (!container) return;

  function render(state) {
    const banks = state.banks || [];
    const query = state.searchQuery || '';

    // Filter banks & items if search active
    const filteredBanks = banks.map(bank => {
      const matchBank = bank.name.toLowerCase().includes(query);
      const filteredItems = (bank.items || []).filter(item => {
        return matchBank || item.name.toLowerCase().includes(query) || (item.note && item.note.toLowerCase().includes(query));
      });
      return { ...bank, items: filteredItems, visible: matchBank || filteredItems.length > 0 };
    }).filter(b => b.visible);

    container.innerHTML = `
      <!-- Action Toolbar -->
      <div class="toolbar-row">
        <div class="toolbar-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            id="search-budget-input" 
            placeholder="Search commitments or banks..." 
            value="${query}"
          />
        </div>

        <div class="toolbar-actions">
          <button id="btn-open-notepad" class="btn btn-secondary text-xs" title="View Notepad ASCII format">
            <i class="fa-solid fa-file-lines text-sky"></i>
            <span>Notepad</span>
          </button>

          <button id="btn-clone-month" class="btn btn-secondary text-xs" title="Clone budget to another month">
            <i class="fa-regular fa-copy text-gold"></i>
            <span>Clone Month</span>
          </button>

          <button id="btn-add-bank-top" class="btn btn-primary text-xs">
            <i class="fa-solid fa-plus"></i>
            <span>Add Bank</span>
          </button>
        </div>
      </div>

      <!-- Bank Envelope Cards -->
      <div class="bank-cards-list">
        ${filteredBanks.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
            <h3 class="text-base font-bold mb-1">No Commitments Found</h3>
            <p class="text-xs text-muted mb-4">No bank accounts or expenses recorded for this month.</p>
            <button id="btn-empty-add-bank" class="btn btn-primary text-xs">
              <i class="fa-solid fa-plus"></i> Add First Bank Account
            </button>
          </div>
        ` : filteredBanks.map((bank, bankIdx) => {
          const bankTotal = (bank.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
          const paidCount = (bank.items || []).filter(i => i.paid).length;
          const totalItems = (bank.items || []).length;
          const isAllPaid = totalItems > 0 && paidCount === totalItems;
          const totalCode = bank.code || `TOTAL ${String.fromCharCode(65 + (bankIdx % 26))}`;

          return `
            <div class="card bank-card" style="--bank-color: ${bank.color || '#1b7a44'}; --bank-bg: ${bank.bg || '#f0fdf5'};">
              <!-- Bank Card Header -->
              <div class="bank-card-header">
                <div class="bank-identity">
                  <div class="bank-icon-badge">
                    <i class="fa-solid ${bank.icon || 'fa-building-columns'}"></i>
                  </div>
                  <div>
                    <h3 class="bank-name">${bank.name}</h3>
                    <p class="bank-meta">${paidCount}/${totalItems} paid • ${totalCode}</p>
                  </div>
                </div>

                <div class="bank-header-right">
                  <div class="bank-subtotal-badge">
                    <p class="bank-subtotal-label">${totalCode}</p>
                    <p class="bank-subtotal-amount">${formatRM(bankTotal)}</p>
                  </div>

                  <button class="btn btn-subtle btn-icon btn-bank-menu" data-bank-id="${bank.id}" title="Bank Options">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
              </div>

              <!-- Item List -->
              <div class="bank-items">
                ${(bank.items || []).length === 0 ? `
                  <p class="text-xs text-muted text-center py-2 italic">No commitments recorded. Tap Add Commitment below.</p>
                ` : (bank.items || []).map(item => {
                  const hasFormula = item.formula && /[\+\-\*\/]/.test(item.formula);
                  return `
                    <div class="item-row ${item.paid ? 'is-paid' : ''}" data-bank-id="${bank.id}" data-item-id="${item.id}">
                      <div class="item-left">
                        <label class="item-checkbox-container" title="Mark as paid/transferred">
                          <input 
                            type="checkbox" 
                            class="item-checkbox" 
                            ${item.paid ? 'checked' : ''} 
                          />
                        </label>
                        <div class="item-info">
                          <span class="item-name">${item.name}</span>
                          <div class="item-meta-chips">
                            ${hasFormula ? `
                              <span class="formula-chip" title="Calculation formula">
                                <i class="fa-solid fa-equals text-[10px] mr-1"></i>${item.formula}
                              </span>
                            ` : ''}
                            ${item.note ? `
                              <span class="note-chip" title="Note / Sinking fund">
                                <i class="fa-solid fa-circle-info text-[9px] mr-1"></i>${item.note}
                              </span>
                            ` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="item-right">
                        <span class="item-amount">${formatRM(item.amount)}</span>
                        <div class="item-actions">
                          <button class="btn btn-subtle btn-icon-sm btn-edit-item" title="Edit Commitment">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                          </button>
                          <button class="btn btn-danger-ghost btn-icon-sm btn-delete-item" title="Delete Commitment">
                            <i class="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Bank Footer Actions -->
              <div class="bank-card-footer">
                <button class="btn btn-subtle text-xs btn-add-item" data-bank-id="${bank.id}">
                  <i class="fa-solid fa-plus text-xs"></i>
                  <span>Add Commitment</span>
                </button>

                <div class="flex items-center gap-2">
                  <button class="btn btn-subtle text-xs btn-toggle-all-paid" data-bank-id="${bank.id}" title="Toggle all paid/unpaid">
                    <i class="fa-solid ${isAllPaid ? 'fa-rotate-left' : 'fa-check-double'} text-xs"></i>
                    <span>${isAllPaid ? 'Reset All' : 'Mark All Paid'}</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Add Bank Bottom Floating Button / Action -->
      <div class="text-center mt-6">
        <button id="btn-add-bank-bottom" class="btn btn-secondary text-sm">
          <i class="fa-solid fa-plus-circle text-primary"></i>
          <span>Add New Bank Account / Channel</span>
        </button>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Search Input
    const searchInput = document.getElementById('search-budget-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        store.setSearchQuery(e.target.value);
      });
    }

    // Top buttons
    document.getElementById('btn-open-notepad')?.addEventListener('click', () => {
      openNotepadModal();
    });

    document.getElementById('btn-clone-month')?.addEventListener('click', () => {
      openCloneModal();
    });

    document.getElementById('btn-add-bank-top')?.addEventListener('click', () => {
      openBankModal();
    });

    document.getElementById('btn-add-bank-bottom')?.addEventListener('click', () => {
      openBankModal();
    });

    document.getElementById('btn-empty-add-bank')?.addEventListener('click', () => {
      openBankModal();
    });

    // Item Checkbox Toggle
    container.querySelectorAll('.item-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const row = e.target.closest('.item-row');
        const bankId = row.dataset.bankId;
        const itemId = row.dataset.itemId;
        store.toggleItemPaid(bankId, itemId);
      });
    });

    // Add Item Button
    container.querySelectorAll('.btn-add-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const bankId = btn.dataset.bankId;
        openItemModal(bankId);
      });
    });

    // Edit Item Button
    container.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = btn.closest('.item-row');
        const bankId = row.dataset.bankId;
        const itemId = row.dataset.itemId;
        openItemModal(bankId, itemId);
      });
    });

    // Tap Item Row to Edit (Mobile ergonomics)
    container.querySelectorAll('.item-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // If clicked on checkbox or action buttons, don't trigger row edit
        if (e.target.closest('.item-checkbox') || e.target.closest('.item-actions')) return;
        const bankId = row.dataset.bankId;
        const itemId = row.dataset.itemId;
        openItemModal(bankId, itemId);
      });
    });

    // Delete Item Button
    container.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = btn.closest('.item-row');
        const bankId = row.dataset.bankId;
        const itemId = row.dataset.itemId;
        const itemName = row.querySelector('.item-name')?.textContent || 'this item';

        openConfirmModal({
          title: 'Delete Commitment?',
          message: `Are you sure you want to remove "${itemName}"?`,
          confirmText: 'Delete',
          isDanger: true,
          onConfirm: () => {
            store.deleteItem(bankId, itemId);
            showToast('Commitment deleted', 'info');
          }
        });
      });
    });

    // Toggle All Paid for Bank
    container.querySelectorAll('.btn-toggle-all-paid').forEach(btn => {
      btn.addEventListener('click', () => {
        const bankId = btn.dataset.bankId;
        store.toggleAllBankPaid(bankId);
      });
    });

    // Bank Menu (Mobile Action Sheet)
    container.querySelectorAll('.btn-bank-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bankId = btn.dataset.bankId;
        openBankActionSheet(bankId);
      });
    });
  }

  store.subscribe(render);
}
