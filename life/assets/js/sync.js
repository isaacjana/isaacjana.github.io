// Google sign-in (Firebase Auth) and cloud sync of the whole app state (one Firestore doc per user).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
    onAuthStateChanged, signOut, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    doc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjemuEa89QZI68Ttv5iW9DjQMhLwU9Kmk",
    authDomain: "penny-wise-bfdaa.firebaseapp.com",
    projectId: "penny-wise-bfdaa",
    storageBucket: "penny-wise-bfdaa.firebasestorage.app",
    messagingSenderId: "438298356973",
    appId: "1:438298356973:web:198dc164a067952a4cb0e4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
    db = initializeFirestore(app, {});
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

setPersistence(auth, browserLocalPersistence).catch(() => { });
getRedirectResult(auth).catch((e) => console.warn('Redirect sign-in failed', e));

export function watchAuth(cb) {
    return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        // Popups are often blocked in installed PWAs / in-app browsers: fall back to a full redirect.
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) {
            await signInWithRedirect(auth, provider);
            return;
        }
        if (e.code === 'auth/popup-closed-by-user') return;
        throw e;
    }
}

export function signOutUser() {
    return signOut(auth);
}

const stateDoc = (uid) => doc(db, 'users', uid, 'life', 'state');

// Calls onRemote(data | null, { fromCache }) whenever the cloud copy changes (ignores our own pending writes).
export function subscribeState(uid, onRemote, onError) {
    return onSnapshot(stateDoc(uid), { includeMetadataChanges: false }, (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        onRemote(snap.exists() ? snap.data() : null, { fromCache: snap.metadata.fromCache });
    }, onError);
}

export function saveState(uid, state) {
    // Firestore rejects undefined values; a JSON round-trip strips them.
    return setDoc(stateDoc(uid), JSON.parse(JSON.stringify(state)));
}
