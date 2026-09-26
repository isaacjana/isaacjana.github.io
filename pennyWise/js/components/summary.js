/**
 * PennyWise Pro - Summary & Financial Metric Cards
 * Mobile-friendly 2x2 grid with settlement progress tracking and percentage allocations
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
    const salary = state.salary || 0;
    const allocatedPercent = salary > 0 ? Math.min(Math.round((grandTotal / salary) * 100), 100) : 0;
    const unpaidItems = stats.totalItems - stats.paidItems;

    // Render Summary Cards & Settlement Bar
    container.innerHTML = `
      <div class="summary-grid">
        <!-- Salary Card -->
        <div class="card summary-card card-interactive" title="Click or edit your monthly take-home income">
          <div class="summary-card-header">
            <span class="summary-card-title">Salary Income</span>
            <div class="summary-card-icon" style="background: var(--color-primary-100); color: var(--color-primary-800);">
              <i class="fa-solid fa-money-bill-trend-up"></i>
            </div>
          </div>
          
          <div class="salary-input-wrapper">
            <span class="salary-prefix">RM</span>
            <input 
              type="number" 
              id="input-salary" 
              class="salary-custom-input font-mono font-bold" 
              value="${salary || ''}" 
              placeholder="0.00" 
              step="0.01"
              inputmode="decimal"
              title="Edit take-home salary"
            />
          </div>
          <span class="text-xs text-muted flex items-center justify-between" style="margin-top: 0.4rem;">
            <span>Take-Home Pay</span>
            <span class="text-[11px] text-emerald font-bold">100% Base</span>
          </span>
        </div>

        <!-- Grand Total Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Commitments</span>
            <div class="summary-card-icon" style="background: #fee2e2; color: #ef4444;">
              <i class="fa-solid fa-calculator"></i>
            </div>
          </div>
          <div class="summary-card-val text-coral font-mono">
            ${formatRM(grandTotal)}
          </div>
          <span class="text-xs text-muted flex items-center justify-between" style="margin-top: 0.4rem;">
            <span>Total Bills</span>
            <span class="text-[11px] font-bold ${allocatedPercent > 100 ? 'text-coral' : 'text-slate-600'}">
              ${allocatedPercent}% of Pay
            </span>
          </span>
        </div>

        <!-- Paid / Settled Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Paid / Settled</span>
            <div class="summary-card-icon" style="background: #d1fae5; color: #10b981;">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div class="summary-card-val text-emerald font-mono">
            ${formatRM(stats.paidAmount)}
          </div>
          <span class="text-xs text-muted flex items-center justify-between" style="margin-top: 0.4rem;">
            <span>${stats.paidItems} of ${stats.totalItems} Items</span>
            <span class="text-[11px] font-bold text-emerald">${stats.percentPaid}% Done</span>
          </span>
        </div>

        <!-- Remaining Unpaid Card -->
        <div class="card summary-card">
          <div class="summary-card-header">
            <span class="summary-card-title">Pending Unpaid</span>
            <div class="summary-card-icon" style="background: #fef3c7; color: #b45309;">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
          <div class="summary-card-val text-gold font-mono">
            ${formatRM(remainingToPay)}
          </div>
          <span class="text-xs text-muted flex items-center justify-between" style="margin-top: 0.4rem;">
            <span>${unpaidItems} ${unpaidItems === 1 ? 'Bill' : 'Bills'} Pending</span>
            <span class="text-[11px] font-bold text-gold">${100 - stats.percentPaid}% Left</span>
          </span>
        </div>
      </div>

      <!-- Settlement Progress Bar Card -->
      <div class="card settlement-card">
        <div class="settlement-header">
          <div>
            <h3 class="text-sm font-bold flex items-center gap-1.5">
              <span>Payment Settlement Progress</span>
              ${stats.percentPaid === 100 ? '<span class="text-xs">🎉</span>' : ''}
            </h3>
            <p class="text-xs text-muted">
              ${stats.paidItems} of ${stats.totalItems} commitments marked as paid
            </p>
          </div>
          <span class="badge ${stats.percentPaid === 100 ? 'badge-primary' : 'badge-gold'} font-mono">
            ${stats.percentPaid === 100 ? '<i class="fa-solid fa-check-double text-xs"></i> 100% COMPLETE' : `${stats.percentPaid}% SETTLED`}
          </span>
        </div>

        <div class="progress-track">
          <div class="progress-fill ${stats.percentPaid === 100 ? 'progress-complete' : ''}" style="width: ${stats.percentPaid}%"></div>
        </div>

        <div class="progress-milestones">
          <span class="milestone-mark ${stats.percentPaid >= 0 ? 'active' : ''}">0%</span>
          <span class="milestone-mark ${stats.percentPaid >= 25 ? 'active' : ''}">25%</span>
          <span class="milestone-mark ${stats.percentPaid >= 50 ? 'active' : ''}">50%</span>
          <span class="milestone-mark ${stats.percentPaid >= 75 ? 'active' : ''}">75%</span>
          <span class="milestone-mark ${stats.percentPaid === 100 ? 'active' : ''}">100%</span>
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
