/**
 * PennyWise Pro - Account-Scoped Storage Service
 * Multi-tier storage: Offline LocalStorage first (namespaced per account) + Cloud Firestore sync
 * Guarantees that data loads and saves strictly according to the logged-in user account.
 */

import { SEED_BUDGET_APRIL_2026 } from '../config.js';
import { getFirestoreDb } from './firebase.js';

class StorageService {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.activeListenerUnsubscribe = null;
    this.cloudSyncPermissionDenied = false;
  }

  getDb() {
    if (!this.db) {
      this.db = getFirestoreDb();
    }
    return this.db;
  }

  /**
   * Set active account and initialize user-specific data store
   * @param {Object|null} user
   */
  setUser(user) {
    // Unsubscribe previous cloud listener if any
    if (this.activeListenerUnsubscribe) {
      this.activeListenerUnsubscribe();
      this.activeListenerUnsubscribe = null;
    }

    this.currentUser = user;

    if (user && user.uid) {
      this.seedUserDefaultIfNeeded(user.uid);
    }
  }

  getUserId() {
    return this.currentUser ? this.currentUser.uid : 'guest';
  }

  getStorageKey(periodKey) {
    return `pennywise_${this.getUserId()}_budget_${periodKey}`;
  }

  getPeriodsIndexKey() {
    return `pennywise_${this.getUserId()}_periods_index`;
  }

  /**
   * Seed April 2026 budget for a user if they have no budget yet
   */
  seedUserDefaultIfNeeded(uid) {
    try {
      const key = `pennywise_${uid}_budget_2026-04`;
      const existing = localStorage.getItem(key);
      if (!existing) {
        // Also check if there was a legacy global budget from previous session to migrate for Isaac
        const legacy = localStorage.getItem('pennywise_budget_2026-04');
        const seedData = legacy ? JSON.parse(legacy) : JSON.parse(JSON.stringify(SEED_BUDGET_APRIL_2026));
        
        localStorage.setItem(key, JSON.stringify(seedData));
        this.registerPeriodInIndex('2026-04');
      }
    } catch (e) {
      console.error('Error seeding user default budget:', e);
    }
  }

  /**
   * Register a period in this user's period index
   */
  registerPeriodInIndex(periodKey) {
    if (!this.currentUser) return;
    try {
      const list = this.getStoredPeriods();
      if (!list.includes(periodKey)) {
        list.push(periodKey);
        list.sort();
        localStorage.setItem(this.getPeriodsIndexKey(), JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to update period index:', e);
    }
  }

  /**
   * Get all registered period keys for current user
   * @returns {string[]}
   */
  getStoredPeriods() {
    if (!this.currentUser) return ['2026-04'];
    try {
      const data = localStorage.getItem(this.getPeriodsIndexKey());
      return data ? JSON.parse(data) : ['2026-04'];
    } catch (e) {
      return ['2026-04'];
    }
  }

  /**
   * Load budget for a period for the current user
   * @param {string} periodKey - e.g. "2026-04"
   * @returns {Object}
   */
  loadBudget(periodKey) {
    try {
      const localData = localStorage.getItem(this.getStorageKey(periodKey));
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (e) {
      console.error('Error loading account budget:', e);
    }

    // Default template if April 2026 requested
    if (periodKey === '2026-04') {
      const seed = JSON.parse(JSON.stringify(SEED_BUDGET_APRIL_2026));
      this.saveLocalBudget('2026-04', seed);
      return seed;
    }

    // Blank template for new month
    return {
      period: periodKey,
      salary: 0,
      banks: []
    };
  }

  /**
   * Save budget to LocalStorage (scoped to user) and sync to Cloud if applicable
   * @param {string} periodKey
   * @param {Object} budgetData
   */
  saveBudget(periodKey, budgetData) {
    this.saveLocalBudget(periodKey, budgetData);
    this.registerPeriodInIndex(periodKey);

    // If logged in via Google Firebase, sync to Firestore
    const db = this.getDb();
    if (this.currentUser && db) {
      this.syncToCloud(periodKey, budgetData);
    }
  }

  saveLocalBudget(periodKey, budgetData) {
    try {
      localStorage.setItem(this.getStorageKey(periodKey), JSON.stringify(budgetData));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  async syncToCloud(periodKey, budgetData) {
    if (this.cloudSyncPermissionDenied) return;
    const db = this.getDb();
    if (!this.currentUser || !db) return;
    try {
      await db
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('budgets')
        .doc(periodKey)
        .set({
          ...budgetData,
          updatedAt: Date.now()
        }, { merge: true });
    } catch (e) {
      if (e.code === 'permission-denied') {
        this.cloudSyncPermissionDenied = true;
        console.warn('[PennyWise] Firestore write denied by security rules. Budget is safely stored in local browser cache.');
      } else {
        console.warn('Firestore cloud sync notice (offline or unauthorized):', e.message || e);
      }
    }
  }

  /**
   * Clone a period budget to another month for current user
   * @param {string} sourcePeriod
   * @param {string} targetPeriod
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
   * Subscribe to real-time updates for a period if logged in via cloud
   */
  subscribeToCloudBudget(periodKey, onUpdate) {
    if (this.activeListenerUnsubscribe) {
      this.activeListenerUnsubscribe();
      this.activeListenerUnsubscribe = null;
    }

    const db = this.getDb();
    if (!this.currentUser || !db) return;

    try {
      this.activeListenerUnsubscribe = db
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
          if (err.code === 'permission-denied') {
            this.cloudSyncPermissionDenied = true;
            console.warn('[PennyWise] Firestore Security Rules need configuration for cross-device sync. Data is safely stored in local browser storage.');
          } else {
            console.warn('Cloud listener notice:', err.message || err);
          }
        });
    } catch (e) {
      console.warn('Could not register cloud listener:', e.message || e);
    }
  }

  /**
   * Clear all local budget data for current user
   */
  clearUserData() {
    if (!this.currentUser) return;
    const periods = this.getStoredPeriods();
    periods.forEach(p => {
      try {
        localStorage.removeItem(this.getStorageKey(p));
      } catch (e) {}
    });
    try {
      localStorage.removeItem(this.getPeriodsIndexKey());
    } catch (e) {}
  }
}

export const storage = new StorageService();
