import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
                'tiger_prawn': {
                    name: 'Tiger Prawn (L)',
                    quantity: 25,
                    price: 45,
                    unit: 'kg',
                    image: 'https://images.unsplash.com/photo-1559737558-2f57377f6b98?q=80&w=600&auto=format&fit=crop'
                },
                'mud_crab': {
                    name: 'Sarawak Mud Crab',
                    quantity: 12,
                    price: 85,
                    unit: 'kg',
                    image: 'https://images.unsplash.com/photo-1551460395-829d6d76bb87?q=80&w=600&auto=format&fit=crop'
                },
                'seabass': {
                    name: 'Live Seabass',
                    quantity: 8,
                    price: 35,
                    unit: 'pcs',
                    image: 'https://images.unsplash.com/photo-1534123206718-7389a9f0a2ba?q=80&w=600&auto=format&fit=crop'
                },
                'lobster': {
                    name: 'Rock Lobster',
                    quantity: 5,
                    price: 180,
                    unit: 'kg',
                    image: 'https://images.unsplash.com/photo-1559742811-82410b49c038?q=80&w=600&auto=format&fit=crop'
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
