/**
 * PennyWise Pro - Formatting and Date Helpers
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Format a number to Malaysian Ringgit format
 * @param {number|string} amount
 * @param {boolean} withSymbol
 * @returns {string} e.g. "RM 3,153.50" or "3,153.50"
 */
export function formatRM(amount, withSymbol = true) {
  const val = parseFloat(amount) || 0;
  const formatted = new Intl.NumberFormat('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);

  return withSymbol ? `RM ${formatted}` : formatted;
}

/**
 * Format period key (YYYY-MM) to full readable label
 * @param {string} periodKey - e.g. "2026-04"
 * @param {boolean} short - e.g. "Apr 2026" vs "April 2026"
 * @returns {string}
 */
export function formatPeriod(periodKey, short = false) {
  if (!periodKey || !periodKey.includes('-')) return 'Budget Period';
  const [yearStr, monthStr] = periodKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const list = short ? MONTH_SHORT : MONTH_NAMES;
  const monthName = list[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Get current system period string (YYYY-MM)
 * @returns {string} e.g. "2026-04"
 */
export function getCurrentPeriodKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get next period key
 * @param {string} periodKey - "2026-04"
 * @returns {string} "2026-05"
 */
export function getNextPeriod(periodKey) {
  const [year, month] = periodKey.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Get previous period key
 * @param {string} periodKey - "2026-04"
 * @returns {string} "2026-03"
 */
export function getPrevPeriod(periodKey) {
  const [year, month] = periodKey.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}
