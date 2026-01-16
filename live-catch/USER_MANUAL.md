# Ocean - Live Seafood Logistics Platform
## User Manual & System Documentation

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Client Portal (Access Code System)](#client-portal)
5. [Map & Navigation](#map-navigation)
6. [Business Analytics](#business-analytics)
7. [Database Security Rules](#database-rules)
8. [Troubleshooting](#troubleshooting)

---

## 🌊 System Overview {#system-overview}

**Ocean** is a premium live seafood logistics platform designed for Sarawakian suppliers, drivers, and wholesale clients. The system provides:

- **Real-time inventory management** with Firebase sync
- **Live GPS tracking** for deliveries using Leaflet/OpenStreetMap
- **Multi-role access** (Client, Supplier, Driver, Analytics)
- **B2B wholesale client registry** with custom pricing
- **Comprehensive audit logging** for business compliance (SST @ 6%)
- **Client tracking portal** with access code authentication

### Technology Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Firebase (Firestore + Realtime Database + Auth)
- **Maps**: Leaflet.js with Google Map tiles (No API key required)
- **Hosting**: GitHub Pages compatible

---

## 🚀 Getting Started {#getting-started}

### 1. Firebase Configuration
Update `js/firebase-config.js` with your Firebase project credentials:

```javascript
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

### 2. Deploy Database Rules
Copy the rules from [Database Security Rules](#database-rules) section below.

### 3. Enable Google Authentication
In Firebase Console → Authentication → Sign-in method → Enable Google.

---

## 👥 User Roles {#user-roles}

### 🛒 Client (Shopping)
- Browse live seafood inventory
- Place orders with automatic SST calculation (6%)
- View delivery address and order history
- Access B2B exclusive items when linked to a wholesale client

### 🏢 Supplier (Inventory)
- Manage seafood stock levels in real-time
- Add/remove items from the Ocean catalogue
- Register wholesale B2B clients
- View order pipeline and analytics

### 🚚 Driver (Delivery)
- View pending orders on interactive map
- **Pickup** orders to claim them
- **Undo Pickup** if needed (returns to pool)
- **Complete** orders to mark as delivered
- **Cancel** problematic orders
- **Navigate** using Google Maps directions (one-tap)
- Real-time GPS tracking visible to clients

### � Analytics (Business Intelligence)
- Total Revenue tracking (RM)
- SST Pool for LHDN reporting
- Driver commission tracking (RM 5.00/trip)
- Live audit log of all business actions
- B2B client registry count

---

## 🔐 Client Portal (Access Code System) {#client-portal}

### For Clients
1. Navigate to `client.html`
2. Enter your **6-character Access Code** (provided by supplier)
3. View real-time order status and live map tracking

### Access Code Format
The access code is the **first 6 characters of the Order ID** (case-insensitive).

Example:
- Order ID: `ABC123xyz456`
- Access Code: `ABC123`

### For Suppliers
When an order is placed, share the access code with your client:
- Find the order in the Driver view
- The Order ID prefix is the access code
- Client can track at: `https://your-domain.com/live-catch/client.html`

---

## 🗺️ Map & Navigation {#map-navigation}

### Map Layers Available
- **Google Streets**: Clean vector map (default)
- **Google Satellite**: High-res aerial imagery
- **OpenStreetMap**: Community-maintained alternative

### Driver Navigation
1. **Locate**: Focus map on order location
2. **Pickup**: Claim the order
3. **Navigate**: Opens Google Maps with turn-by-turn directions
4. **Complete**: Mark delivery as successful

### Live Tracking Features
- Driver location updates every 5 seconds
- Order markers: 🔴 Red = Pending, 🔵 Blue = Picked Up
- Route line drawn between driver and destination
- Clients see real-time updates on `client.html`

---

## 📈 Business Analytics {#business-analytics}

### KPI Dashboard
| Metric | Description |
|--------|-------------|
| Total Revenue | Sum of all delivered orders (RM) |
| Commission Paid | Driver payments @ RM 5.00/trip |
| Active Clients | B2B registry count |
| SST (6%) Pool | Tax collected for LHDN |

### Audit Log Actions
- `PLACE_ORDER` - New order created
- `PICKUP_ORDER` - Driver claimed order
- `DELIVER_ORDER` - Delivery completed
- `UNDO_PICKUP` - Driver returned order to pool
- `CANCEL_ORDER` - Order cancelled
- `ADD_CLIENT` - New B2B client registered
- `ADD_CLIENT_ITEM` - Custom item added to client
- `UPDATE_STOCK` - Inventory adjusted
- `DELETE_STOCK` - Item removed from catalogue

---

## 🔒 Database Security Rules {#database-rules}

### Firestore Rules
Copy and paste into **Firebase Console → Firestore → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User Profiles - Owner can write, authenticated can read
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Orders - Full CRUD for authenticated, read for tracking
    match /orders/{orderId} {
      allow read: if true; // Allow client tracking without login
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }

    // Wholesale Client Registry
    match /clients/{clientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Audit Log - Immutable (create only)
    match /audit_log/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

### Realtime Database Rules
Copy and paste into **Firebase Console → Realtime Database → Rules**:

```json
{
  "rules": {
    "seafood_stock": {
      ".read": true,
      ".write": "auth != null"
    },
    "client_stock": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## 🛠️ Troubleshooting {#troubleshooting}

### Map Not Loading
- Ensure you're connected to the internet
- Check browser console for errors
- Try switching to OpenStreetMap layer

### Orders Not Appearing
- Verify Firebase configuration in `firebase-config.js`
- Check Firestore rules allow read access
- Ensure you're logged in with Google

### Access Code Not Working
- Codes are case-insensitive
- Must be exactly 6 characters
- Ensure the order exists in the system

### GPS Tracking Not Working
- Grant location permissions when prompted
- Ensure HTTPS is enabled (required for geolocation)
- Check if device location services are on

---

## � File Structure

```
live-catch/
├── index.html          # Main application (Admin/Driver)
├── client.html         # Client tracking portal
├── style.css           # Custom styles
├── js/
│   ├── app.js          # Main application logic
│   ├── firebase-config.js  # Firebase credentials
│   ├── firebase-service.js # Database operations
│   └── map-service.js  # Leaflet map handling
└── USER_MANUAL.md      # This documentation
```

---

## 📞 Support

For technical support or business inquiries:
- **Email**: support@ocean.my
- **Location**: Kuching, Sarawak, Malaysia

---

*Last Updated: January 2026*
*Version: 2.0.0*
