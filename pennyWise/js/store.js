/**
 * PennyWise Pro - State Management Store
 */

import { storage } from './services/storage.js';
import { evaluateFormula } from './utils/math.js';
import { getCurrentPeriodKey } from './utils/format.js';

class BudgetStore {
  constructor() {
    const initialPeriod = getCurrentPeriodKey();
    this.state = {
      period: initialPeriod,
      salary: 0,
      banks: [],
      searchQuery: '',
      currentUser: null
    };

    this.subscribers = [];
    this.saveTimeout = null;
  }

  setUser(user) {
    this.state.currentUser = user;
    storage.setUser(user);

    if (user) {
      this.init(this.state.period || getCurrentPeriodKey());
    } else {
      this.state.banks = [];
      this.state.salary = 0;
      this.notify();
    }
  }

  init(initialPeriod = null) {
    const periodKey = initialPeriod || this.state.period || getCurrentPeriodKey();
    const loaded = storage.loadBudget(periodKey);
    this.state.period = loaded.period || periodKey;
    this.state.salary = loaded.salary || 0;
    this.state.banks = loaded.banks || [];
    this.notify();
  }

  clearBudget() {
    this.state.salary = 0;
    this.state.banks = [];
    this.save();
    this.notify();
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    listener(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('Store subscriber error:', err);
      }
    });
  }

  save() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      storage.saveBudget(this.state.period, {
        period: this.state.period,
        salary: this.state.salary,
        banks: this.state.banks
      });
    }, 150);
  }

  // --- ACTIONS ---

  setPeriod(periodKey) {
    if (this.state.period === periodKey) return;
    const loaded = storage.loadBudget(periodKey);
    this.state.period = periodKey;
    this.state.salary = loaded.salary || 0;
    this.state.banks = loaded.banks || [];
    this.notify();

    // Check cloud sync
    storage.subscribeToCloudBudget(periodKey, cloudData => {
      if (cloudData && cloudData.period === this.state.period) {
        this.state.salary = cloudData.salary || 0;
        this.state.banks = cloudData.banks || [];
        this.notify();
      }
    });
  }

  setSalary(newSalary) {
    const val = parseFloat(newSalary) || 0;
    this.state.salary = val;
    this.save();
    this.notify();
  }

  setSearchQuery(query) {
    this.state.searchQuery = (query || '').toLowerCase().trim();
    this.notify();
  }

  // Bank Actions
  addBank(bank) {
    const newBank = {
      id: 'bank-' + Date.now(),
      name: bank.name.trim().toUpperCase(),
      code: bank.code || `TOTAL ${String.fromCharCode(65 + (this.state.banks.length % 26))}`,
      color: bank.color || '#1b7a44',
      bg: bank.bg || '#f0fdf5',
      icon: bank.icon || 'fa-building-columns',
      items: []
    };
    this.state.banks.push(newBank);
    this.save();
    this.notify();
    return newBank;
  }

  updateBank(bankId, bankData) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return;
    if (bankData.name) bank.name = bankData.name.trim().toUpperCase();
    if (bankData.color) bank.color = bankData.color;
    if (bankData.bg) bank.bg = bankData.bg;
    if (bankData.icon) bank.icon = bankData.icon;
    if (bankData.code) bank.code = bankData.code;
    this.save();
    this.notify();
  }

  deleteBank(bankId) {
    this.state.banks = this.state.banks.filter(b => b.id !== bankId);
    this.save();
    this.notify();
  }

  // Item Actions
  addItem(bankId, itemData) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return;

    let evalRes = evaluateFormula(itemData.formula || itemData.amount);
    const amount = evalRes.success ? evalRes.value : (parseFloat(itemData.amount) || 0);

    const newItem = {
      id: 'item-' + Date.now(),
      name: itemData.name.trim().toUpperCase(),
      formula: itemData.formula ? itemData.formula.trim() : String(amount),
      amount: amount,
      note: itemData.note ? itemData.note.trim() : '',
      paid: !!itemData.paid
    };

    bank.items.push(newItem);
    this.save();
    this.notify();
    return newItem;
  }

  updateItem(bankId, itemId, itemData) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return;
    const item = bank.items.find(i => i.id === itemId);
    if (!item) return;

    if (itemData.name) item.name = itemData.name.trim().toUpperCase();
    if (itemData.formula !== undefined) {
      item.formula = itemData.formula.trim();
      const evalRes = evaluateFormula(item.formula);
      item.amount = evalRes.success ? evalRes.value : (parseFloat(itemData.amount) || 0);
    } else if (itemData.amount !== undefined) {
      item.amount = parseFloat(itemData.amount) || 0;
    }
    if (itemData.note !== undefined) item.note = itemData.note.trim();
    if (itemData.paid !== undefined) item.paid = itemData.paid;

    this.save();
    this.notify();
  }

  deleteItem(bankId, itemId) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return;
    bank.items = bank.items.filter(i => i.id !== itemId);
    this.save();
    this.notify();
  }

  toggleItemPaid(bankId, itemId) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return;
    const item = bank.items.find(i => i.id === itemId);
    if (!item) return;
    item.paid = !item.paid;
    this.save();
    this.notify();
  }

  toggleAllBankPaid(bankId) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return;
    const allPaid = bank.items.every(i => i.paid);
    bank.items.forEach(i => i.paid = !allPaid);
    this.save();
    this.notify();
  }

  // Entire state replace (e.g. from Notepad text import or clone)
  replaceBudgetData(newData) {
    if (newData.period) this.state.period = newData.period;
    if (newData.salary !== undefined) this.state.salary = newData.salary;
    if (newData.banks) this.state.banks = newData.banks;
    this.save();
    this.notify();
  }

  // --- GETTERS & METRICS ---

  getGrandTotal() {
    return this.state.banks.reduce((total, bank) => {
      const bankSum = (bank.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      return total + bankSum;
    }, 0);
  }

  getBalance() {
    return (this.state.salary || 0) - this.getGrandTotal();
  }

  getBankSubtotal(bankId) {
    const bank = this.state.banks.find(b => b.id === bankId);
    if (!bank) return 0;
    return (bank.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  getSettlementStats() {
    let totalItems = 0;
    let paidItems = 0;
    let totalAmount = 0;
    let paidAmount = 0;

    this.state.banks.forEach(bank => {
      (bank.items || []).forEach(item => {
        totalItems++;
        totalAmount += (item.amount || 0);
        if (item.paid) {
          paidItems++;
          paidAmount += (item.amount || 0);
        }
      });
    });

    const percentPaid = totalItems > 0 ? Math.round((paidItems / totalItems) * 100) : 0;
    const percentAmount = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

    return {
      totalItems,
      paidItems,
      percentPaid,
      totalAmount,
      paidAmount,
      percentAmount
    };
  }
}

export const store = new BudgetStore();
