/**
 * PennyWise Pro - Two-Way Notepad Text Parser & Formatter
 * Generates and parses the exact ASCII Notepad format shown in the user's budget notes
 */

import { formatPeriod } from './format.js';
import { evaluateFormula } from './math.js';

/**
 * Converts a budget object into the exact Notepad text format from the user's screenshot
 * @param {Object} budget - { period, salary, banks }
 * @returns {string}
 */
export function exportToNotepadText(budget) {
  const periodLabel = formatPeriod(budget.period, true).toUpperCase() + ' BUDGET';
  let lines = [];

  lines.push(periodLabel);
  lines.push('');

  let grandTotal = 0;

  (budget.banks || []).forEach((bank, bankIdx) => {
    // Bank Header
    lines.push(`===================== ${bank.name.toUpperCase()} =====================`);

    let bankTotal = 0;

    (bank.items || []).forEach(item => {
      bankTotal += (item.amount || 0);

      const name = item.name.padEnd(24, ' ');
      let itemLine = `${name}`;

      // Check if formula is different from amount or contains operator
      const hasFormula = item.formula && /[\+\-\*\/]/.test(item.formula);

      if (hasFormula) {
        const formulaStr = `= ${item.formula}`.padEnd(16, ' ');
        const noteStr = item.note ? ` ( ${item.note} )` : '';
        itemLine += `${formulaStr}= ${formatAmountDisplay(item.amount)}${noteStr}`;
      } else {
        const noteStr = item.note ? ` ( ${item.note} )` : '';
        itemLine += `= ${formatAmountDisplay(item.amount)}${noteStr}`;
      }

      lines.push(itemLine);
    });

    grandTotal += bankTotal;

    // Subtotal
    const totalCode = bank.code || `TOTAL ${String.fromCharCode(65 + (bankIdx % 26))}`;
    lines.push(`${totalCode.padEnd(40, ' ')}= [ ${formatAmountDisplay(bankTotal)} ]`);
    lines.push('');
  });

  // Footer / Grand Total
  lines.push('======================================================');
  lines.push(`GRAND TOTAL                             = ${formatAmountDisplay(grandTotal)}`);
  lines.push('======================================================');
  lines.push('======================================================');

  const salary = budget.salary || 0;
  const balance = salary - grandTotal;

  lines.push(`SALARY                                  = ${formatAmountDisplay(salary)}`);
  lines.push('BALANCE                                 = SALARY - G.TOTAL');
  lines.push(`                                        = ${formatAmountDisplay(salary)} - ${formatAmountDisplay(grandTotal)}`);
  lines.push(`                                        = ${formatAmountDisplay(balance)}`);

  return lines.join('\n');
}

/**
 * Format amount without unnecessary trailing zeroes when clean (e.g. 3,153.5 or 416.6 or 461)
 */
