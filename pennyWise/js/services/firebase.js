/**
 * PennyWise Pro - Central Firebase App & Service Initializer
 * Guarantees Firebase is initialized exactly once before Auth or Firestore are accessed.
 */

import { FIREBASE_CONFIG } from '../config.js';

let appInstance = null;

export function getFirebaseApp() {
  if (typeof window === 'undefined' || typeof window.firebase === 'undefined') {
    return null;
  }

  try {
    if (!window.firebase.apps || !window.firebase.apps.length) {
      appInstance = window.firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      appInstance = window.firebase.app();
    }
    return appInstance;
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    return null;
  }
}

export function getFirebaseAuth() {
  getFirebaseApp();
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    return window.firebase.auth();
  }
  return null;
}

export function getFirestoreDb() {
  getFirebaseApp();
  if (typeof window !== 'undefined' && window.firebase && window.firebase.firestore) {
    return window.firebase.firestore();
  }
  return null;
}
