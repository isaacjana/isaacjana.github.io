import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- Auth Service ---

export function loginWithGoogle() {
    return signInWithPopup(auth, provider);
}

export function logout() {
    return signOut(auth);
}

export function onAuth(callback) {
    return onAuthStateChanged(auth, callback);
}

// --- Profile & Role Service ---

export async function getUserProfile(uid) {
    const docRef = doc(firestore, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
}

export async function updateUserProfile(uid, profileData) {
    return setDoc(doc(firestore, "users", uid), {
        ...profileData,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// --- Realtime Database (Stock Management) ---

/**
 * Create a new stock item
 * @param {Object} itemData 
 */
export async function createStockItem(itemData) {
    const id = itemData.name.toLowerCase().replace(/\s+/g, '_');
    const itemRef = ref(db, `seafood_stock/${id}`);
    return set(itemRef, {
        ...itemData,
        lastUpdated: Date.now()
    });
}

/**
 * Delete a stock item
 * @param {string} itemId 
 */
export async function deleteStockItem(itemId) {
    const itemRef = ref(db, `seafood_stock/${itemId}`);
    return set(itemRef, null);
}

/**
 * Subscribe to stock changes
 * @param {Function} callback - Function called with stock data
 */
export function subscribeToStock(callback) {
    const stockRef = ref(db, 'seafood_stock');
    onValue(stockRef, (snapshot) => {
        const data = snapshot.val();
        callback(data || {});
    });
}

/**
 * Update stock quantity
 * @param {string} itemId - ID of the item
 * @param {number} quantity - New stock count
 */
export async function updateStock(itemId, quantity, clientId = null) {
    const path = clientId ? `client_stock/${clientId}/${itemId}` : `seafood_stock/${itemId}`;
    const itemRef = ref(db, path);
    return update(itemRef, {
        quantity: parseInt(quantity),
        lastUpdated: Date.now()
    });
}

/**
 * Subscribe to client-specific stock
 */
export function subscribeToClientStock(clientId, callback) {
    if (!clientId) return callback({});
    const stockRef = ref(db, `client_stock/${clientId}`);
    return onValue(stockRef, (snapshot) => {
        const data = snapshot.val();
        callback(data || {});
    });
}

export async function createClientStockItem(clientId, itemData) {
    const id = itemData.name.toLowerCase().replace(/\s+/g, '_');
    const itemRef = ref(db, `client_stock/${clientId}/${id}`);
    return set(itemRef, {
        ...itemData,
        lastUpdated: Date.now()
    });
}

/**
 * Initialize default stock if empty
 */
export async function initializeDefaultStock() {
    const stockRef = ref(db, 'seafood_stock');
    onValue(stockRef, (snapshot) => {
        if (!snapshot.exists()) {
            const defaults = {
                'tiger_prawn': {
                    name: 'Tiger Prawn (L)',
                    quantity: 25,
                    price: 45,
                    unit: 'kg',
                    image: 'https://images.pexels.com/photos/19598204/pexels-photo-19598204.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                'mud_crab': {
                    name: 'Sarawak Mud Crab',
                    quantity: 12,
                    price: 85,
                    unit: 'kg',
                    image: 'https://images.pexels.com/photos/19602052/pexels-photo-19602052.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                'seabass': {
                    name: 'Live Seabass',
                    quantity: 8,
                    price: 35,
                    unit: 'pcs',
                    image: 'https://images.pexels.com/photos/9246197/pexels-photo-9246197.jpeg?auto=compress&cs=tinysrgb&w=800'
                },
                'lobster': {
                    name: 'Rock Lobster',
                    quantity: 5,
                    price: 180,
                    unit: 'kg',
                    image: 'https://images.pexels.com/photos/3333523/pexels-photo-3333523.jpeg?auto=compress&cs=tinysrgb&w=800'
                }
            };
            set(stockRef, defaults);
        }
    }, { onlyOnce: true });
}

// --- Firestore (Order Management) ---

/**
 * Update the status of an order
 */
export async function updateOrderStatus(orderId, status) {
    const orderRef = doc(firestore, "orders", orderId);
    return setDoc(orderRef, { status }, { merge: true });
}

export async function updateOrderDriverLocation(orderId, lat, lng) {
    const orderRef = doc(firestore, "orders", orderId);
    return setDoc(orderRef, {
        driverLat: lat,
        driverLng: lng
    }, { merge: true });
}

export async function cancelOrder(orderId) {
    const orderRef = doc(firestore, "orders", orderId);
    return setDoc(orderRef, { status: 'cancelled' }, { merge: true });
}

// --- Jobs & E-Invoicing (LHDN Compliant) ---

/**
 * Generates an LHDN-compliant running number for invoices
 */
async function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const counterRef = doc(firestore, "metadata", "invoice_counter");

    try {
        const counterDoc = await getDoc(counterRef);
        let nextNumber = 1;

        if (counterDoc.exists() && counterDoc.data().year === year) {
            nextNumber = counterDoc.data().lastNumber + 1;
        }

        await setDoc(counterRef, { year, lastNumber: nextNumber }, { merge: true });
        return `INV-${year}-${nextNumber.toString().padStart(5, '0')}`;
    } catch (e) {
        console.error("Counter fail, utilizing timestamp", e);
        return `INV-${year}-${Date.now().toString().slice(-5)}`;
    }
}

/**
 * Creates a centralized multi-item Job (Order) with E-Invoice
 */
export async function createJob(jobData) {
    const { items, customer, clientId } = jobData;

    // items: [{id, name, price, qty, total}]
    const invoiceNo = await generateInvoiceNumber();
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.06; // SST 6%
    const grandTotal = subtotal + tax;

    try {
        const docRef = await addDoc(collection(firestore, "jobs"), {
            invoiceNo,
            items,
            subtotal,
            tax,
            grandTotal,
            customer, // {name, address, phone, tin}
            clientId: clientId || "retail",
            status: 'pending',
            createdAt: serverTimestamp(),
            location: {
                lat: 1.5533 + (Math.random() - 0.5) * 0.02,
                lng: 110.3592 + (Math.random() - 0.5) * 0.02
            }
        });
        return { id: docRef.id, invoiceNo };
    } catch (error) {
        console.error("Critical Job Creation Failure:", error);
        throw error;
    }
}

export function subscribeToJobs(callback) {
    const q = query(collection(firestore, "jobs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const jobs = [];
        querySnapshot.forEach((doc) => {
            jobs.push({ id: doc.id, ...doc.data() });
        });
        callback(jobs);
    });
}

/**
 * Subscribe to active orders
 * @param {Function} callback - Function called with orders array
 */
// --- Subscriptions ---
export function subscribeToOrders(callback) {
    // Legacy support for orders map
    const q = query(collection(firestore, "jobs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const jobs = [];
        querySnapshot.forEach((doc) => {
            jobs.push({ id: doc.id, ...doc.data(), itemName: doc.data().items?.[0]?.name || "Multi-item Job" });
        });
        callback(jobs);
    });
}
// --- Auditing & Analytics ---

/**
 * Record a business action for auditing
 */
export async function recordAudit(uid, action, details) {
    return addDoc(collection(firestore, "audit_log"), {
        uid,
        action,
        details,
        timestamp: serverTimestamp()
    });
}

/**
 * Manage wholesale B2B clients
 */
export async function addWholesaleClient(uid, clientData) {
    return addDoc(collection(firestore, "clients"), {
        ownerUid: uid,
        ...clientData,
        createdAt: serverTimestamp()
    });
}

export function subscribeToClients(uid, callback) {
    const q = query(collection(firestore, "clients"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const clients = [];
        snapshot.forEach(doc => clients.push({ id: doc.id, ...doc.data() }));
        callback(clients);
    });
}

export function subscribeToAuditLog(callback) {
    const q = query(collection(firestore, "audit_log"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const logs = [];
        snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
        callback(logs.slice(0, 5));
    });
}
