# Ocean - Premium Live Seafood Platform (Refined)

This project has been fully refined with a premium design system, enhanced user experience, and robust functionality.

## 🌟 Key Improvements

### 1. Visual Design Overhaul
- **Ocean Theme**: A curated color palette featuring deep ocean blues (`#0f2847`), vibrant accents (`#0ea5e9`), and clean whites.
- **Glassmorphism**: Login cards and modals now use modern backdrop-blur effects for a premium feel.
- **Micro-animations**: smooth transitions, hover effects, and loading states (shimmer effects) throughout the app.
- **Responsive**: Fully mobile-optimized with a collapsible sidebar and touch-friendly interactive elements.

### 2. Dashboard Experience
- **Interactive Charts**: Integrated `Chart.js` for visualizing sales trends and product distribution.
- **Live Stats**: Real-time counters for daily revenue, active orders, and more.
- **Toast Notifications**: Non-intrusive popup alerts for actions like "Added to Cart" or "Order Updated".
- **Empty States**: Beautifully designed placeholders when no data is available, rather than blank tables.

### 3. Architecture & Code
- **Modular Render Functions**: `app.js` is organized into clear render functions for each view.
- **Robust Error Handling**: Toast messages provide feedback on success or failure of operations.
- **Optimized Assets**: CSS is consolidated into a single efficient file `styles.css`.

## 🚀 Features by Role

### Admin
- **Analytics Dashboard**: View sales performance at a glance.
- **Stock Management**: Track live inventory, restock with one click, and see "Low Stock" alerts.
- **Order Processing**: Review incoming orders, set custom pricing (Quotes), and generate LHDN-compliant invoices.
- **Client Management**: Manage client profiles and set custom price tiers.

### Client (Restaurant/User)
- **Visual Catalog**: Browse products with large images and live stock indicators.
- **Cart System**: Floating action button (FAB) for easy access to the cart.
- **Order Tracking**: View status updates from "Requested" -> "Accepted" -> "Delivering".

### Driver
- **Job Board**: View available jobs waiting to be picked up.
- **Delivery Mode**: One-tap navigation via Google Maps and simple status updates.

## 🛠 Tech Stack
- **Frontend**: HTML5, jQuery, CSS3 (Custom + Tailwind Utilities for layout)
- **Backend**: Firebase Firestore & Auth
- **Charts**: Chart.js

## 🏃‍♂️ How to Run
1. Open `index.html` to start.
2. Sign in with Google.
3. Your role will default to **Client**. (To test Admin features, manually update your user document `role` to `admin` in Firestore console).

---
*Refined by Antigravity*
