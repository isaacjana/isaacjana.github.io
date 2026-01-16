import { db, firebase } from '../firebase-config.js';

export const saveBabyLog = async (uid, type) => {
    await db.collection('baby_logs').add({
        uid,
        type,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const loadBabyLogs = async (uid, callback) => {
    const s = await db.collection('baby_logs').where('uid', '==', uid).orderBy('timestamp', 'desc').limit(5).get();
    callback(s.docs.map(d => d.data()));
};

export const toggleVax = async (uid, vaxId, checked) => {
    if (checked) {
        await db.collection('baby_vaccines').add({ uid, vaxId });
    } else {
        const s = await db.collection('baby_vaccines').where('uid', '==', uid).where('vaxId', '==', vaxId).get();
        s.forEach(d => d.ref.delete());
    }
};

export const loadVax = async (uid, callback) => {
    const snap = await db.collection('baby_vaccines').where('uid', '==', uid).get();
    callback(snap.docs.map(d => d.data().vaxId));
};

export const toggleMilestone = async (uid, mId, checked) => {
    if (checked) {
        await db.collection('baby_milestones').add({ uid, mId });
    } else {
        const s = await db.collection('baby_milestones').where('uid', '==', uid).where('mId', '==', mId).get();
        s.forEach(d => d.ref.delete());
    }
};

export const loadMilestones = async (uid, callback) => {
    const snap = await db.collection('baby_milestones').where('uid', '==', uid).get();
    callback(snap.docs.map(d => d.data().mId));
};
