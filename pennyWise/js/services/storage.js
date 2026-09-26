/**
 * PennyWise Pro - Storage Service
 * Multi-tier storage: Offline LocalStorage first + Cloud Firestore sync
 */

import { SEED_BUDGET_APRIL_2026 } from '../config.js';

const STORAGE_PREFIX = 'pennywise_budget_';
const PERIODS_INDEX_KEY = 'pennywise_periods_index';

class StorageService {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.activeListenerUnsubscribe = null;
    this.initFirestore();
    this.seedDefaultDataIfNeeded();
  }

  initFirestore() {
    try {
      if (typeof window.firebase !== 'undefined' && window.firebase.firestore) {
        this.db = window.firebase.firestore();
      }
    } catch (e) {
      console.warn('Firestore initialization deferred or unavailable offline:', e);
    }
  }

  setUser(user) {
    this.currentUser = user;
  }

  /**
   * Seed April 2026 default budget if user has never visited
   */
  seedDefaultDataIfNeeded() {
    const existing = localStorage.getItem(`${STORAGE_PREFIX}2026-04`);
    if (!existing) {
      this.saveLocalBudget('2026-04', SEED_BUDGET_APRIL_2026);
      this.registerPeriodInIndex('2026-04');
    }
  }

  /**
   * Register a period in the local index
   */
  registerPeriodInIndex(periodKey) {
    try {
      const list = this.getStoredPeriods();
      if (!list.includes(periodKey)) {
        list.push(periodKey);
        list.sort();
        localStorage.setItem(PERIODS_INDEX_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to update period index:', e);
    }
  }

  /**
   * Get all registered period keys
   * @returns {string[]}
   */
  getStoredPeriods() {
    try {
      const data = localStorage.getItem(PERIODS_INDEX_KEY);
      return data ? JSON.parse(data) : ['2026-04'];
    } catch (e) {
      return ['2026-04'];
    }
  }

  /**
   * Load budget for a period (Local first, then Cloud if logged in)
   * @param {string} periodKey - e.g. "2026-04"
   * @returns {Object}
   */
  loadBudget(periodKey) {
    try {
      const localData = localStorage.getItem(`${STORAGE_PREFIX}${periodKey}`);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (e) {
      console.error('Error loading local budget:', e);
    }

    // Fallback: If loading April 2026, return seed
    if (periodKey === '2026-04') {
      return JSON.parse(JSON.stringify(SEED_BUDGET_APRIL_2026));
    }

    // Default blank template for new month
    return {
      period: periodKey,
      salary: 0,
      banks: []
    };
  }

  /**
   * Save budget to LocalStorage and cloud
   * @param {string} periodKey
   * @param {Object} budgetData
   */
  saveBudget(periodKey, budgetData) {
    this.saveLocalBudget(periodKey, budgetData);
    this.registerPeriodInIndex(periodKey);

    if (this.currentUser && this.db) {
      this.syncToCloud(periodKey, budgetData);
    }
  }

  saveLocalBudget(periodKey, budgetData) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${periodKey}`, JSON.stringify(budgetData));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  async syncToCloud(periodKey, budgetData) {
    if (!this.currentUser || !this.db) return;
    try {
      await this.db
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('budgets')
        .doc(periodKey)
        .set({
          ...budgetData,
          updatedAt: Date.now()
        }, { merge: true });
    } catch (e) {
      console.warn('Firestore sync failed (offline):', e);
    }
  }

  /**
   * Clone previous month's structure to a new month
   * @param {string} sourcePeriod - e.g. "2026-04"
   * @param {string} targetPeriod - e.g. "2026-05"
   */
  cloneBudget(sourcePeriod, targetPeriod) {
    const source = this.loadBudget(sourcePeriod);
    const cloned = JSON.parse(JSON.stringify(source));

    cloned.period = targetPeriod;
    // Reset paid status for the new month
    (cloned.banks || []).forEach(bank => {
      (bank.items || []).forEach(item => {
        item.paid = false;
      });
    });

    this.saveBudget(targetPeriod, cloned);
    return cloned;
  }

  /**
   * Subscribe to real-time updates for a period if logged in
   */
  subscribeToCloudBudget(periodKey, onUpdate) {
    if (this.activeListenerUnsubscribe) {
      this.activeListenerUnsubscribe();
      this.activeListenerUnsubscribe = null;
    }

    if (!this.currentUser || !this.db) return;

    try {
      this.activeListenerUnsubscribe = this.db
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('budgets')
        .doc(periodKey)
        .onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            this.saveLocalBudget(periodKey, data);
            onUpdate(data);
          }
        }, err => {
          console.warn('Cloud listener error:', err);
        });
    } catch (e) {
      console.warn('Error setting up cloud listener:', e);
    }
  }
}

export const storage = new StorageService();
