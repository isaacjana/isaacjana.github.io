/**
 * PennyWise Pro - Authentication Service
 */

import { FIREBASE_CONFIG } from '../config.js';

class AuthService {
  constructor() {
    this.auth = null;
    this.provider = null;
    this.currentUser = null;
    this.listeners = [];
    this.initFirebase();
  }

  initFirebase() {
    try {
      if (typeof window.firebase !== 'undefined') {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.auth = window.firebase.auth();
        this.provider = new window.firebase.auth.GoogleAuthProvider();

        this.auth.onAuthStateChanged(user => {
          this.currentUser = user;
          this.notifyListeners(user);
        });
      }
    } catch (e) {
      console.warn('Firebase Auth initialization warning:', e);
    }
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
  }

  notifyListeners(user) {
    this.listeners.forEach(cb => {
      try {
        cb(user);
      } catch (err) {
        console.error(err);
      }
    });
  }

  async signInWithGoogle() {
    if (!this.auth) {
      throw new Error('Firebase Auth is not available.');
    }
    return this.auth.signInWithPopup(this.provider);
  }

  async signOut() {
    if (!this.auth) return;
    return this.auth.signOut();
  }

  getUser() {
    return this.currentUser;
  }
}

export const authService = new AuthService();
