/**
 * PennyWise Pro - Authentication Service
 * Supports Firebase Auth (Google + Email) and resilient Local Account Vault
 * Guarantees strict multi-account isolation and English error reporting.
 */

import { FIREBASE_CONFIG } from '../config.js';

const SESSION_STORAGE_KEY = 'pennywise_active_session';
const ACCOUNTS_VAULT_KEY = 'pennywise_accounts_vault';

// Default starter profiles for fast onboarding and offline testing
const DEFAULT_LOCAL_ACCOUNTS = [
  {
    uid: 'local_isaac_personal',
    displayName: 'Isaac Jana',
    email: 'isaac.personal@pennywise.app',
    avatar: 'fa-user-tie',
    avatarBg: '#004b23',
    role: 'Primary Account',
    isLocal: true,
    createdAt: 1713000000000
  },
  {
    uid: 'local_family_shared',
    displayName: 'Family & Home',
    email: 'family@pennywise.app',
    avatar: 'fa-house-chimney',
    avatarBg: '#005aab',
    role: 'Household Budget',
    isLocal: true,
    createdAt: 1713000000000
  }
];

class AuthService {
  constructor() {
    this.auth = null;
    this.provider = null;
    this.currentUser = null;
    this.listeners = [];
    this.hasCheckedInitialAuth = false;

    this.initAccountsVault();
    this.initFirebase();
    this.restoreCachedSession();
  }

  initAccountsVault() {
    try {
      const stored = localStorage.getItem(ACCOUNTS_VAULT_KEY);
      if (!stored) {
        localStorage.setItem(ACCOUNTS_VAULT_KEY, JSON.stringify(DEFAULT_LOCAL_ACCOUNTS));
      }
    } catch (e) {
      console.warn('Local account vault initialization error:', e);
    }
  }

  getLocalAccounts() {
    try {
      const stored = localStorage.getItem(ACCOUNTS_VAULT_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_LOCAL_ACCOUNTS;
    } catch (e) {
      return DEFAULT_LOCAL_ACCOUNTS;
    }
  }

  createLocalAccount({ name, email, avatar = 'fa-user', avatarBg = '#004b23', role = 'Personal Account' }) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Account name is required.');

    const cleanEmail = (email || `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@pennywise.local`).trim();
    const uid = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newAccount = {
      uid,
      displayName: trimmedName,
      email: cleanEmail,
      avatar,
      avatarBg,
      role,
      isLocal: true,
      createdAt: Date.now()
    };

    const accounts = this.getLocalAccounts();
    accounts.push(newAccount);
    try {
      localStorage.setItem(ACCOUNTS_VAULT_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save account to vault:', e);
    }

    return newAccount;
  }

  deleteLocalAccount(uid) {
    let accounts = this.getLocalAccounts();
    accounts = accounts.filter(a => a.uid !== uid);
    try {
      localStorage.setItem(ACCOUNTS_VAULT_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to remove account from vault:', e);
    }

    if (this.currentUser && this.currentUser.uid === uid) {
      this.signOut();
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

        this.auth.onAuthStateChanged(firebaseUser => {
          if (firebaseUser) {
            const userObj = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || null,
              isLocal: false,
              provider: 'firebase'
            };
            this.setCurrentUser(userObj, true);
          } else if (this.currentUser && !this.currentUser.isLocal) {
            this.setCurrentUser(null, true);
          }
        });
      }
    } catch (e) {
      console.warn('Firebase Auth initialization deferred or offline:', e);
    }
  }

  restoreCachedSession() {
    try {
      const cached = localStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const userObj = JSON.parse(cached);
        if (userObj && userObj.uid) {
          this.currentUser = userObj;
        }
      }
    } catch (e) {
      console.warn('Failed to restore cached session:', e);
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
    // Notify immediately with current user state (can be null or cached user)
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
      throw new Error('Google Sign-In is unavailable offline. Please use a local account.');
    }
    try {
      const result = await this.auth.signInWithPopup(this.provider);
      const user = result.user;
      const userObj = {
        uid: user.uid,
        displayName: user.displayName || 'Google User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        isLocal: false,
        provider: 'google'
      };
      this.setCurrentUser(userObj);
      return userObj;
    } catch (err) {
      console.error('Google sign-in error:', err);
      let msg = err.message || 'Google sign in failed.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not whitelisted in Firebase. Please sign in using a Local Account below.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing.';
      }
      throw new Error(msg);
    }
  }

  async signInWithEmail(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    // Try Firebase if configured
    if (this.auth) {
      try {
        const cred = await this.auth.signInWithEmailAndPassword(email, password);
        const user = cred.user;
        const userObj = {
          uid: user.uid,
          displayName: user.displayName || email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || null,
          isLocal: false,
          provider: 'firebase'
        };
        this.setCurrentUser(userObj);
        return userObj;
      } catch (e) {
        // If Firebase fails with unauthorized domain or network, fallback to local match
        console.warn('Firebase email login failed, checking local accounts...', e);
      }
    }

    // Check local accounts
    const accounts = this.getLocalAccounts();
    const found = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.setCurrentUser(found);
      return found;
    }

    throw new Error('Account not found with this email. Please create a new account.');
  }

  async signUpWithEmail(email, password, displayName) {
    if (!email || !password) {
      throw new Error('Please provide email and password.');
    }

    if (this.auth) {
      try {
        const cred = await this.auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;
        if (displayName && user.updateProfile) {
          await user.updateProfile({ displayName });
        }
        const userObj = {
          uid: user.uid,
          displayName: displayName || email.split('@')[0],
          email: user.email,
          photoURL: null,
          isLocal: false,
          provider: 'firebase'
        };
        this.setCurrentUser(userObj);
        return userObj;
      } catch (e) {
        console.warn('Firebase signup failed, creating local account...', e);
      }
    }

    // Fallback: create local account
    const newAcc = this.createLocalAccount({
      name: displayName || email.split('@')[0],
      email: email
    });
    this.setCurrentUser(newAcc);
    return newAcc;
  }

  signInWithLocalAccount(uid) {
    const accounts = this.getLocalAccounts();
    const account = accounts.find(a => a.uid === uid);
    if (!account) {
      throw new Error('Selected local account does not exist.');
    }
    this.setCurrentUser(account);
    return account;
  }

  async signOut() {
    if (this.auth && this.currentUser && !this.currentUser.isLocal) {
      try {
        await this.auth.signOut();
      } catch (e) {
        console.warn('Firebase signOut warning:', e);
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
