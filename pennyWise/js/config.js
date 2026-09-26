/**
 * PennyWise Pro - Configuration & Preset Channels
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjemuEa89QZI68Ttv5iW9DjQMhLwU9Kmk",
  authDomain: "penny-wise-bfdaa.firebaseapp.com",
  projectId: "penny-wise-bfdaa",
  storageBucket: "penny-wise-bfdaa.firebasestorage.app",
  messagingSenderId: "438298356973",
  appId: "1:438298356973:web:2b13a22ec61db8a34cb0e4"
};

// Preset Malaysian Banks & Payment Channels with Brand Styling for Quick Creation
export const BANK_PRESETS = [
  { id: 'affin', name: 'AFFIN BANK', color: '#004b87', bg: '#eff6ff', icon: 'fa-building-columns' },
  { id: 'setel', name: 'SETEL', color: '#8d1b3d', bg: '#fdf2f4', icon: 'fa-gas-pump' },
  { id: 'maybank', name: 'MAY BANK', color: '#d97706', bg: '#fffbeb', icon: 'fa-vault' },
  { id: 'cimb', name: 'CIMB', color: '#da291c', bg: '#fef2f2', icon: 'fa-shield-halved' },
  { id: 'rhb', name: 'MAO RHB BANK', color: '#005eb8', bg: '#eff6ff', icon: 'fa-car' },
  { id: 'bank-islam-mao', name: 'MAO BANK ISLAM', color: '#a31d24', bg: '#fef2f2', icon: 'fa-hand-holding-heart' },
  { id: 'tng', name: 'TNG', color: '#005aab', bg: '#e6f0fa', icon: 'fa-mobile-screen-button' },
  { id: 'gx', name: 'GX', color: '#4f46e5', bg: '#eef2ff', icon: 'fa-piggy-bank' },
  { id: 'digi', name: 'DIGI', color: '#eab308', bg: '#fffde6', icon: 'fa-wifi' },
  { id: 'bank-islam', name: 'BANK ISLAM', color: '#a31d24', bg: '#fef2f2', icon: 'fa-receipt' }
];

export const EMPTY_BUDGET_TEMPLATE = {
  period: '',
  salary: 0,
  banks: []
};
