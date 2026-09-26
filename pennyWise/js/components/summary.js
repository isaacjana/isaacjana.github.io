/**
 * PennyWise Pro - Summary & Financial Metric Cards
 */

import { store } from '../store.js';
import { formatRM } from '../utils/format.js';

export function initSummary() {
  const container = document.getElementById('summary-section');
  if (!container) return;

  function render(state) {
    const grandTotal = store.getGrandTotal();
    const balance = store.getBalance();
    const stats = store.getSettlementStats();
    const remainingToPay = grandTotal - stats.paidAmount;

    // Update Hero Balance in Header
    const heroBalEl = document.getElementById('hero-balance-val');
    const heroFormulaEl = document.getElementById('hero-formula-text');

    if (heroBalEl) {
      heroBalEl.textContent = formatRM(balance, false);
      heroBalEl.style.color = balance < 0 ? 'var(--color-coral)' : '#ffffff';
    }

    if (heroFormulaEl) {
      heroFormulaEl.textContent = `${formatRM(state.salary, false)} - ${formatRM(grandTotal, false)} = ${formatRM(balance, false)}`;
    }

    // Render Summary Cards & Settlement Bar
    container.innerHTML = `
      <div class="summary-grid">
        <!-- Salary Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Gaji (Salary)</span>
            <div class="summary-card-icon" style="background: var(--color-primary-100); color: var(--color-primary-800);">
              <i class="fa-solid fa-money-bill-wave"></i>
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <input 
              type="number" 
              id="input-salary" 
              class="form-input text-lg font-bold" 
              style="padding: 0.25rem 0.5rem; font-family: var(--font-family-mono); max-width: 140px; font-weight: 800;"
              value="${state.salary || ''}" 
              placeholder="0.00" 
              step="0.01"
            />
          </div>
          <span class="text-xs text-muted" style="margin-top: 0.35rem;">Net Take-Home Pay</span>
        </div>

        <!-- Grand Total Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Grand Total</span>
            <div class="summary-card-icon" style="background: #fee2e2; color: #ef4444;">
              <i class="fa-solid fa-calculator"></i>
            </div>
          </div>
          <div class="summary-card-val text-coral font-mono">
            ${formatRM(grandTotal)}
          </div>
          <span class="text-xs text-muted" style="margin-top: 0.35rem;">Total Commitments</span>
        </div>

        <!-- Paid / Settled Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Selesai (Paid)</span>
            <div class="summary-card-icon" style="background: #d1fae5; color: #10b981;">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div class="summary-card-val text-emerald font-mono">
            ${formatRM(stats.paidAmount)}
          </div>
          <span class="text-xs text-muted" style="margin-top: 0.35rem;">${stats.paidItems} of ${stats.totalItems} items paid</span>
        </div>

        <!-- Remaining Unpaid Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Baki Belanja</span>
            <div class="summary-card-icon" style="background: #fef3c7; color: #b45309;">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
          <div class="summary-card-val text-gold font-mono">
            ${formatRM(remainingToPay)}
          </div>
          <span class="text-xs text-muted" style="margin-top: 0.35rem;">Pending Transfer</span>
        </div>
      </div>

      <!-- Settlement Progress Bar Card -->
      <div class="card settlement-card">
        <div class="settlement-header">
          <div>
            <h3 class="text-sm font-bold">Kemajuan Pembayaran (Payment Progress)</h3>
            <p class="text-xs text-muted">${stats.paidItems} daripada ${stats.totalItems} komitmen telah dibayar</p>
          </div>
          <span class="badge ${stats.percentPaid === 100 ? 'badge-primary' : 'badge-gold'} font-mono">
            ${stats.percentPaid}% SELESAI
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${stats.percentPaid}%"></div>
        </div>
      </div>
    `;

    // Salary Input Event Listener
    const salaryInput = document.getElementById('input-salary');
    if (salaryInput) {
      salaryInput.addEventListener('change', (e) => {
        store.setSalary(e.target.value);
      });
      salaryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          salaryInput.blur();
        }
      });
    }
  }

  store.subscribe(render);
}
