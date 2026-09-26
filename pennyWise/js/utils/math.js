/**
 * PennyWise Pro - Safe Mathematical Formula Evaluator
 * Safely parses and evaluates arithmetic expressions like "95 * 2", "100 * 2", "450 + 50"
 */

/**
 * Tokenizes and evaluates an arithmetic expression safely without eval()
 * @param {string|number} expression - e.g. "95 * 2", "100 * 2 + 50", "461"
 * @returns {{ success: boolean, value: number, formatted: string, error?: string }}
 */
export function evaluateFormula(expression) {
  if (typeof expression === 'number') {
    return {
      success: true,
      value: expression,
      formatted: expression.toFixed(2)
    };
  }

  if (!expression || typeof expression !== 'string') {
    return { success: false, value: 0, formatted: '0.00' };
  }

  // Clean expression: remove unwanted characters except digits, ., +, -, *, /, (, )
  const cleaned = expression.replace(/,/g, '').trim();
  if (!cleaned) {
    return { success: false, value: 0, formatted: '0.00' };
  }

  // Sanity check: allow only digits, operators, dots, and parens
  if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(cleaned)) {
    return {
      success: false,
      value: 0,
      formatted: '0.00',
      error: 'Invalid characters in formula'
    };
  }

  try {
    // Safe shunting-yard or Function evaluation restricted to strictly checked math expression
    // Note: Since we strictly validated against ^[\d\s\+\-\*\/\.\(\)]+$,
    // no identifiers, properties, or statements can be executed.
    const result = new Function(`"use strict"; return (${cleaned});`)();
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return { success: false, value: 0, formatted: '0.00', error: 'Calculation error' };
    }

    // Round to 2 decimal places to avoid floating point issues (e.g. 0.1 + 0.2)
    const rounded = Math.round((result + Number.EPSILON) * 100) / 100;

    return {
      success: true,
      value: rounded,
      formatted: rounded.toFixed(2)
    };
  } catch (err) {
    return {
      success: false,
      value: 0,
      formatted: '0.00',
      error: err.message
    };
  }
}
