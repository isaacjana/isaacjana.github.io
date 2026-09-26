/**
 * PennyWise Pro - Google Authentication Service
 * Exclusively uses Google Authentication via Firebase Auth.
 * Handles automatic session restoration, Google popup sign-in, and sign-out.
 */

import { FIREBASE_CONFIG } from '../config.js';

const SESSION_STORAGE_KEY = 'pennywise_active_session';

class AuthService {
  constructor() {
    this.auth = null;
    this.provider = null;
    this.currentUser = null;
    this.listeners = [];
    this.hasCheckedInitialAuth = false;

    this.cleanupLegacyLocalData();
    this.restoreCachedSession();
    this.initFirebase();
  }

  /**
   * Purge legacy local account vaults and local session profiles
   */
  cleanupLegacyLocalData() {
    try {
      localStorage.removeItem('pennywise_accounts_vault');
    } catch (e) {
      console.warn('Storage purge warning:', e);
    }
  }

  /**
   * Restore cached Google session on initial page load before Firebase network handshake
   */
  restoreCachedSession() {
    try {
      const cached = localStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const userObj = JSON.parse(cached);
        // Ensure legacy local profile is not restored
        if (userObj && (userObj.isLocal || (userObj.uid && userObj.uid.startsWith('local_')))) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          this.currentUser = null;
        } else if (userObj && userObj.uid) {
          this.currentUser = userObj;
        }
      }
    } catch (e) {
      console.warn('Failed to restore cached session:', e);
    }
  }

  initFirebase() {
    try {
      if (typeof window.firebase !== 'undefined') {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.auth = window.firebase.auth();
        this.provider = new window.firebase.auth.GoogleAuthProvider();
        this.provider.setCustomParameters({ prompt: 'select_account' });

        this.auth.onAuthStateChanged(firebaseUser => {
          this.hasCheckedInitialAuth = true;
          if (firebaseUser) {
            const userObj = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || null,
              provider: 'google'
            };
            this.setCurrentUser(userObj, true);
          } else {
            this.setCurrentUser(null, true);
          }
        });
      } else {
        console.warn('Firebase SDK not loaded.');
      }
    } catch (e) {
      console.warn('Firebase Auth initialization error:', e);
    }
  }

  setCurrentUser(user, persist = true) {
    this.currentUser = user;
    if (persist) {
      try {
        if (user) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Could not persist session to localStorage:', e);
      }
    }
    this.notifyListeners(user);
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Fire immediately with current state
    callback(this.currentUser);
  }

  notifyListeners(user) {
    this.listeners.forEach(cb => {
      try {
        cb(user);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }

  async signInWithGoogle() {
    if (!this.auth) {
      throw new Error('Google Sign-In is initializing. Please check your internet connection and try again.');
    }

    try {
      const result = await this.auth.signInWithPopup(this.provider);
      const user = result.user;
      const userObj = {
        uid: user.uid,
        displayName: user.displayName || 'Google User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        provider: 'google'
      };
      this.setCurrentUser(userObj);
      return userObj;
    } catch (err) {
      console.error('Google sign-in error:', err);

      let msg = err.message || 'Google sign in failed.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not whitelisted in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in window was closed before finishing.';
      } else if (err.code === 'auth/popup-blocked') {
        // Fallback to redirect if popup is blocked
        try {
          await this.auth.signInWithRedirect(this.provider);
          return null;
        } catch (redirectErr) {
          msg = 'Sign-in popup was blocked by browser. Please allow popups for this site.';
        }
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection failed. Please check your internet connection.';
      }

      throw new Error(msg);
    }
  }

  async signOut() {
    if (this.auth) {
      try {
        await this.auth.signOut();
      } catch (e) {
        console.warn('Firebase signOut error:', e);
      }
    }
    this.setCurrentUser(null);
  }

  getUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!(this.currentUser && this.currentUser.uid);
  }
}

export const authService = new AuthService();
