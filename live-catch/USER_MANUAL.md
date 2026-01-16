# Ocean Ecosystem - Premium B2B Seafood Platform
## Complete System Documentation v2.1

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [User Roles](#user-roles)
5. [LHDN E-Invoice Compliance](#lhdn-compliance)
6. [Multi-Item Jobs System](#jobs-system)
7. [Wholesale B2B Management](#b2b-management)
8. [Client Portal](#client-portal)
9. [Map & Navigation](#map-navigation)
10. [Mobile Responsiveness](#mobile-features)
11. [Security Rules](#security-rules)
12. [Troubleshooting](#troubleshooting)

---

## 🌊 System Overview {#system-overview}

**Ocean** is a premium B2B seafood logistics platform designed for Sarawakian suppliers, drivers, and wholesale clients. Built with LHDN e-invoice compliance in mind.

### Key Features
- ✅ **Multi-item Job Creation** with shopping cart workflow
- ✅ **LHDN-compliant E-Invoicing** with SST 6% calculation
- ✅ **Real-time Inventory Management** via Firebase
- ✅ **Live GPS Tracking** for deliveries
- ✅ **Wholesale B2B Registry** with custom pricing
- ✅ **Mobile-first Responsive Design**
- ✅ **Comprehensive Audit Trail**

---

## 🏗️ Architecture {#architecture}

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | HTML5, Tailwind CSS, Vanilla ES6+ JavaScript |
| Backend | Firebase (Auth + Firestore + Realtime DB) |
| Maps | Leaflet.js with Google/OSM tiles |
| Hosting | GitHub Pages compatible (static) |

### File Structure
```
live-catch/
├── index.html              # Main application
├── client.html             # Client tracking portal
├── style.css               # Design system & animations
├── js/
│   ├── app.js              # Core application logic (~1000 lines)
│   ├── firebase-config.js  # Firebase credentials
│   ├── firebase-service.js # Database operations
│   └── map-service.js      # Leaflet map handling
└── USER_MANUAL.md          # This documentation
```

### Data Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   Firebase   │◀────│   Driver    │
│  (Browser)  │     │  (Backend)   │     │  (Browser)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌─────▼─────┐
              │ Firestore │ │ Realtime  │
              │  (Jobs)   │ │   (Stock) │
              └───────────┘ └───────────┘
```

---

## 🚀 Getting Started {#getting-started}

### 1. Firebase Setup
```javascript
// js/firebase-config.js
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Enable Services
1. **Authentication** → Sign-in method → Enable Google
2. **Firestore** → Create database → Start in test mode
3. **Realtime Database** → Create database → Enable

### 3. Deploy Rules
Copy security rules from [Security Rules](#security-rules) section.

---

## 👥 User Roles {#user-roles}

### 🛒 Shopping (Client)
| Feature | Description |
|---------|-------------|
| Browse Products | View real-time seafood inventory with images |
| Add to Cart | Multi-item selection with quantity adjustment |
| Store Switching | Switch between Ocean Hub and B2B partners |
| Checkout | Generate LHDN-compliant e-invoices |
| Order Tracking | Monitor delivery status in real-time |

### 📦 Inventory (Supplier)
| Feature | Description |
|---------|-------------|
| Stock Management | Update quantities in real-time |
| Low Stock Alerts | Visual warnings when stock < 5 units |
| Catalogue CRUD | Add/edit/delete products |
| Price Management | Set prices per unit |

### 🚚 Delivery (Driver)
| Feature | Description |
|---------|-------------|
| Job Queue | View pending pickups on map |
| Pickup/Complete | Claim and fulfill orders |
| GPS Tracking | Real-time location sharing |
| Navigation | One-tap Google Maps integration |
| Earnings | Track daily commission (RM 5/trip) |

### ⚙️ Setup
| Feature | Description |
|---------|-------------|
| Personal Profile | Address, phone, TIN configuration |
| Ocean Catalogue | Manage global product database |
| Wholesale Registry | B2B client management |
| Driver Identity | Vehicle registration |

---

## 🧾 LHDN E-Invoice Compliance {#lhdn-compliance}

### Invoice Number Format
```
INV-{YEAR}-{RUNNING_NUMBER}
Example: INV-2026-00042
```

### Tax Calculation
```javascript
const subtotal = items.reduce((sum, item) => sum + item.total, 0);
const sst = subtotal * 0.06;  // 6% SST
const grandTotal = subtotal + sst;
```

### Invoice Data Structure
```javascript
{
    invoiceNo: "INV-2026-00042",
    items: [
        { name: "Tiger Prawn", qty: 5, price: 45, total: 225 },
        { name: "Mud Crab", qty: 3, price: 85, total: 255 }
    ],
    subtotal: 480.00,
    tax: 28.80,
    grandTotal: 508.80,
    customer: {
        name: "Restaurant ABC",
        address: "123 Jalan Padungan, Kuching",
        phone: "+60 82-123456",
        tin: "C12345678000"
    },
    createdAt: Timestamp
}
```

---

## � Multi-Item Jobs System {#jobs-system}

### Cart Workflow
1. **Browse** products in the Shopping view
2. **Add to Cart** with quantity selection
3. **Review** items in Job Cart sidebar
4. **Finalize** to create job with e-invoice
5. **Download** or print invoice

### Cart State
```javascript
cart = [
    { id: "tiger_prawn", name: "Tiger Prawn", price: 45, qty: 5, total: 225, unit: "kg" },
    { id: "mud_crab", name: "Mud Crab", price: 85, qty: 3, total: 255, unit: "kg" }
];
```

### Mobile Cart Drawer
On mobile devices (<1024px), the cart transforms into a bottom sheet:
- **FAB Button** - Floating cart icon with badge
- **Swipe Up** - Opens cart drawer
- **Swipe Down** - Closes drawer

---

## 🏢 Wholesale B2B Management {#b2b-management}

### Client Registry
Register wholesale partners with custom pricing:
```javascript
{
    name: "Restoran Sri Sarawak",
    address: "Lot 456, Commercial Centre",
    ownerUid: "firebase-uid-123",
    createdAt: Timestamp
}
```

### Custom Stock per Client
Each B2B client can have unique pricing:
```
/client_stock/{clientId}/{itemId}
```

### Store Switching
Users can switch between:
1. **🌊 Main Ocean Hub** - Default retail pricing
2. **B2B Partners** - Client-specific wholesale rates

---

## 🔐 Client Portal {#client-portal}

### Access Code System
Clients track orders without login using a 6-character code.

| Component | Value |
|-----------|-------|
| Full Order ID | `ABC123xyz456789` |
| Access Code | `ABC123` |
| Portal URL | `/live-catch/client.html` |

### Features
- Real-time order status updates
- Live driver location on map
- Estimated arrival countdown
- No authentication required

---

## 🗺️ Map & Navigation {#map-navigation}

### Available Layers
| Layer | Description |
|-------|-------------|
| Google Streets | Clean vector map (default) |
| Google Satellite | Aerial imagery |
| OpenStreetMap | Community-maintained |

### Driver Controls
| Button | Action |
|--------|--------|
| 📍 Focus | Center map on order |
| ✅ Pickup | Claim the job |
| 🧭 Navigate | Open Google Maps |
| ✓ Complete | Mark delivered |
| ↩️ Undo | Return to queue |
| ❌ Cancel | Remove job |

---

## � Mobile Responsiveness {#mobile-features}

### Breakpoints
| Screen | Width | Layout |
|--------|-------|--------|
| Mobile | <640px | Single column, bottom nav |
| Tablet | 640-1024px | Two columns |
| Desktop | >1024px | Sidebar + main content |

### Mobile-Specific Features
- **Bottom Navigation** - 4-button fixed footer
- **Cart Drawer** - Swipeable bottom sheet
- **FAB** - Floating cart button with badge
- **Stacked Forms** - Vertical input layout
- **Touch Targets** - Minimum 44px tap areas

---

## 🔒 Security Rules {#security-rules}

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - Owner write, authenticated read
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Jobs - Authenticated CRUD
    match /jobs/{jobId} {
      allow read: if true; // Public for tracking
      allow create, update: if request.auth != null;
      allow delete: if false;
    }

    // Clients Registry
    match /clients/{clientId} {
      allow read, write: if request.auth != null;
    }

    // Invoice Counter
    match /metadata/{docId} {
      allow read, write: if request.auth != null;
    }

    // Audit Log - Append only
    match /audit_log/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

### Realtime Database Rules
```json
{
  "rules": {
    "seafood_stock": {
      ".read": true,
      ".write": "auth != null",
      "$item": {
        "quantity": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        }
      }
    },
    "client_stock": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$clientId": {
        "$item": {
          "price": {
            ".validate": "newData.isNumber() && newData.val() > 0"
          }
        }
      }
    }
  }
}
```

---

## 🛠️ Troubleshooting {#troubleshooting}

### Common Issues

| Problem | Solution |
|---------|----------|
| Map not loading | Check internet, try OSM layer |
| Login failed | Verify Firebase Auth settings |
| Orders missing | Check Firestore rules |
| GPS not working | Grant location permissions, use HTTPS |
| Cart not updating | Hard refresh (Ctrl+Shift+R) |
| Invoice blank | Ensure all cart items have prices |

### Console Debugging
```javascript
// Check app state
console.log({ currentUser, currentProfile, stockData, cart });

// Test Firebase connection
import { db } from './firebase-service.js';
console.log('Firebase connected:', !!db);
```

### Performance Tips
- Clear browser cache periodically
- Use Chrome DevTools Network tab for slow requests
- Check Firebase Usage dashboard for quota limits

---

## 📞 Support

**Ocean Ecosystem**  
Premium B2B Seafood Logistics  
Kuching, Sarawak, Malaysia

📧 support@ocean.my  
🌐 https://isaacjana.github.io/live-catch

---

*Last Updated: January 16, 2026*  
*Version: 2.1.0*