function formatAmountDisplay(num) {
  if (typeof num !== 'number') num = parseFloat(num) || 0;
  // If whole number, format without decimals
  if (num % 1 === 0) {
    return num.toLocaleString('en-US');
  }
  // Otherwise up to 2 decimal places
  return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

/**
 * Parses raw text from user notepad into structured budget data
 * @param {string} text
 * @param {string} defaultPeriod - e.g. "2026-04"
 * @returns {Object} { period, salary, banks }
 */
export function parseFromNotepadText(text, defaultPeriod = '2026-04') {
  const lines = text.split('\n');
  const banks = [];
  let currentBank = null;
  let salary = 0;
  let period = defaultPeriod;

  // Check first line for period (e.g. "Apr 2026 BUDGET")
  const periodMatch = lines[0].match(/([A-Za-z]+)\s+(\d{4})\s+BUDGET/i);
  if (periodMatch) {
    const monthStr = periodMatch[1].toLowerCase();
    const yearStr = periodMatch[2];
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const idx = months.findIndex(m => monthStr.startsWith(m));
    if (idx !== -1) {
      period = `${yearStr}-${String(idx + 1).padStart(2, '0')}`;
    }
  }

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check Bank Header: ===================== AFFIN BANK =====================
    const bankHeaderMatch = line.match(/^=+\s*([^=]+?)\s*=+$/);
    if (bankHeaderMatch) {
      const bankName = bankHeaderMatch[1].trim();
      // Avoid separator lines without name
      if (bankName && !bankName.includes('GRAND TOTAL')) {
        currentBank = {
          id: 'bank-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: bankName,
          code: '',
          color: getRandomBankColor(bankName),
          bg: '#f8fafc',
          icon: getBankIcon(bankName),
          items: []
        };
        banks.push(currentBank);
        continue;
      }
    }

    // Check Subtotal: TOTAL A = [ 851 ]
    const subtotalMatch = line.match(/^(TOTAL\s+[A-Z0-9]+)\s*=\s*\[\s*([\d,\.]+)\s*\]/i);
    if (subtotalMatch && currentBank) {
      currentBank.code = subtotalMatch[1].toUpperCase();
      continue;
    }

    // Check Salary: SALARY = 3570.10
    const salaryMatch = line.match(/^SALARY\s*=\s*([\d,\.]+)/i);
    if (salaryMatch) {
      salary = parseFloat(salaryMatch[1].replace(/,/g, '')) || 0;
      continue;
    }

    // Skip balance and grand total calculation lines in parsing
    if (/^(GRAND TOTAL|BALANCE)\s*=/i.test(line) || line.startsWith('=')) {
      continue;
    }

    // Check Item line:
    // Pattern 1: CAR SERVICE = 100 * 2 = 200 ( 6 MTHS = 600 )
    // Pattern 2: CAR INSTALLMENT = 461 = 461
    // Pattern 3: FUEL = 250
    if (currentBank && line.includes('=')) {
      const parts = line.split('=').map(p => p.trim());
      const name = parts[0];

      let formula = '';
      let amount = 0;
      let note = '';

      if (parts.length >= 3) {
        formula = parts[1];
        const rest = parts[2];
        const noteMatch = rest.match(/([\d,\.]+)\s*\(\s*(.+?)\s*\)/);
        if (noteMatch) {
          amount = parseFloat(noteMatch[1].replace(/,/g, '')) || 0;
          note = noteMatch[2].trim();
        } else {
          amount = parseFloat(rest.replace(/,/g, '')) || 0;
        }
      } else if (parts.length === 2) {
        const rest = parts[1];
        const noteMatch = rest.match(/([\d,\.\s\+\-\*\/]+?)\s*\(\s*(.+?)\s*\)/);
        if (noteMatch) {
          formula = noteMatch[1].trim();
          note = noteMatch[2].trim();
        } else {
          formula = rest;
        }
        const evalRes = evaluateFormula(formula);
        amount = evalRes.value;
      }

      if (name && (amount > 0 || formula)) {
        currentBank.items.push({
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: name.toUpperCase(),
          formula: formula,
          amount: amount,
          note: note,
          paid: false
        });
      }
    }
  }

  return {
    period,
    salary,
    banks
  };
}

function getRandomBankColor(name) {
  const lower = name.toLowerCase();
  if (lower.includes('affin')) return '#004b87';
  if (lower.includes('setel')) return '#8d1b3d';
  if (lower.includes('may')) return '#d97706';
  if (lower.includes('cimb')) return '#da291c';
  if (lower.includes('rhb')) return '#005eb8';
  if (lower.includes('islam')) return '#a31d24';
  if (lower.includes('tng')) return '#005aab';
  if (lower.includes('gx')) return '#4f46e5';
  if (lower.includes('digi')) return '#eab308';
  return '#1b7a44';
}

function getBankIcon(name) {
  const lower = name.toLowerCase();
  if (lower.includes('setel') || lower.includes('fuel')) return 'fa-gas-pump';
  if (lower.includes('tng')) return 'fa-mobile-screen-button';
  if (lower.includes('gx')) return 'fa-piggy-bank';
  if (lower.includes('digi') || lower.includes('bill')) return 'fa-wifi';
  if (lower.includes('rhb') || lower.includes('car')) return 'fa-car';
  return 'fa-building-columns';
}
