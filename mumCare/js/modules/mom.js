import { db, firebase } from '../firebase-config.js';

export const saveJournal = async (uid, text) => {
    if (!text) return;
    await db.collection('journal_logs').add({
        uid,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const loadJournal = async (uid, callback) => {
    const snap = await db.collection('journal_logs').where('uid', '==', uid).orderBy('timestamp', 'desc').limit(1).get();
    if (!snap.empty) {
        callback(snap.docs[0].data());
    }
};

export const saveKickSession = async (uid, duration) => {
    await db.collection('kick_logs').add({
        uid,
        duration,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const loadKicks = async (uid, callback) => {
    const snap = await db.collection('kick_logs').where('uid', '==', uid).orderBy('timestamp', 'desc').limit(5).get();
    callback(snap.docs.map(d => d.data()));
};

export const saveWeight = async (uid, weight) => {
    await db.collection('weight_logs').add({
        uid,
        weight,
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const loadWeight = async (uid, callback) => {
    const snap = await db.collection('weight_logs').where('uid', '==', uid).orderBy('date', 'desc').limit(5).get();
    callback(snap.docs.map(d => d.data()));
};

export const saveBP = async (uid, sys, dia) => {
    await db.collection('bp_logs').add({
        uid,
        sys,
        dia,
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const loadBP = async (uid, callback) => {
    const snap = await db.collection('bp_logs').where('uid', '==', uid).orderBy('date', 'desc').limit(5).get();
    callback(snap.docs.map(d => d.data()));
};

export const saveContraction = async (uid, duration) => {
    await db.collection('contraction_logs').add({
        uid,
        duration,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const loadContractions = async (uid, callback) => {
    const snap = await db.collection('contraction_logs').where('uid', '==', uid).orderBy('timestamp', 'desc').limit(5).get();
    callback(snap.docs.map(d => d.data()));
};

export const saveAppointment = async (uid, title, date) => {
    await db.collection('appointments').add({ uid, title, date });
};

export const deleteAppointment = async (id) => {
    await db.collection('appointments').doc(id).delete();
};

export const loadAppointments = async (uid, callback) => {
    const snap = await db.collection('appointments').where('uid', '==', uid).orderBy('date').get();
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};
