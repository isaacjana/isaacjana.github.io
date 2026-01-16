import { db } from '../firebase-config.js';

export const loadChecklistItems = async (callback) => {
    const snap = await db.collection('checklists').orderBy('trimester').get();
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const loadUserTasks = async (uid, callback) => {
    const snap = await db.collection('user_tasks').where('uid', '==', uid).get();
    callback(snap.docs.map(d => d.data().taskId));
};

export const toggleTask = async (uid, taskId, checked) => {
    if (checked) {
        await db.collection('user_tasks').add({ uid, taskId });
    } else {
        const s = await db.collection('user_tasks').where('uid', '==', uid).where('taskId', '==', taskId).get();
        s.forEach(d => d.ref.delete());
    }
};

export const loadUserBag = async (uid, callback) => {
    const snap = await db.collection('user_bag').where('uid', '==', uid).get();
    callback(snap.docs.map(d => d.data().itemId));
};

export const toggleBagItem = async (uid, itemId, checked) => {
    if (checked) {
        await db.collection('user_bag').add({ uid, itemId });
    } else {
        const s = await db.collection('user_bag').where('uid', '==', uid).where('itemId', '==', itemId).get();
        s.forEach(d => d.ref.delete());
    }
};
