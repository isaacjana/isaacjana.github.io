# 🦞 LiveCatch User Manual
**Real-Time Live Seafood Delivery System**

Welcome to **LiveCatch**, a specialized platform designed for Kuching's seafood ecosystem. This manual covers the four main modules: Client, Supplier, Driver, and Admin Setup.

---

## 📱 Roles Overview
LiveCatch is a Single Page Application (SPA). Use the **Navigation Bar** at the top to switch between roles instantly.

### 1. 🛒 Client View (The Marketplace)
*Used by: Customers looking for fresh seafood.*
*   **Live Availability**: Browse items currently in stock. If an item hits zero, it will automatically show as **"SOLD OUT"**.
*   **Ordering**: Click **"Order Now"** to place an order. This immediately decrements the supplier's stock and alerts the drivers.
*   **Real-Time Sync**: You don't need to refresh; the stock counts update as soon as the supplier saves changes.

### 2. 🚛 Driver View (The Logistics)
*Used by: Delivery partners in Kuching.*
*   **Interactive Map**: A Leaflet map centered on Kuching shows all active delivery locations with **Red Markers**.
*   **Order Queue**: View a list of pending deliveries in the right-hand panel.
*   **Navigation**: Click any order in the list to automatically zoom the map to that delivery location.
*   **HQ Location**: The blue marker represents the **LiveCatch HQ / Main Port**.

### 3. ⚓ Supplier View (Stock Control)
*Used by: Port managers and warehouse staff.*
*   **Inventory Table**: View all your catalogue items and their current live quantities.
*   **Quick Updates**: 
    1. Enter the new quantity in the input field.
    2. Click **"Update"**.
    3. The button will flash green (**"Saved!"**) to confirm the update is live for all clients.

### 4. ⚙️ Setup View (Item Management)
*Used by: Administrators and Business Owners.*
*   **Catalogue Setup**: 
    *   **Add Item**: Add new species of seafood by entering the name, price, unit (kg/pcs), and an image URL.
    *   **Remove Item**: Click the 🗑️ icon to remove an item from the global catalogue permanently.
*   **Invoice Integration**: Click the **"Invoice Setup"** button to jump to the *MySarawak Invoice* system to generate tax-compliant invoices for your transactions.

---

## 🛠️ Technical Details & Troubleshooting

### 🖼️ Images not loading?
LiveCatch includes a "fail-safe" mechanism. If an external image (e.g., from Unsplash) is blocked or broken, the app will automatically generate a clean, text-based placeholder so your marketplace always looks professional.

### 📍 Map not showing correctly?
If the map appears grey or distorted, click the **"Driver View"** button again. The app will automatically trigger a "Resize" event to fix the map tile alignment.

### 🔄 Shared Database
LiveCatch shares its backend with **qNext**. 
*   **Tickets/Queues**: Managed by qNext logic.
*   **Orders/Stock**: Managed by LiveCatch logic.
*   Both systems run concurrently without interference.

---

## 📞 Support
For technical issues regarding the Firebase configuration or Leaflet map integration, contact the **Lead Frontend Developer (Gemini 3 Flash)**.
