/**
 * PennyWise Pro - Configuration & Default Data
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjemuEa89QZI68Ttv5iW9DjQMhLwU9Kmk",
  authDomain: "penny-wise-bfdaa.firebaseapp.com",
  projectId: "penny-wise-bfdaa",
  storageBucket: "penny-wise-bfdaa.firebasestorage.app",
  messagingSenderId: "438298356973",
  appId: "1:438298356973:web:2b13a22ec61db8a34cb0e4"
};

// Preset Malaysian Banks & Payment Channels with Brand Styling
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

/**
 * Seed data matching the user's exact budget from the screenshot:
 * Period: April 2026 (2026-04)
 * Salary: 3570.10
 * Grand Total: 3153.50
 * Balance: 416.60
 */
export const SEED_BUDGET_APRIL_2026 = {
  period: '2026-04',
  salary: 3570.10,
  banks: [
    {
      id: 'affin-bank',
      code: 'TOTAL A',
      name: 'AFFIN BANK',
      color: '#004b87',
      bg: '#eff6ff',
      icon: 'fa-building-columns',
      items: [
        {
          id: 'item-1',
          name: 'CAR INSTALLMENT',
          formula: '461',
          amount: 461.00,
          note: '',
          paid: false
        },
        {
          id: 'item-2',
          name: 'ROADTAX + INSURANCE',
          formula: '95 * 2',
          amount: 190.00,
          note: '12 MTHS = 1104',
          paid: false
        },
        {
          id: 'item-3',
          name: 'CAR SERVICE',
          formula: '100 * 2',
          amount: 200.00,
          note: '6 MTHS = 600',
          paid: false
        }
      ]
    },
    {
      id: 'setel',
      code: 'TOTAL E',
      name: 'SETEL',
      color: '#8d1b3d',
      bg: '#fdf2f4',
      icon: 'fa-gas-pump',
      items: [
        {
          id: 'item-4',
          name: 'FUEL',
          formula: '250',
          amount: 250.00,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'maybank',
      code: 'TOTAL B',
      name: 'MAY BANK',
      color: '#d97706',
      bg: '#fffbeb',
      icon: 'fa-graduation-cap',
      items: [
        {
          id: 'item-5',
          name: 'PTPTN',
          formula: '80',
          amount: 80.00,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'cimb',
      code: 'TOTAL C',
      name: 'CIMB',
      color: '#da291c',
      bg: '#fef2f2',
      icon: 'fa-shield-halved',
      items: [
        {
          id: 'item-6',
          name: 'HEALTH/MEDICAL INSURANCE',
          formula: '225',
          amount: 225.00,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'mao-rhb',
      code: 'TOTAL D',
      name: 'MAO RHB BANK',
      color: '#005eb8',
      bg: '#eff6ff',
      icon: 'fa-car',
      items: [
        {
          id: 'item-7',
          name: 'JANICE CAR INSTALLMENT',
          formula: '485',
          amount: 485.00,
          note: '',
          paid: false
        },
        {
          id: 'item-8',
          name: 'HOTLINK',
          formula: '75',
          amount: 75.00,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'mao-bank-islam',
      code: 'TOTAL E',
      name: 'MAO BANK ISLAM',
      color: '#a31d24',
      bg: '#fef2f2',
      icon: 'fa-hand-holding-heart',
      items: [
        {
          id: 'item-9',
          name: 'JANICE ALLOWANCE',
          formula: '400',
          amount: 400.00,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'tng',
      code: 'TOTAL F',
      name: 'TNG',
      color: '#005aab',
      bg: '#e6f0fa',
      icon: 'fa-mobile-screen-button',
      items: [
        {
          id: 'item-10',
          name: 'gemini',
          formula: '16.00',
          amount: 16.00,
          note: '',
          paid: false
        },
        {
          id: 'item-11',
          name: 'ICLOUD',
          formula: '44.90',
          amount: 44.90,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'gx',
      code: 'TOTAL G',
      name: 'GX',
      color: '#4f46e5',
      bg: '#eef2ff',
      icon: 'fa-piggy-bank',
      items: [
        {
          id: 'item-12',
          name: 'UITM MAO SAVING',
          formula: '300',
          amount: 300.00,
          note: '',
          paid: false
        },
        {
          id: 'item-13',
          name: 'MEAL',
          formula: '300',
          amount: 300.00,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'digi',
      code: 'TOTAL H',
      name: 'DIGI',
      color: '#eab308',
      bg: '#fffde6',
      icon: 'fa-signal',
      items: [
        {
          id: 'item-14',
          name: 'BILL',
          formula: '63.60',
          amount: 63.60,
          note: '',
          paid: false
        }
      ]
    },
    {
      id: 'bank-islam',
      code: 'TOTAL I',
      name: 'BANK ISLAM',
      color: '#a31d24',
      bg: '#fef2f2',
      icon: 'fa-receipt',
      items: [
        {
          id: 'item-15',
          name: 'PARKING',
          formula: '48',
          amount: 48.00,
          note: '',
          paid: false
        },
        {
          id: 'item-16',
          name: 'HAIRCUT',
          formula: '15',
          amount: 15.00,
          note: '',
          paid: false
        }
      ]
    }
  ]
};
