// js/db.js

const dbAPI = {
    // --- Users ---
    getUserProfile: async (uid) => {
        const doc = await db.collection('users').doc(uid).get();
        return doc.exists ? { uid: doc.id, ...doc.data() } : null;
    },
    getUsers: (role, callback) => {
        let query = db.collection('users');
        if (role) query = query.where('role', '==', role);
        return query.onSnapshot((snapshot) => {
            const users = [];
            snapshot.forEach(doc => users.push({ uid: doc.id, ...doc.data() }));
            callback(users);
        });
    },
    updateUserProfile: (uid, data) => {
        return db.collection('users').doc(uid).update(data);
    },
    addUser: (data) => {
        return db.collection('users').add({
            role: 'client',
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },
    setCustomPrice: (userId, productId, price) => {
        return db.collection('users').doc(userId).collection('customPrices').doc(productId).set({
            price: parseFloat(price),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },
    getCustomPrice: async (userId, productId) => {
        const doc = await db.collection('users').doc(userId).collection('customPrices').doc(productId).get();
        return doc.exists ? doc.data().price : null;
    },

    // --- Products (Live Stock) ---
    getProducts: (callback) => {
        return db.collection('products').orderBy('name').onSnapshot((snapshot) => {
            const products = [];
            snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            callback(products);
        });
    },
    addProduct: (data) => {
        return db.collection('products').add({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    },
    updateProduct: (id, data) => {
        return db.collection('products').doc(id).update({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    },
    deleteProduct: (id) => db.collection('products').doc(id).delete(),

    // --- Stores / Users Management ---
    updateUser: (uid, data) => {
        return db.collection('users').doc(uid).update(data);
    },
    getStore: async (storeId) => {
        const snapshot = await db.collection('users').where('storeId', '==', storeId).limit(1).get();
        if (!snapshot.empty) return snapshot.docs[0].data();
        return null;
    },

    // --- Orders ---
    createOrder: (order) => {
        // order: { clientId, driverId: null, items: [{productId, name, price, qty, unit}], total, status: 'pending' }
        return db.collection('orders').add({
            ...order,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },
    getOrders: (role, uid, callback) => {
        let query = db.collection('orders').orderBy('createdAt', 'desc');

        if (role === 'client') {
            query = query.where('clientId', '==', uid);
        } else if (role === 'driver') {
            // Drivers see pending (to pick) or assigned to them
            // Complex query, might need client side filtering or separate listeners
            // For now, let's fetch all active orders for drivers and filter client side for simplicity in MVP
            // or we use a limit
        }

        return query.onSnapshot((snapshot) => {
            const orders = [];
            snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
            callback(orders);
        });
    },
    updateOrderStatus: async (orderId, status, driverId = null) => {
        const update = { status };
        if (driverId) update.driverId = driverId;
        if (status === 'completed') update.completedAt = firebase.firestore.FieldValue.serverTimestamp();

        // If accepting, deduct stock (inventory logic)
        if (status === 'accepted') {
            const orderDoc = await db.collection('orders').doc(orderId).get();
            if (orderDoc.exists) {
                const items = orderDoc.data().items || [];
                // Process in parallel
                await Promise.all(items.map(async (item) => {
                    // Use a transaction or decrement increment
                    const productRef = db.collection('products').doc(item.id);
                    await productRef.update({
                        quantity: firebase.firestore.FieldValue.increment(-item.qty)
                    });
                }));
            }
        }

        return db.collection('orders').doc(orderId).update(update);
    },

    // --- Invoices ---
    generateInvoice: (orderId, orderData) => {
        return db.collection('invoices').add({
            orderId,
            clientId: orderData.clientId,
            amount: orderData.total,
            items: orderData.items,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // LHDN placeholder details
            lhdnStatus: 'pending_validation'
        });
    },
    getInvoices: (callback) => {
        return db.collection('invoices').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const invoices = [];
            snapshot.forEach(doc => invoices.push({ id: doc.id, ...doc.data() }));
            callback(invoices);
        });
    }
};

window.dbAPI = dbAPI;
