// Optional Google sign-in backup. Firebase is only downloaded when the user asks for it.
import { state, replace, onChange, blank } from './store.js';

const cfg = {
    apiKey: "AIzaSyDPn8ifAQiRuPpw02JvWdJCKv7KpQIAuXA",
    authDomain: "mum-care.firebaseapp.com",
    projectId: "mum-care",
    storageBucket: "mum-care.firebasestorage.app",
    messagingSenderId: "1011450259230",
    appId: "1:1011450259230:web:6428b90fb4966e748a0b0f"
};
const SDK = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-';
const FLAG = 'mj.cloud';

export const cloud = { user: null, status: 'off', error: '' }; // off | loading | syncing | synced | error
let fb = null, booting = null, pushTimer = null, interactive = false;
let onStatus = () => { }, onConflict = null;

export function configure({ status, conflict }) { onStatus = status; onConflict = conflict; }

const script = (src) => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = () => fail(new Error('offline'));
    document.head.appendChild(s);
});

function setStatus(s, error = '') { cloud.status = s; cloud.error = error; onStatus(); }

function init() {
    if (booting) return booting;
    setStatus('loading');
    booting = (async () => {
        if (!window.firebase) {
            await script(SDK + 'app-compat.js');
            await Promise.all([script(SDK + 'auth-compat.js'), script(SDK + 'firestore-compat.js')]);
        }
        const f = window.firebase;
        if (!f.apps.length) f.initializeApp(cfg);
        fb = { f, auth: f.auth(), db: f.firestore() };
        fb.auth.onAuthStateChanged(onUser);
    })().catch(e => { booting = null; setStatus('error', 'Could not reach the backup service. Check your connection.'); throw e; });
    return booting;
}

export function boot() {
    let want = false;
    try { want = !!localStorage.getItem(FLAG); } catch { }
    if (want) init().catch(() => { });
}

export async function signIn() {
    await init();
    interactive = true;
    try {
        await fb.auth.signInWithPopup(new fb.f.auth.GoogleAuthProvider());
        try { localStorage.setItem(FLAG, '1'); } catch { }
    } catch (e) {
        interactive = false;
        setStatus(cloud.user ? 'synced' : 'off', e.code === 'auth/popup-closed-by-user' ? '' : 'Sign-in did not complete. Please try again.');
        throw e;
    }
}

export async function signOut() {
    try { localStorage.removeItem(FLAG); } catch { }
    if (fb) await fb.auth.signOut();
}

const ref = () => fb.db.collection('users').doc(cloud.user.uid);

async function onUser(u) {
    cloud.user = u ? { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL } : null;
    if (!u) { setStatus('off'); return; }
    setStatus('syncing');
    try {
        const snap = await ref().get();
        const d = snap.exists ? snap.data() : {};
        const hasLocal = !!state.profile.stage;
        if (d.mj) {
            const remote = JSON.parse(d.mj);
            if (!hasLocal) replace(remote);
            else if (interactive && remote.updatedAt !== state.updatedAt && onConflict) {
                const useRemote = await onConflict(remote);
                if (useRemote) replace(remote); else await pushNow();
            }
            else if ((remote.updatedAt || 0) > (state.updatedAt || 0)) replace(remote);
            else if ((remote.updatedAt || 0) < (state.updatedAt || 0)) await pushNow();
        } else if (d.dueDate && !hasLocal) {
            replace(await importLegacy(u.uid, d));
            await pushNow();
        } else if (hasLocal) {
            await pushNow();
        }
        setStatus('synced');
    } catch (e) {
        console.error(e);
        setStatus('error', 'Backup failed. Your data is still safe on this phone.');
    }
    interactive = false;
}

async function pushNow() {
    if (!cloud.user || !fb) return;
    await ref().set({
        mj: JSON.stringify(state), mjUpdatedAt: state.updatedAt,
        name: cloud.user.name || '', email: cloud.user.email || '', photoURL: cloud.user.photo || ''
    }, { merge: true });
}

onChange((source) => {
    if (source !== 'local' || !cloud.user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        setStatus('syncing');
        pushNow().then(() => setStatus('synced')).catch(() => setStatus('error', 'Backup failed. Will retry on the next change.'));
    }, 1500);
});

// One-time import of data saved by the previous version of the app (separate Firestore collections).
async function importLegacy(uid, userDoc) {
    const s = blank();
    s.profile = { stage: 'preg', dueDate: userDoc.dueDate, name: (userDoc.name || '').split(' ')[0] };
    const ms = (t) => (t && t.toDate ? t.toDate().getTime() : Date.now());
    const all = async (col) => {
        try { return (await fb.db.collection(col).where('uid', '==', uid).get()).docs.map(x => ({ id: x.id, ...x.data() })); }
        catch { return []; }
    };
    const secs = (hms) => String(hms || '').split(':').reduce((a, b) => a * 60 + (+b || 0), 0);
    const [kicks, weight, bp, con, appts, baby, vax, miles, bag] = await Promise.all(
        ['kick_logs', 'weight_logs', 'bp_logs', 'contraction_logs', 'appointments', 'baby_logs', 'baby_vaccines', 'baby_milestones', 'user_bag'].map(all));
    s.logs.kicks = kicks.map(k => ({ t: ms(k.timestamp), dur: secs(k.duration), n: 10 }));
    s.logs.weight = weight.map(w => ({ t: ms(w.date), kg: +w.weight })).filter(w => w.kg);
    s.logs.bp = bp.map(b => ({ t: ms(b.date), s: +b.sys, d: +b.dia })).filter(b => b.s && b.d);
    s.logs.con = con.map(c => ({ t: ms(c.timestamp), dur: secs(c.duration) }));
    s.logs.baby = baby.map(b => ({ t: ms(b.timestamp), type: { 'feed-l': 'left', 'feed-r': 'right', bottle: 'bottle', diaper: 'dirty' }[b.type] || 'wet' }));
    for (const k in s.logs) s.logs[k].sort((a, b) => a.t - b.t);
    s.appts = appts.filter(a => a.title && a.date).map(a => ({ id: a.id, title: a.title, when: a.date }));
    const vaxMap = { v1: 'vax.birth', v3: 'vax.hex1', v4: 'vax.hex2', v5: 'vax.pcv1', v6: 'vax.hex3', v8: 'vax.mmr1', v9: 'vax.mmr2' };
    const msMap = { m1: 'ms.smile', m2: 'ms.roll', m3: 'ms.solids', m4: 'ms.crawl' };
    vax.forEach(v => { if (vaxMap[v.vaxId]) s.checks[vaxMap[v.vaxId]] = true; });
    miles.forEach(m => { if (msMap[m.mId]) s.checks[msMap[m.mId]] = true; });
    bag.forEach(b => { s.checks['bag.' + b.itemId] = true; });
    s.updatedAt = Date.now();
    return s;
}
