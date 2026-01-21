# Ocean Web App - User Manual

## Overview
Ocean is a premium live seafood platform connecting clients with suppliers via a modern web interface. The app provides specialized roles for Administrators, Clients (Stores), and Drivers.

---

## 1. Getting Started

### Login
1. Navigate to the login page (`index.html`).
2. Click **"Sign in with Google"**.
3. Upon first login, your account is created with the **Client** role by default.

### New Client Onboarding
**Important:** New accounts are set to "Pending" status. You cannot place orders until an Administrator assigns you to a Store.
1. Log in.
2. You will see a "Pending Assignment" screen.
3. Contact an Admin to link your account to a Store ID.
4. Once assigned, refresh the page to access the shop.

---

## 2. Administrator Role
Admins have full control over the system.

### Dashboard & Analytics
- **Overview**: View real-time daily/monthly revenue and active orders.
- **Charts**: Interactive graphs showing sales trends (last 7 days) and top products.
- **PDF Invoices**: Click "Invoices" in sidebar to view generated invoices. Click "PDF" to download.

### Managing Clients
1. Go to **"Clients"** in the sidebar.
2. View list of all registered users.
3. **Assign/Edit Store**:
   - Click **"Edit"** on a client row.
   - **Store ID**: Enter a unique ID (e.g., `store_supermart`) or click "Generate New".
     - *Note: Multiple users can share the same Store ID to access the same store account.*
   - **Store Name**: Display name of the store.
   - **Address**: Delivery address used for orders.
   - Click **"Save Changes"**.
4. **Custom Prices**: Click "Prices" to set specific product rates for VIP clients.

### Order Processing
1. Go to **"Orders"**.
2. **Pending Orders**: Review incoming orders.
   - Click "Process Quote" to set the final price (e.g., weighing live items).
   - Enter weight/price adjustments and "Send Quote".
3. **Invoicing**:
   - Once an order is "Completed", an "Invoice" button appears.
   - Click to generate and download the LHDN-compliant PDF invoice.

### Live Stock
1. Go to **"Live Stock"**.
2. **Add Product**: Click the floating "+" button.
3. **Restock**: Click "Restock" on an item to add quantity.

---

## 3. Client Role (Store/Restaurant)
Clients can browse live stock and place orders.

### Placing an Order
1. Go to **"Live Seafood"** (Shop).
2. Browse items. Badges show "In Stock" or "Low Stock".
3. Enter quantity and click **"+ Add"**.
4. Click the **Cart** floating button (bottom right) to review.
5. Click **"Submit Order"**.
6. The status will be "Requested" until Admin provides a quote.

### Order History
1. Go to **"My Orders"**.
2. View status of all orders.
3. Once a price is quoted (Status: Pending Acceptance), you can review the total.

---

## 4. Driver Role
Drivers manage deliveries.

### Job Board
1. Go to **"Available Jobs"**.
2. View list of orders ready for delivery (Status: Accepted, No Driver).
3. Click **"Accept Job"** to assign it to yourself.

### delivering
1. Go to **"My Deliveries"**.
2. Click **"Navigate"** to open Google Maps with the delivery address.
3. Click **"Start Delivery"** when en route.
4. Click **"Complete Order"** upon successful delivery.

---

## Technical Notes
- **App Structure**: The app is built with modular JavaScript.
- **Data**: All data is stored in Firebase Firestore.
- **Offline**: The app requires an internet connection.
