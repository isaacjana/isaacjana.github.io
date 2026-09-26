/**
 * PennyWise Pro - Bank Accounts & Items Component
 * Touch-optimized bank envelope cards with collapsible views, quick filters, and tactile controls
 */

import { store } from '../store.js';
import { formatRM } from '../utils/format.js';
import { openItemModal, openBankModal, openCloneModal, openBankActionSheet, openConfirmModal } from './modals.js';
import { openNotepadModal } from './notepadModal.js';
import { showToast } from './toast.js';

// Local UI state for bank list interactions
let currentFilter = 'all'; // 'all' | 'pending' | 'settled'
const collapsedBankIds = new Set();

export function initBankList() {
  const container = document.getElementById('banks-section');
  if (!container) return;

  function render(state) {
    const banks = state.banks || [];
    const query = (state.searchQuery || '').toLowerCase().trim();

    // Compute global counts for filter pills
    let totalAll = 0;
    let totalPaid = 0;
    let totalPending = 0;

    banks.forEach(b => {
      (b.items || []).forEach(item => {
        totalAll++;
        if (item.paid) totalPaid++;
        else totalPending++;
      });
    });

    // Filter banks & items based on query & selected filter pill
    const filteredBanks = banks.map(bank => {
      const matchBank = bank.name.toLowerCase().includes(query);
      const filteredItems = (bank.items || []).filter(item => {
        const matchesQuery = matchBank || 
          item.name.toLowerCase().includes(query) || 
          (item.note && item.note.toLowerCase().includes(query)) ||
          (item.formula && item.formula.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        if (currentFilter === 'pending') return !item.paid;
        if (currentFilter === 'settled') return item.paid;
        return true;
      });

      return {
        ...bank,
        items: filteredItems,
        visible: matchBank || filteredItems.length > 0
      };
    }).filter(b => b.visible);

    container.innerHTML = `
      <!-- Action Toolbar & Search -->
      <div class="toolbar-row">
        <div class="toolbar-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            id="search-budget-input" 
            placeholder="Search commitments, banks, formulas..." 
            value="${state.searchQuery || ''}"
          />
          ${state.searchQuery ? `
            <button id="btn-clear-search" class="search-clear-btn" title="Clear Search">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
        </div>

        <div class="toolbar-actions">
          <button id="btn-open-notepad" class="btn btn-secondary text-xs" title="View Notepad ASCII format">
            <i class="fa-solid fa-file-lines text-sky"></i>
            <span>Notepad</span>
          </button>

          <button id="btn-clone-month" class="btn btn-secondary text-xs" title="Clone budget to another month">
            <i class="fa-regular fa-copy text-gold"></i>
            <span>Clone</span>
          </button>

          <button id="btn-add-bank-top" class="btn btn-primary text-xs" title="Create a new bank envelope">
            <i class="fa-solid fa-plus"></i>
            <span>Add Bank</span>
          </button>
        </div>
      </div>

      <!-- Quick Filter Pills -->
      <div class="filter-pills-row">
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          <span>All Bills</span>
          <span class="filter-counter">${totalAll}</span>
        </button>

        <button class="filter-pill ${currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
          <span class="filter-indicator-amber"></span>
          <span>Pending Only</span>
          <span class="filter-counter">${totalPending}</span>
        </button>

        <button class="filter-pill ${currentFilter === 'settled' ? 'active' : ''}" data-filter="settled">
          <span class="filter-indicator-emerald"></span>
          <span>Settled</span>
          <span class="filter-counter">${totalPaid}</span>
        </button>
      </div>

      <!-- Bank Envelope Cards -->
      <div class="bank-cards-list">
        ${filteredBanks.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fa-solid ${query ? 'fa-magnifying-glass' : 'fa-vault'}"></i>
            </div>
            <h3 class="text-base font-bold mb-1">${query ? 'No Matching Commitments' : 'No Bank Envelopes Yet'}</h3>
            <p class="text-xs text-muted mb-4">
              ${query ? `No items found matching "${query}". Try resetting your filter.` : 'Add your first bank account to begin tracking your monthly expenses.'}
            </p>
            ${query ? `
              <button id="btn-reset-filters" class="btn btn-secondary text-xs">
                <i class="fa-solid fa-rotate-left"></i> Reset Filter & Search
              </button>
            ` : `
              <button id="btn-empty-add-bank" class="btn btn-primary text-xs">
                <i class="fa-solid fa-plus"></i> Add Bank Account
              </button>
            `}
          </div>
        ` : filteredBanks.map((bank, bankIdx) => {
          const bankTotal = (bank.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
          const paidCount = (bank.items || []).filter(i => i.paid).length;
          const totalItems = (bank.items || []).length;
          const isAllPaid = totalItems > 0 && paidCount === totalItems;
          const bankPercent = totalItems > 0 ? Math.round((paidCount / totalItems) * 100) : 0;
          const totalCode = bank.code || `TOTAL ${String.fromCharCode(65 + (bankIdx % 26))}`;
          const isCollapsed = collapsedBankIds.has(bank.id);

          return `
            <div class="card bank-card ${isCollapsed ? 'is-collapsed' : ''}" style="--bank-color: ${bank.color || '#1b7a44'}; --bank-bg: ${bank.bg || '#f0fdf5'};">
              <!-- Bank Card Header (Interactive Collapse Trigger) -->
              <div class="bank-card-header" data-bank-id="${bank.id}">
                <div class="bank-identity">
                  <button class="bank-collapse-arrow" title="${isCollapsed ? 'Expand bank' : 'Collapse bank'}">
                    <i class="fa-solid fa-chevron-down ${isCollapsed ? 'rotate-collapsed' : ''}"></i>
                  </button>

                  <div class="bank-icon-badge">
                    <i class="fa-solid ${bank.icon || 'fa-building-columns'}"></i>
                  </div>
                  <div>
                    <h3 class="bank-name">${bank.name}</h3>
                    <div class="flex items-center gap-2">
                      <p class="bank-meta">${paidCount}/${totalItems} paid • ${totalCode}</p>
                      ${isAllPaid ? '<span class="badge badge-primary text-[10px] py-0.5">SETTLED</span>' : ''}
                    </div>
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

              <!-- Mini Bank Progress Bar -->
              <div class="bank-progress-track">
                <div class="bank-progress-fill" style="width: ${bankPercent}%; background: ${bank.color || 'var(--color-primary-600)'};"></div>
              </div>

              <!-- Collapsible Content Area -->
              <div class="bank-collapsible-content" style="${isCollapsed ? 'display: none;' : ''}">
                <!-- Item List -->
                <div class="bank-items">
                  ${(bank.items || []).length === 0 ? `
                    <div class="bank-empty-item-notice">
                      <p class="text-xs text-muted italic">No commitments recorded in this view.</p>
                      <button class="btn btn-primary text-xs mt-2 btn-add-item" data-bank-id="${bank.id}">
                        <i class="fa-solid fa-plus"></i> Add Item
                      </button>
                    </div>
                  ` : (bank.items || []).map(item => {
                    const hasFormula = item.formula && /[\+\-\*\/]/.test(item.formula);
                    return `
                      <div class="item-row ${item.paid ? 'is-paid' : ''}" data-bank-id="${bank.id}" data-item-id="${item.id}">
                        <div class="item-left">
                          <!-- Custom Tactile Checkbox -->
                          <div class="custom-checkbox-wrapper ${item.paid ? 'is-checked' : ''}" title="${item.paid ? 'Mark as unpaid' : 'Mark as paid'}">
                            <div class="custom-checkbox">
                              ${item.paid ? '<i class="fa-solid fa-check"></i>' : ''}
                            </div>
                          </div>

                          <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <div class="item-meta-chips">
                              ${hasFormula ? `
                                <span class="formula-chip" title="Formula: ${item.formula}">
                                  <i class="fa-solid fa-calculator text-[9px] mr-1"></i>${item.formula}
                                </span>
                              ` : ''}
                              ${item.note ? `
                                <span class="note-chip" title="Note: ${item.note}">
                                  <i class="fa-solid fa-tag text-[9px] mr-1"></i>${item.note}
                                </span>
                              ` : ''}
                            </div>
                          </div>
                        </div>

                        <div class="item-right">
                          <span class="item-amount font-mono">${formatRM(item.amount)}</span>
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
                    <i class="fa-solid fa-plus text-xs text-primary"></i>
                    <span>Add Commitment</span>
                  </button>

                  <div class="flex items-center gap-2">
                    <button class="btn btn-subtle text-xs btn-toggle-all-paid" data-bank-id="${bank.id}" title="Toggle all paid/unpaid">
                      <i class="fa-solid ${isAllPaid ? 'fa-rotate-left text-muted' : 'fa-check-double text-emerald'} text-xs"></i>
                      <span>${isAllPaid ? 'Reset All' : 'Mark All Paid'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Add Bank Bottom Action -->
      <div class="text-center mt-6">
        <button id="btn-add-bank-bottom" class="btn btn-secondary text-sm">
          <i class="fa-solid fa-plus-circle text-primary"></i>
          <span>Add New Bank Channel</span>
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

    // Clear Search
    document.getElementById('btn-clear-search')?.addEventListener('click', () => {
      store.setSearchQuery('');
    });

    // Reset Filters
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      currentFilter = 'all';
      store.setSearchQuery('');
    });

    // Filter Pills
    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        currentFilter = pill.dataset.filter;
        render(store.state);
      });
    });

    // Bank Header Click for Collapsible Toggle
    container.querySelectorAll('.bank-card-header').forEach(header => {
      header.addEventListener('click', (e) => {
        // If clicked on the menu ellipsis button, don't collapse
        if (e.target.closest('.btn-bank-menu')) return;

        const bankId = header.dataset.bankId;
        if (collapsedBankIds.has(bankId)) {
          collapsedBankIds.delete(bankId);
        } else {
          collapsedBankIds.add(bankId);
        }
        render(store.state);
      });
    });

    // Top action buttons
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

    // Custom Tactile Checkbox Toggle
    container.querySelectorAll('.custom-checkbox-wrapper').forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = cb.closest('.item-row');
        const bankId = row.dataset.bankId;
        const itemId = row.dataset.itemId;
        store.toggleItemPaid(bankId, itemId);
      });
    });

    // Add Item Buttons
    container.querySelectorAll('.btn-add-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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

    // Tap Item Row to Edit
    container.querySelectorAll('.item-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.custom-checkbox-wrapper') || e.target.closest('.item-actions')) return;
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
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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
