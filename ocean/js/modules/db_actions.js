// js/modules/db_actions.js
// Extends the base dbAPI with complex actions or specific logic

// We will rely on window.dbAPI existing from db.js for now, 
// but eventually we should move db.js to a module.
// For this step, we assume db.js is loaded globally.

export async function submitOrder(cart, currentUser) {
    if (!currentUser.storeId) throw new Error("No store assigned");

    const order = {
        clientId: currentUser.uid,
        clientName: currentUser.name || 'Unknown',
        storeId: currentUser.storeId,
        storeName: currentUser.storeName || '',
        deliveryAddress: currentUser.address || 'No address provided',
        items: cart,
        total: 0,
        status: 'requested',
        driverId: null
    };
    return dbAPI.createOrder(order);
}

export async function checkUserStoreStatus(uid) {
    const user = await dbAPI.getUserProfile(uid);
    if (!user) return null;
    return user.storeId ? 'assigned' : 'unassigned';
}
