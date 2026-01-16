import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);

// --- Realtime Database (Stock Management) ---

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
export async function updateStock(itemId, quantity) {
    const itemRef = ref(db, `seafood_stock/${itemId}`);
    return update(itemRef, {
        quantity: parseInt(quantity),
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
                'tiger_prawn': { name: 'Tiger Prawn (L)', quantity: 25, price: 45, unit: 'kg', image: 'https://images.unsplash.com/photo-1559737558-2f57377f6b98?auto=format&fit=crop&w=300&q=80' },
                'mud_crab': { name: 'Sarawak Mud Crab', quantity: 12, price: 85, unit: 'kg', image: 'https://images.unsplash.com/photo-1551460395-829d6d76bb87?auto=format&fit=crop&w=300&q=80' },
                'seabass': { name: 'Live Seabass', quantity: 8, price: 35, unit: 'pcs', image: 'https://images.unsplash.com/photo-1534123206718-7389a9f0a2ba?auto=format&fit=crop&w=300&q=80' },
                'lobster': { name: 'Rock Lobster', quantity: 5, price: 180, unit: 'kg', image: 'https://images.unsplash.com/photo-1559742811-82410b49c038?auto=format&fit=crop&w=300&q=80' }
            };
            set(stockRef, defaults);
        }
    }, { onlyOnce: true });
}

// --- Firestore (Order Management) ---

/**
 * Place a new order
 * @param {Object} orderData - Order details
 */
export async function placeOrder(orderData) {
    try {
        const docRef = await addDoc(collection(firestore, "orders"), {
            ...orderData,
            status: 'pending',
            createdAt: serverTimestamp(),
            // Mock location for Kuching area
            location: {
                lat: 1.5533 + (Math.random() - 0.5) * 0.05,
                lng: 110.3592 + (Math.random() - 0.5) * 0.05
            }
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
}

/**
 * Subscribe to active orders
 * @param {Function} callback - Function called with orders array
 */
export function subscribeToOrders(callback) {
    const q = query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        callback(orders);
    });
}
