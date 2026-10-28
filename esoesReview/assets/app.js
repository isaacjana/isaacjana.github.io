// eSOEs Review Notes — capture and track user feedback from system review sessions.
// Data lives in Firestore, one doc per session and per feedback item, either in the user's private space
// (users/{uid}/esoes_*) or in a shared workspace (esoes_workspaces/{code}/*) that others join with its code.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
    onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, deleteField, onSnapshot, writeBatch, runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjemuEa89QZI68Ttv5iW9DjQMhLwU9Kmk",
    authDomain: "penny-wise-bfdaa.firebaseapp.com",
    projectId: "penny-wise-bfdaa",
    storageBucket: "penny-wise-bfdaa.firebasestorage.app",
    messagingSenderId: "438298356973",
    appId: "1:438298356973:web:198dc164a067952a4cb0e4"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let db;
try {
    db = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
    db = initializeFirestore(fbApp, {});
}
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
getRedirectResult(auth).catch((e) => console.warn('Redirect sign-in failed', e));

// ---------------------------------------------------------------- Vocabulary
const TYPES = [
    { id: 'issue', label: 'Bug / Issue', c: '#dc2626' },
    { id: 'gap', label: 'Legacy gap', c: '#9333ea', hint: 'Available in the legacy system but missing or different in the new one' },
    { id: 'change', label: 'Change request', c: '#2563eb' },
    { id: 'new', label: 'New requirement', c: '#0891b2' },
    { id: 'data', label: 'Data / Migration', c: '#ca8a04' },
    { id: 'ux', label: 'UI / Usability', c: '#db2777' },
    { id: 'question', label: 'Question', c: '#64748b' },
    { id: 'positive', label: 'Positive', c: '#16a34a' }
];
const PRIORITIES = [
    { id: 'critical', label: 'Critical', c: '#dc2626' },
    { id: 'high', label: 'High', c: '#ea580c' },
    { id: 'medium', label: 'Medium', c: '#ca8a04' },
    { id: 'low', label: 'Low', c: '#64748b' }
];
const STATUSES = [
    { id: 'open', label: 'Open', c: '#2563eb', open: true },
    { id: 'review', label: 'Under review', c: '#7c3aed', open: true },
    { id: 'accepted', label: 'Accepted', c: '#0891b2', open: true },
    { id: 'progress', label: 'In progress', c: '#ca8a04', open: true },
    { id: 'resolved', label: 'Resolved', c: '#16a34a' },
    { id: 'deferred', label: 'Deferred', c: '#64748b' },
    { id: 'rejected', label: 'Not proceeding', c: '#9ca3af' }
];
const DEFAULT_MODULES = ['Login & Access', 'Dashboard', 'Data Submission', 'Workflow & Approval', 'Reports', 'User Management', 'Notifications', 'Data Migration', 'Integration', 'Other'];
const byId = (list, id) => list.find((x) => x.id === id) || { id, label: id || '—', c: '#9ca3af' };
const isOpen = (f) => byId(STATUSES, f.status).open === true;

// ---------------------------------------------------------------- State
const ui = {
    ready: false, user: null, tab: 'capture', loginBusy: false, loginError: '', pending: 0, syncError: false,
    sheet: null, draft: null, capture: null, loading: false,
    ws: 'personal', wsDoc: null, joinCode: new URLSearchParams(location.search).get('join') || '',
    activeSessionId: '',
    filters: { q: '', entity: '', module: '', type: '', priority: '', status: 'open*', session: '', group: 'none', sort: 'newest' }
};
const defaultConfig = () => ({ entities: [], modules: DEFAULT_MODULES.slice(), owners: [] });
let config = defaultConfig();
let prefs = { theme: 'system', workspaces: [], current: 'personal' };
let sessions = [], feedback = [];
let authUnsubs = [], dataUnsubs = [];

const root = document.getElementById('root');
const sheetRoot = document.getElementById('sheet-root');

// Where the current workspace keeps its data.
const shared = () => ui.ws !== 'personal';
const PATHS = {
    personal: { base: () => ['users', ui.user.uid], sessions: 'esoes_sessions', feedback: 'esoes_feedback', config: ['esoes', 'config'] },
    shared: { base: () => ['esoes_workspaces', ui.ws], sessions: 'sessions', feedback: 'feedback', config: ['meta', 'config'] }
};
const P = () => PATHS[shared() ? 'shared' : 'personal'];
const col = (kind) => collection(db, ...P().base(), P()[kind]);
const ref = (kind, id) => doc(db, ...P().base(), P()[kind], id);
const configRef = () => doc(db, ...P().base(), ...P().config);
const wsRef = (code) => doc(db, 'esoes_workspaces', code);
const prefsRef = () => doc(db, 'users', ui.user.uid, 'esoes', 'prefs');
const clean = (o) => JSON.parse(JSON.stringify(o));
const me = () => ({ uid: ui.user.uid, name: ui.user.name });

function track(promise) {
    ui.pending++; refreshSync();
    return promise.then(() => { ui.syncError = false; }).catch((e) => {
        console.error(e); ui.syncError = true;
        toast(e.code === 'permission-denied' ? 'Not allowed to save — check Firestore rules' : 'Couldn’t sync — will retry when online');
    }).finally(() => { ui.pending--; refreshSync(); });
}
const saveFeedback = (f) => { f.updatedAt = Date.now(); f.updatedBy = me(); return track(setDoc(ref('feedback', f.id), clean(f))); };
const saveSession = (s) => { s.updatedAt = Date.now(); return track(setDoc(ref('sessions', s.id), clean(s))); };
const saveConfig = () => track(setDoc(configRef(), clean(config)));
const savePrefs = () => track(setDoc(prefsRef(), clean(prefs)));

// ---------------------------------------------------------------- Auth & workspaces
onAuthStateChanged(auth, async (user) => {
    authUnsubs.forEach((u) => u()); authUnsubs = [];
    dataUnsubs.forEach((u) => u()); dataUnsubs = [];
    sessions = []; feedback = []; config = defaultConfig();
    prefs = { theme: 'system', workspaces: [], current: 'personal' };
    ui.ws = 'personal'; ui.wsDoc = null;
    ui.user = user ? { uid: user.uid, name: user.displayName || user.email, email: user.email || '', photo: user.photoURL } : null;
    ui.ready = true;
    ui.sheet = null;
    if (!user) { render(); return; }
    ui.loading = true; render();
    try {
        const snap = await getDoc(prefsRef());
        if (snap.exists()) prefs = { ...prefs, ...snap.data() };
    } catch (e) { console.warn('prefs', e); }
    applyTheme();
    if (ui.joinCode) {
        const code = normCode(ui.joinCode);
        ui.joinCode = '';
        history.replaceState(null, '', location.pathname);
        if (await joinWorkspace(code)) return;
    }
    await openWorkspace(prefs.current || 'personal', { quiet: true });
});

// Switches every listener over to a workspace ('personal' or a share code).
async function openWorkspace(code, { quiet = false } = {}) {
    dataUnsubs.forEach((u) => u()); dataUnsubs = [];
    sessions = []; feedback = []; config = defaultConfig();
    stopDictation();
    ui.ws = code; ui.wsDoc = null; ui.sheet = null; ui.capture = null; ui.loading = true;
    ui.filters = { ...ui.filters, entity: '', module: '', session: '', q: '' };
    try { ui.activeSessionId = localStorage.getItem(`esoes:session:${code}`) || ''; } catch (e) { ui.activeSessionId = ''; }
    if (prefs.current !== code) { prefs.current = code; savePrefs(); }
    render();

    let loaded = 0;
    const need = shared() ? 4 : 3;
    const done = () => { loaded++; if (loaded >= need) ui.loading = false; render(); };
    const onErr = (e) => {
        console.error(e);
        if (e.code === 'permission-denied' && shared()) {
            toast('You no longer have access to that workspace');
            forgetWorkspace(code);
            openWorkspace('personal');
            return;
        }
        ui.syncError = true; ui.loading = false;
        toast(e.code === 'permission-denied' ? 'Firestore rules are blocking access' : 'Sync error');
        render();
    };
    if (shared()) {
        dataUnsubs.push(onSnapshot(wsRef(code), (snap) => {
            if (!snap.exists() || !(snap.data().members || {})[ui.user.uid]) {
                toast(snap.exists() ? 'You were removed from this workspace' : 'This workspace was deleted');
                forgetWorkspace(code);
                openWorkspace('personal');
                return;
            }
            ui.wsDoc = snap.data();
            rememberWorkspace(code, ui.wsDoc.name);
            done();
        }, onErr));
    }
    dataUnsubs.push(onSnapshot(configRef(), (snap) => {
        config = { ...defaultConfig(), ...(snap.exists() ? snap.data() : {}) };
        done();
    }, onErr));
    dataUnsubs.push(onSnapshot(col('sessions'), (snap) => {
        sessions = snap.docs.map((d) => d.data()).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
        if (ui.activeSessionId && !sessions.some((s) => s.id === ui.activeSessionId) && !snap.metadata.fromCache) setActive('');
        done();
    }, onErr));
    dataUnsubs.push(onSnapshot(col('feedback'), (snap) => {
        feedback = snap.docs.map((d) => d.data());
        done();
    }, onErr));
    if (!quiet) toast(shared() ? `Switched to ${workspaceName(code)}` : 'Switched to Personal');
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const fmtCode = (c) => c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
const workspaceName = (code) => code === 'personal' ? 'Personal' : (code === ui.ws && ui.wsDoc?.name) || prefs.workspaces.find((w) => w.code === code)?.name || fmtCode(code);
const inviteLink = (code) => `${location.origin}${location.pathname}?join=${fmtCode(code)}`;

function newCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return [...bytes].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

function rememberWorkspace(code, name) {
    const i = prefs.workspaces.findIndex((w) => w.code === code);
    if (i >= 0 && prefs.workspaces[i].name === name) return;
    if (i >= 0) prefs.workspaces[i].name = name; else prefs.workspaces.push({ code, name });
    savePrefs();
}
function forgetWorkspace(code) {
    prefs.workspaces = prefs.workspaces.filter((w) => w.code !== code);
    if (prefs.current === code) prefs.current = 'personal';
    savePrefs();
}

async function createWorkspace(name, copyPersonal) {
    const code = newCode();
    const u = ui.user;
    await setDoc(wsRef(code), {
        name, owner: u.uid, ownerName: u.name, joinOpen: true, createdAt: Date.now(),
        members: { [u.uid]: { name: u.name, email: u.email, photo: u.photo || '', role: 'owner', joinedAt: Date.now() } }
    });
    const base = ['esoes_workspaces', code];
    const writes = [[doc(db, ...base, 'meta', 'config'), copyPersonal ? { ...config } : { ...defaultConfig(), entities: config.entities.slice(), modules: config.modules.slice(), owners: config.owners.slice() }]];
    if (copyPersonal) {
        const maxSeq = feedback.reduce((m, f) => Math.max(m, f.seq || 0), 0);
        sessions.forEach((x) => writes.push([doc(db, ...base, 'sessions', x.id), x]));
        feedback.forEach((x) => writes.push([doc(db, ...base, 'feedback', x.id), { createdBy: me(), ...x }]));
        writes.push([doc(db, ...base, 'meta', 'counter'), { seq: maxSeq }]);
    }
    for (let i = 0; i < writes.length; i += 400) {
        const batch = writeBatch(db);
        writes.slice(i, i + 400).forEach(([r, d]) => batch.set(r, clean(d)));
        await batch.commit();
    }
    rememberWorkspace(code, name);
    await openWorkspace(code, { quiet: true });
    return code;
}

async function joinWorkspace(code) {
    if (code.length !== 8) { toast('Codes are 8 characters, e.g. K7QM-4XPA'); return false; }
    try {
        const snap = await getDoc(wsRef(code));
        if (!snap.exists()) { toast('No workspace with that code'); return false; }
        const w = snap.data();
        if (!(w.members || {})[ui.user.uid]) {
            if (!w.joinOpen) { toast('This workspace isn’t accepting new members — ask the owner'); return false; }
            const u = ui.user;
            await updateDoc(wsRef(code), { [`members.${u.uid}`]: { name: u.name, email: u.email, photo: u.photo || '', role: 'member', joinedAt: Date.now() } });
        }
        rememberWorkspace(code, w.name);
        await openWorkspace(code, { quiet: true });
        toast(`Joined ${w.name}`);
        return true;
    } catch (e) {
        console.error(e);
        toast(e.code === 'permission-denied' ? 'Couldn’t join — Firestore rules need updating' : 'Couldn’t join — check your connection');
        return false;
    }
}

// Next FB-#### number. Shared workspaces use a transaction on a counter doc so two people
// capturing at once never get the same number; offline it falls back to the local maximum.
async function allocRef() {
    const local = feedback.reduce((m, f) => Math.max(m, f.seq || 0), 0) + 1;
    let n = local;
    if (shared() && navigator.onLine) {
        const counter = doc(db, 'esoes_workspaces', ui.ws, 'meta', 'counter');
        try {
            n = await Promise.race([
                runTransaction(db, async (tx) => {
                    const snap = await tx.get(counter);
                    const next = Math.max(snap.exists() ? snap.data().seq || 0 : 0, local - 1) + 1;
                    tx.set(counter, { seq: next });
                    return next;
                }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))
            ]);
        } catch (e) { console.warn('counter', e); }
    }
    return { seq: n, ref: `FB-${String(n).padStart(4, '0')}` };
}

async function login() {
    ui.loginBusy = true; ui.loginError = ''; render();
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) {
            await signInWithRedirect(auth, provider);
            return;
        }
        if (e.code !== 'auth/popup-closed-by-user') {
            console.error(e);
            ui.loginError = e.code === 'auth/unauthorized-domain' ? 'This domain isn’t authorised for Google sign-in in Firebase.' : 'Sign-in failed. Please try again.';
        }
    }
    ui.loginBusy = false;
    if (!ui.user) render();
}

// ---------------------------------------------------------------- Helpers
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (k) => k ? new Date(k + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (ts) => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const sessionById = (id) => sessions.find((s) => s.id === id);
const activeSession = () => sessionById(ui.activeSessionId);
const badge = (item) => `<span class="badge" style="--c:${item.c}">${esc(item.label)}</span>`;
const sessionLabel = (s) => s ? `${fmtDate(s.date)} · ${s.title || s.entity || 'Session'}` : '—';

function setActive(id) {
    ui.activeSessionId = id;
    try { id ? localStorage.setItem(`esoes:session:${ui.ws}`, id) : localStorage.removeItem(`esoes:session:${ui.ws}`); } catch (e) { }
    if (ui.capture) ui.capture.entity = activeSession()?.entity || ui.capture.entity;
}

// Adds new entity/module/owner names typed into free-text fields to the shared pick lists.
function remember(listName, value) {
    const v = (value || '').trim();
    if (!v || config[listName].some((x) => x.toLowerCase() === v.toLowerCase())) return false;
    config[listName] = [...config[listName], v].sort((a, b) => a.localeCompare(b));
    return true;
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}

function applyTheme() {
    if (prefs.theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', prefs.theme);
}

const syncClass = () => !ui.online ? 'busy' : ui.syncError ? 'bad' : ui.pending ? 'busy' : 'ok';
const syncText = () => !ui.online ? 'Offline — saved on device' : ui.syncError ? 'Sync issue' : ui.pending ? 'Saving…' : 'All changes saved';
function refreshSync() {
    document.querySelectorAll('[data-offline]').forEach((el) => el.classList.toggle('hidden', ui.online));
    document.querySelectorAll('[data-syncdot]').forEach((el) => { el.className = 'dot ' + syncClass(); });
    document.querySelectorAll('[data-synctext]').forEach((el) => { el.textContent = syncText(); });
}

const I = {
    capture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    sessions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l4-4 4 4M16 15l-4 4-4-4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    google: '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
};

// ---------------------------------------------------------------- Dictation
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const dictation = { id: null, rec: null };
const DICTATION_LANGS = [['', 'Device language'], ['en-US', 'English'], ['ms-MY', 'Bahasa Melayu']];

function stopDictation() {
    if (dictation.rec) { try { dictation.rec.stop(); } catch (e) { } }
    dictation.id = null; dictation.rec = null;
    document.querySelectorAll('.mic.on').forEach((b) => b.classList.remove('on'));
}

function startDictation(el) {
    const id = el.dataset.id, key = el.dataset.k, obj = scopeObj(el);
    if (dictation.id === id) { stopDictation(); return; }
    stopDictation();
    const field = document.getElementById(id);
    const rec = new SR();
    rec.lang = prefs.lang || navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    const base = (obj[key] || '').replace(/\s+$/, '');
    let finalText = '';
    rec.onresult = (ev) => {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
        }
        const spoken = (finalText + interim).trim();
        const value = base ? `${base} ${spoken}` : spoken.charAt(0).toUpperCase() + spoken.slice(1);
        obj[key] = value;
        const f = document.getElementById(id);
        if (f) f.value = value;
        if (obj === ui.capture) saveDraft();
    };
    rec.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') toast('Allow microphone access to dictate');
        else if (ev.error === 'network') toast('Dictation needs a connection');
        else if (ev.error !== 'no-speech' && ev.error !== 'aborted') toast('Dictation stopped');
    };
    rec.onend = () => { if (dictation.rec === rec) stopDictation(); };
    try { rec.start(); } catch (e) { toast('Couldn’t start dictation'); return; }
    dictation.id = id; dictation.rec = rec;
    el.classList.add('on');
    if (field) field.focus({ preventScroll: true });
    buzz();
}

const buzz = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

// Unsaved capture text survives the phone locking, the tab being discarded, or a reload.
const draftKey = () => `esoes:draft:${ui.user?.uid}:${ui.ws}`;
let draftTimer;
function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { try { localStorage.setItem(draftKey(), JSON.stringify(ui.capture)); } catch (e) { } }, 250);
}
function loadDraft() {
    try { const d = JSON.parse(localStorage.getItem(draftKey()) || 'null'); return d && typeof d === 'object' ? d : null; } catch (e) { return null; }
}
const clearDraft = () => { clearTimeout(draftTimer); try { localStorage.removeItem(draftKey()); } catch (e) { } };

ui.online = navigator.onLine;
window.addEventListener('online', () => { ui.online = true; refreshSync(); toast('Back online — syncing'); });
window.addEventListener('offline', () => { ui.online = false; refreshSync(); toast('Offline — notes are kept on this phone'); });

// ---------------------------------------------------------------- Render
function render() {
    applyTheme();
    if (!ui.ready) return;
    const focus = captureFocus();
    if (!ui.user) { root.innerHTML = viewLogin(); sheetRoot.innerHTML = ''; return; }
    if (!ui.capture) ui.capture = { ...blankCapture(), ...(loadDraft() || {}) };
    const views = { capture: viewCapture, feedback: viewFeedback, sessions: viewSessions, dashboard: viewDashboard, settings: viewSettings };
    const body = ui.loading ? '<div class="boot" style="min-height:50vh"><span class="spinner"></span></div>' : views[ui.tab]();
    const fab = ui.tab !== 'capture' ? `<button class="fab" data-a="quick-capture" aria-label="Capture feedback">${I.plus}</button>` : '';
    root.innerHTML = `<div class="shell">${viewSide()}<main class="content">${wsBar()}<div class="offline ${ui.online ? 'hidden' : ''}" data-offline>Offline — notes are saved on this phone and sync when you’re back online.</div>${body}</main></div>${fab}${viewTabbar()}${datalists()}`;
    document.body.classList.toggle('on-capture', ui.tab === 'capture');
    renderSheet();
    restoreFocus(focus);
}

function captureFocus() {
    const el = document.activeElement;
    if (!el || !el.id) return null;
    return { id: el.id, start: el.selectionStart, end: el.selectionEnd };
}
function restoreFocus(f) {
    if (!f) return;
    const el = document.getElementById(f.id);
    if (!el) return;
    el.focus({ preventScroll: true });
    try { if (f.start != null) el.setSelectionRange(f.start, f.end); } catch (e) { }
}

const NAV = [['capture', 'Capture'], ['feedback', 'Feedback'], ['sessions', 'Sessions'], ['dashboard', 'Dashboard'], ['settings', 'Settings']];

function viewSide() {
    const openCount = feedback.filter(isOpen).length;
    const u = ui.user;
    return `<aside class="side">
        <div class="brand"><img src="assets/icon.svg" alt=""><span>eSOEs Review<small>Feedback tracker</small></span></div>
        ${wsSwitch()}
        ${NAV.map(([id, label]) => `<button class="nav-btn ${ui.tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${I[id]}<span>${label}</span>
            ${id === 'feedback' && openCount ? `<span class="count">${openCount}</span>` : ''}${id === 'sessions' && sessions.length ? `<span class="count">${sessions.length}</span>` : ''}</button>`).join('')}
        <button class="me" data-a="tab" data-id="settings">${avatar(u)}<span><b>${esc(u.name)}</b><small><span data-syncdot class="dot ${syncClass()}"></span><span data-synctext>${syncText()}</span></small></span></button>
    </aside>`;
}
const isOwner = () => shared() && ui.wsDoc && ui.wsDoc.owner === ui.user.uid;
const memberList = () => Object.entries(ui.wsDoc?.members || {}).map(([id, m]) => ({ id, ...m })).sort((a, b) => (a.role === 'owner' ? -1 : 0) - (b.role === 'owner' ? -1 : 0) || a.joinedAt - b.joinedAt);

function wsSwitch() {
    const n = shared() ? memberList().length : 0;
    return `<button class="ws-switch" data-a="workspaces"><span class="ws-ico ${shared() ? 'shared' : ''}">${shared() ? I.users : I.lock}</span>
        <span class="grow"><b>${esc(workspaceName(ui.ws))}</b><small>${shared() ? `${fmtCode(ui.ws)} · ${n} member${n === 1 ? '' : 's'}` : 'Private to you'}</small></span>${I.chev}</button>`;
}
// Compact workspace switcher shown on small screens (the sidebar is hidden there).
const wsBar = () => `<div class="ws-bar">${wsSwitch()}</div>`;

const avatar = (u) => `<span class="avatar">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc((u.name || '?')[0])}</span>`;

function viewTabbar() {
    return `<nav class="tabbar">${NAV.map(([id, label]) => `<button class="${ui.tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${I[id]}<span>${label}</span></button>`).join('')}</nav>`;
}

function datalists() {
    const attendees = [...new Set(sessions.flatMap((s) => (s.attendees || '').split('\n').map((x) => x.trim()).filter(Boolean)))];
    const raisers = [...new Set([...attendees, ...feedback.map((f) => f.raisedBy).filter(Boolean)])];
    const dl = (id, items) => `<datalist id="${id}">${items.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
    return dl('dl-entities', config.entities) + dl('dl-modules', config.modules) + dl('dl-owners', config.owners) + dl('dl-people', raisers);
}

function viewLogin() {
    return `<div class="login"><div class="box">
        <img src="assets/icon.svg" alt="">
        <h1>eSOEs Review Notes</h1>
        <p>Capture, organise and follow up user feedback from system review sessions.</p>
        ${ui.joinCode ? `<div class="invite">You’ve been invited to a shared workspace <b>${esc(fmtCode(normCode(ui.joinCode)))}</b>. Sign in to join.</div>` : ''}
        <button class="gbtn" data-a="login" ${ui.loginBusy ? 'disabled' : ''}>${I.google}<span>${ui.loginBusy ? 'Signing in…' : 'Sign in with Google'}</span></button>
        ${ui.loginError ? `<p class="err">${esc(ui.loginError)}</p>` : ''}
        <div class="features">
            <div>📝 <span><b>Fast capture</b> during sessions — entity and session pre-filled, <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to save.</span></div>
            <div>🔁 <span><b>Legacy vs new</b> — record how it works today and what users expect.</span></div>
            <div>📊 <span><b>Track to closure</b> — status, owner, due date, follow-ups and a dashboard per entity.</span></div>
            <div>🖨️ <span><b>Session minutes</b> — print or export to Excel (CSV).</span></div>
        </div>
    </div></div>`;
}

// ---------- Capture
function blankCapture(keep = {}) {
    return {
        entity: activeSession()?.entity || '', module: '', raisedBy: '', type: 'issue', priority: 'medium',
        title: '', details: '', legacy: '', expected: '', tags: '', ...keep
    };
}

function chipsHtml(list, current, action, scope) {
    return `<div class="chips">${list.map((x) => `<button type="button" class="${current === x.id ? 'on' : ''}" style="--c:${x.c}" data-a="${action}" data-scope="${scope}" data-v="${x.id}"${x.hint ? ` title="${esc(x.hint)}"` : ''}><i></i>${esc(x.label)}</button>`).join('')}</div>`;
}

// Text field with an optional dictation button (Web Speech API, where the browser supports it).
function micField(tag, id, key, scope, value, attrs) {
    const listening = dictation.id === id;
    const mic = SR ? `<button type="button" class="mic ${listening ? 'on' : ''}" data-a="dictate" data-id="${id}" data-k="${key}" data-scope="${scope}" aria-label="${listening ? 'Stop dictation' : 'Dictate'}">${I.mic}</button>` : '';
    const field = tag === 'textarea'
        ? `<textarea class="textarea" id="${id}" data-scope="${scope}" data-bind="${key}" ${attrs}>${esc(value)}</textarea>`
        : `<input class="input title" id="${id}" data-scope="${scope}" data-bind="${key}" value="${esc(value)}" ${attrs}>`;
    return `<div class="with-mic">${field}${mic}</div>`;
}

function viewCapture() {
    const s = activeSession(), d = ui.capture;
    const inSession = s ? feedback.filter((f) => f.sessionId === s.id).sort((a, b) => b.createdAt - a.createdAt) : [];
    const recent = s ? inSession : feedback.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 12);
    const showLegacy = d.type === 'gap' || d.type === 'change' || d.legacy || d.expected;
    const ctxOpen = ui.ctxOpen || !d.entity;
    return `<div class="page-head"><div><h1>Capture feedback</h1><p>Log points as users raise them. Everything syncs to your Google account.</p></div></div>
        <div class="card session-bar">
            <span class="live ${s ? '' : 'off'}"></span>
            <div class="grow">${s ? `<b>${esc(s.title || 'Review session')}</b><span class="muted small">${fmtDate(s.date)}${s.entity ? ' · ' + esc(s.entity) : ''} · ${inSession.length} point${inSession.length === 1 ? '' : 's'} captured</span>`
            : '<b>No active session</b><span class="muted small">Start or pick a session so feedback is grouped for minutes.</span>'}</div>
            <select class="select" id="active-session" data-change="active-session" aria-label="Active session">
                <option value="">— No session —</option>
                ${sessions.map((x) => `<option value="${x.id}" ${x.id === ui.activeSessionId ? 'selected' : ''}>${esc(sessionLabel(x))}</option>`).join('')}
            </select>
            <button class="btn" data-a="new-session" aria-label="New session">${I.plus}<span class="hide-sm"> New session</span></button>
        </div>
        <div class="grid2">
            <form class="card pad capture" id="capture-form" autocomplete="off" onsubmit="return false">
                <div class="ctx ${ctxOpen ? 'open' : ''}">
                    <button type="button" class="ctx-summary" data-a="toggle-ctx" aria-expanded="${ctxOpen}">
                        <span class="grow"><b>${esc(d.entity || 'Choose entity')}</b><small>${esc(d.module || 'Any module')} · ${esc(d.raisedBy || 'Raised by —')}</small></span>
                        <span class="ctx-edit">${ctxOpen ? 'Done' : 'Change'}</span>
                    </button>
                    <div class="ctx-fields">
                        <div class="row wrap">
                            <div class="field"><label for="c-entity">Entity</label><input class="input" id="c-entity" list="dl-entities" data-scope="capture" data-bind="entity" value="${esc(d.entity)}" placeholder="Which entity?" enterkeyhint="next"></div>
                            <div class="field"><label for="c-module">Module / screen</label><input class="input" id="c-module" list="dl-modules" data-scope="capture" data-bind="module" value="${esc(d.module)}" placeholder="e.g. Reports" enterkeyhint="next"></div>
                        </div>
                        <div class="field"><label for="c-raised">Raised by</label><input class="input" id="c-raised" list="dl-people" data-scope="capture" data-bind="raisedBy" value="${esc(d.raisedBy)}" placeholder="Name / role (optional)" enterkeyhint="next"></div>
                    </div>
                </div>
                <div class="field"><label for="c-title">Feedback</label>${micField('input', 'c-title', 'title', 'capture', d.title, 'placeholder="What did they say?" maxlength="200" enterkeyhint="done"')}</div>
                <div class="field">${micField('textarea', 'c-details', 'details', 'capture', d.details, 'placeholder="Details, steps, examples… (optional)"')}</div>
                <div class="field"><span class="lbl">Type</span>${chipsHtml(TYPES, d.type, 'pick-type', 'capture')}</div>
                <div class="field"><span class="lbl">Priority</span>${chipsHtml(PRIORITIES, d.priority, 'pick-priority', 'capture')}</div>
                <details class="more" ${showLegacy ? 'open' : ''}><summary>＋ Legacy vs new system</summary>
                    <div class="row wrap" style="margin-top:10px">
                        <div class="field"><label for="c-legacy">How it works in the legacy system</label>${micField('textarea', 'c-legacy', 'legacy', 'capture', d.legacy, 'placeholder="Current / legacy behaviour"')}</div>
                        <div class="field"><label for="c-expected">Expected in the new system</label>${micField('textarea', 'c-expected', 'expected', 'capture', d.expected, 'placeholder="Requirement / expected behaviour"')}</div>
                    </div>
                </details>
                <div class="field"><label for="c-tags">Tags</label><input class="input" id="c-tags" data-scope="capture" data-bind="tags" value="${esc(d.tags)}" placeholder="Comma separated, e.g. UAT, phase 2"></div>
                <div class="capture-foot"><span class="muted small hide-sm"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save</span>
                    <div class="save-actions"><button type="button" class="btn" data-a="clear-capture">Clear</button><button type="button" class="btn primary lg" data-a="save-capture">${I.check} Save feedback</button></div></div>
            </form>
            <div>
                <div class="section-title"><span>${s ? 'Captured this session' : 'Recently captured'}</span>${s ? `<button class="btn" data-a="open-session" data-id="${s.id}">Minutes</button>` : ''}</div>
                <div class="card">${recent.length ? `<div class="items">${recent.map(itemRow).join('')}</div>` : '<div class="empty"><p>Nothing captured yet.</p></div>'}</div>
            </div>
        </div>`;
}

function itemRow(f) {
    const s = sessionById(f.sessionId);
    const overdue = f.due && f.due < todayKey() && isOpen(f);
    return `<button class="item" data-a="open-feedback" data-id="${f.id}">
        <span class="ref">${esc(f.ref)}</span>
        <span class="t">${esc(f.title)}</span>
        <span>${badge(byId(STATUSES, f.status))}</span>
        <span class="meta">
            ${f.entity ? `<span class="pill-entity">${esc(f.entity)}</span>` : ''}
            ${f.module ? `<span class="sep">${esc(f.module)}</span>` : ''}
            ${badge(byId(TYPES, f.type))}${badge(byId(PRIORITIES, f.priority))}
            ${f.raisedBy ? `<span>${esc(f.raisedBy)}</span>` : ''}
            ${f.owner ? `<span class="sep">Owner: ${esc(f.owner)}</span>` : ''}
            ${f.due ? `<span class="sep" style="${overdue ? 'color:var(--danger);font-weight:700' : ''}">Due ${fmtDate(f.due)}</span>` : ''}
            ${(f.comments || []).length ? `<span class="sep">💬 ${f.comments.length}</span>` : ''}
            ${s && ui.tab !== 'capture' ? `<span class="sep">${esc(fmtDate(s.date))}</span>` : ''}
            ${shared() && f.createdBy ? `<span class="sep">✍️ ${esc(f.createdBy.name.split(' ')[0])}</span>` : ''}
        </span>
    </button>`;
}

// ---------- Feedback list
function filtered() {
    const F = ui.filters, q = F.q.trim().toLowerCase();
    let list = feedback.filter((f) =>
        (!F.entity || f.entity === F.entity) && (!F.module || f.module === F.module) && (!F.type || f.type === F.type) &&
        (!F.priority || f.priority === F.priority) && (!F.session || f.sessionId === F.session) &&
        (!F.status || (F.status === 'open*' ? isOpen(f) : F.status === 'closed*' ? !isOpen(f) : f.status === F.status)) &&
        (!q || [f.ref, f.title, f.details, f.legacy, f.expected, f.entity, f.module, f.raisedBy, f.owner, (f.tags || []).join(' '), ...(f.comments || []).map((c) => c.text)]
            .join(' ').toLowerCase().includes(q)));
    const pr = (f) => PRIORITIES.findIndex((p) => p.id === f.priority);
    const sorters = {
        newest: (a, b) => b.createdAt - a.createdAt,
        oldest: (a, b) => a.createdAt - b.createdAt,
        priority: (a, b) => pr(a) - pr(b) || b.createdAt - a.createdAt,
        due: (a, b) => (a.due || '9999').localeCompare(b.due || '9999'),
        updated: (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    };
    return list.sort(sorters[F.sort] || sorters.newest);
}

function filterSelect(key, label, options) {
    return `<select class="select" id="f-${key}" data-change="filter" data-k="${key}" aria-label="${label}">
        <option value="">${label}</option>${options.map(([v, l]) => `<option value="${esc(v)}" ${ui.filters[key] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}

function viewFeedback() {
    const list = filtered(), F = ui.filters;
    const active = ['entity', 'module', 'type', 'priority', 'session'].some((k) => F[k]) || F.q || F.status !== 'open*';
    const nFilters = ['entity', 'module', 'type', 'priority', 'session'].filter((k) => F[k]).length + (F.status !== 'open*' ? 1 : 0) + (F.group !== 'none' ? 1 : 0);
    let body;
    if (!list.length) {
        body = `<div class="empty"><h3>${feedback.length ? 'No matching feedback' : 'No feedback yet'}</h3><p>${feedback.length ? 'Try clearing some filters.' : 'Capture the first point from your review session.'}</p>
            ${feedback.length ? '<button class="btn" data-a="clear-filters">Clear filters</button>' : '<button class="btn primary" data-a="tab" data-id="capture">Capture feedback</button>'}</div>`;
    } else if (F.group !== 'none') {
        const keyOf = { entity: (f) => f.entity || '(No entity)', module: (f) => f.module || '(No module)', status: (f) => byId(STATUSES, f.status).label, type: (f) => byId(TYPES, f.type).label, priority: (f) => byId(PRIORITIES, f.priority).label }[F.group];
        const groups = new Map();
        list.forEach((f) => { const k = keyOf(f); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
        body = [...groups].map(([k, items]) => `<div class="group-head"><span>${esc(k)}</span><span class="muted">${items.length}</span></div><div class="items">${items.map(itemRow).join('')}</div>`).join('');
    } else {
        body = `<div class="items">${list.map(itemRow).join('')}</div>`;
    }
    return `<div class="page-head"><div><h1>Feedback</h1><p>${list.length} of ${feedback.length} item${feedback.length === 1 ? '' : 's'}</p></div>
            <div class="actions hide-sm"><button class="btn" data-a="export-csv" data-scope="filtered">${I.download} Export view (CSV)</button><button class="btn primary" data-a="tab" data-id="capture">${I.plus} Capture</button></div></div>
        <div class="card">
            <div class="toolbar">
                <div class="search">${I.search}<input class="input" id="f-q" type="search" data-scope="filters" data-bind="q" value="${esc(F.q)}" placeholder="Search ref, text, people, tags…"></div>
                <button class="btn filter-toggle ${ui.showFilters ? 'on' : ''}" data-a="toggle-filters">${I.filter} Filters${nFilters ? ` (${nFilters})` : ''}</button>
                <div class="filters ${ui.showFilters ? 'open' : ''}">
                ${filterSelect('status', 'Any status', [['open*', 'All open'], ['closed*', 'All closed'], ...STATUSES.map((s) => [s.id, s.label])])}
                ${filterSelect('entity', 'All entities', config.entities.map((e) => [e, e]))}
                ${filterSelect('module', 'All modules', config.modules.map((m) => [m, m]))}
                ${filterSelect('type', 'All types', TYPES.map((t) => [t.id, t.label]))}
                ${filterSelect('priority', 'All priorities', PRIORITIES.map((p) => [p.id, p.label]))}
                ${filterSelect('session', 'All sessions', sessions.map((s) => [s.id, sessionLabel(s)]))}
                <select class="select" id="f-group" data-change="filter" data-k="group" aria-label="Group by">
                    ${[['none', 'No grouping'], ['entity', 'Group: Entity'], ['module', 'Group: Module'], ['status', 'Group: Status'], ['type', 'Group: Type'], ['priority', 'Group: Priority']].map(([v, l]) => `<option value="${v}" ${F.group === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
                <select class="select" id="f-sort" data-change="filter" data-k="sort" aria-label="Sort">
                    ${[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['priority', 'Priority'], ['due', 'Due date'], ['updated', 'Recently updated']].map(([v, l]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
                ${active ? '<button class="btn" data-a="clear-filters">Reset</button>' : ''}
                </div>
            </div>
            ${body}
        </div>`;
}

// ---------- Sessions
function viewSessions() {
    return `<div class="page-head"><div><h1>Review sessions</h1><p>One session per meeting / workshop with an entity.</p></div>
            <div class="actions"><button class="btn primary" data-a="new-session">${I.plus} New session</button></div></div>
        ${sessions.length ? `<div class="sessions">${sessions.map((s) => {
            const items = feedback.filter((f) => f.sessionId === s.id);
            const open = items.filter(isOpen).length;
            const people = (s.attendees || '').split('\n').filter((x) => x.trim()).length;
            return `<button class="card session-card" data-a="open-session" data-id="${s.id}">
                <span class="date">${fmtDate(s.date)}${s.id === ui.activeSessionId ? ' · ● Active' : ''}</span>
                <h3>${esc(s.title || 'Review session')}</h3>
                <span class="muted small">${esc(s.entity || 'No entity')}${(s.modules || []).length ? ' · ' + esc(s.modules.join(', ')) : ''}</span>
                <span class="stats"><span><b>${items.length}</b> points</span><span><b>${open}</b> open</span><span><b>${people}</b> attendee${people === 1 ? '' : 's'}</span></span>
            </button>`;
        }).join('')}</div>`
        : `<div class="card empty"><h3>No sessions yet</h3><p>Create a session for each review meeting so feedback is grouped and you can print minutes afterwards.</p><button class="btn primary" data-a="new-session">Create first session</button></div>`}`;
}

// ---------- Dashboard
function viewDashboard() {
    if (!feedback.length) return `<div class="page-head"><div><h1>Dashboard</h1></div></div><div class="card empty"><h3>No data yet</h3><p>Capture feedback to see the breakdown by entity, module and status.</p></div>`;
    const open = feedback.filter(isOpen);
    const urgent = open.filter((f) => f.priority === 'critical' || f.priority === 'high');
    const closed = feedback.length - open.length;
    const today = todayKey();
    const overdue = open.filter((f) => f.due && f.due < today).sort((a, b) => a.due.localeCompare(b.due));

    const entities = [...new Set(feedback.map((f) => f.entity || '(No entity)'))].sort();
    const matrix = `<div class="matrix-wrap"><table class="matrix"><thead><tr><th>Entity</th>${STATUSES.map((s) => `<th>${s.label}</th>`).join('')}<th>Total</th></tr></thead><tbody>
        ${entities.map((e) => {
            const rows = feedback.filter((f) => (f.entity || '(No entity)') === e);
            return `<tr><td><b>${esc(e)}</b></td>${STATUSES.map((s) => {
                const n = rows.filter((f) => f.status === s.id).length;
                return n ? `<td><button data-a="drill" data-entity="${esc(e)}" data-status="${s.id}">${n}</button></td>` : '<td class="zero">·</td>';
            }).join('')}<td><button data-a="drill" data-entity="${esc(e)}" data-status="">${rows.length}</button></td></tr>`;
        }).join('')}
        <tr class="total"><td>Total</td>${STATUSES.map((s) => `<td>${feedback.filter((f) => f.status === s.id).length || '·'}</td>`).join('')}<td>${feedback.length}</td></tr>
        </tbody></table></div>`;

    const bars = (keyFn, labels, drillKey) => {
        const counts = new Map();
        open.forEach((f) => { const k = keyFn(f); counts.set(k, (counts.get(k) || 0) + 1); });
        const max = Math.max(1, ...counts.values());
        const rows = labels ? labels.map((l) => [l.id, counts.get(l.id) || 0, l]) : [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, null]);
        return `<div class="hbars">${rows.filter((r) => r[1]).map(([k, n, l]) => `<button class="hbar" data-a="drill" data-${drillKey}="${esc(k)}" data-status="open*">
            <span class="lab">${esc(l ? l.label : k)}</span><span class="track"><i style="width:${n / max * 100}%;--c:${l ? l.c : 'var(--brand)'}"></i></span><b>${n}</b></button>`).join('') || '<p class="muted small">No open items.</p>'}</div>`;
    };

    return `<div class="page-head"><div><h1>Dashboard</h1><p>${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}</p></div>
            <div class="actions"><button class="btn" data-a="export-csv" data-scope="all">${I.download} Export all (CSV)</button></div></div>
        <div class="tiles">
            <div class="card tile"><b>${feedback.length}</b><span>Total feedback</span></div>
            <div class="card tile"><b>${open.length}</b><span>Open</span></div>
            <div class="card tile"><b style="color:${urgent.length ? '#dc2626' : 'inherit'}">${urgent.length}</b><span>Critical / high open</span></div>
            <div class="card tile"><b>${Math.round(closed / feedback.length * 100)}%</b><span>Closed</span></div>
        </div>
        <div class="section-title">Entity × status</div>
        <div class="card">${matrix}</div>
        <div class="grid2" style="margin-top:4px">
            <div><div class="section-title">Open by module</div><div class="card pad">${bars((f) => f.module || '(No module)', null, 'module')}</div></div>
            <div><div class="section-title">Open by type</div><div class="card pad">${bars((f) => f.type, TYPES, 'type')}</div>
                <div class="section-title">Open by priority</div><div class="card pad">${bars((f) => f.priority, PRIORITIES, 'priority')}</div></div>
        </div>
        ${overdue.length ? `<div class="section-title">Overdue (${overdue.length})</div><div class="card"><div class="items">${overdue.map(itemRow).join('')}</div></div>` : ''}`;
}

// ---------- Settings
function viewSettings() {
    const u = ui.user;
    const list = (key, label, hint) => `<div class="field"><label for="s-${key}">${label}</label>
        <textarea class="textarea" id="s-${key}" data-list="${key}" rows="6" placeholder="${hint}">${esc(config[key].join('\n'))}</textarea></div>`;
    return `<div class="page-head"><div><h1>Settings</h1><p>${shared() ? `Settings for <b>${esc(workspaceName(ui.ws))}</b>. Pick lists are shared with all members.` : 'Pick lists are shared across capture, filters and the dashboard.'}</p></div></div>
        <div class="grid2">
            <div class="card pad">
                <div class="section-title">Pick lists <span class="muted" style="text-transform:none;letter-spacing:0">One per line</span></div>
                ${list('entities', 'Entities', 'One entity per line')}
                ${list('modules', 'Modules / screens', 'One module per line')}
                ${list('owners', 'Owners (follow-up PICs)', 'One person / team per line')}
                <button class="btn primary" data-a="save-lists">Save lists</button>
            </div>
            <div>
                <div class="card pad" style="margin-bottom:16px">${shareCard()}</div>
                <div class="card pad">
                    <div class="section-title">Account</div>
                    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">${avatar(u)}<div><b>${esc(u.name)}</b><div class="muted small">${esc(u.email || '')}</div>
                        <div class="muted small"><span data-syncdot class="dot ${syncClass()}"></span> <span data-synctext>${syncText()}</span></div></div></div>
                    <span class="lbl">Theme</span>
                    <div class="chips" style="margin-bottom:16px">${['system', 'light', 'dark'].map((t) => `<button class="${prefs.theme === t ? 'on' : ''}" data-a="theme" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
                    ${SR ? `<span class="lbl">Dictation language</span>
                    <div class="chips" style="margin-bottom:16px">${DICTATION_LANGS.map(([v, l]) => `<button class="${(prefs.lang || '') === v ? 'on' : ''}" data-a="dict-lang" data-v="${v}">${l}</button>`).join('')}</div>` : ''}
                    <button class="btn" data-a="logout">Sign out</button>
                </div>
                <div class="card pad" style="margin-top:16px">
                    <div class="section-title">Data</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px">
                        <button class="btn" data-a="export-csv" data-scope="all">${I.download} Export all to CSV (Excel)</button>
                        <button class="btn" data-a="export-json">${I.download} Backup (JSON)</button>
                        <button class="btn" data-a="import-json">Restore backup</button>
                    </div>
                    <p class="muted small" style="margin-top:12px">${feedback.length} feedback items · ${sessions.length} sessions. Stored in Firestore under your Google account only.</p>
                </div>
            </div>
        </div>`;
}

// ---------------------------------------------------------------- Sheets
function openSheet(sheet, draft) { ui.sheet = sheet; ui.draft = draft; renderSheet(); }
function closeSheet() { if (dictation.id && !dictation.id.startsWith('c-')) stopDictation(); ui.sheet = null; ui.draft = null; sheetRoot.innerHTML = ''; document.body.style.overflow = ''; }

function renderSheet() {
    if (!ui.sheet) { sheetRoot.innerHTML = ''; document.body.style.overflow = ''; return; }
    if (ui.sheet.type === 'feedback' && !feedback.some((f) => f.id === ui.draft.id) && !ui.sheet.isNew) { closeSheet(); return; }
    const focus = captureFocus();
    const prev = sheetRoot.querySelector('.sheet');
    const scroll = prev ? prev.scrollTop : 0;
    const views = { feedback: sheetFeedback, session: sheetSession, workspaces: sheetWorkspaces };
    sheetRoot.innerHTML = `<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true">${views[ui.sheet.type]()}</div></div>`;
    const sheet = sheetRoot.querySelector('.sheet');
    if (prev) { sheet.style.animation = 'none'; sheetRoot.querySelector('.scrim').style.animation = 'none'; }
    sheet.scrollTop = scroll;
    document.body.style.overflow = 'hidden';
    restoreFocus(focus);
}

function sheetFeedback() {
    const d = ui.draft;
    return `<div class="sheet-head"><div><span class="ref">${esc(d.ref)} · ${fmtTime(d.createdAt)}${d.createdBy && shared() ? ' · by ' + esc(d.createdBy.name) : ''}</span><h2>Feedback</h2></div>
            <button class="icon-btn" data-a="close" aria-label="Close">${I.close}</button></div>
        <div class="field"><span class="lbl">Status</span>${chipsHtml(STATUSES, d.status, 'pick-status', 'sheet')}</div>
        <div class="field"><label for="d-title">Summary</label><input class="input title" id="d-title" data-scope="sheet" data-bind="title" value="${esc(d.title)}" maxlength="200"></div>
        <div class="field"><label for="d-details">Details</label>${micField('textarea', 'd-details', 'details', 'sheet', d.details, '')}</div>
        <div class="row wrap">
            <div class="field"><label for="d-legacy">Legacy system</label><textarea class="textarea" id="d-legacy" data-scope="sheet" data-bind="legacy">${esc(d.legacy)}</textarea></div>
            <div class="field"><label for="d-expected">Expected in new system</label><textarea class="textarea" id="d-expected" data-scope="sheet" data-bind="expected">${esc(d.expected)}</textarea></div>
        </div>
        <div class="row wrap">
            <div class="field"><label for="d-entity">Entity</label><input class="input" id="d-entity" list="dl-entities" data-scope="sheet" data-bind="entity" value="${esc(d.entity)}"></div>
            <div class="field"><label for="d-module">Module</label><input class="input" id="d-module" list="dl-modules" data-scope="sheet" data-bind="module" value="${esc(d.module)}"></div>
        </div>
        <div class="field"><span class="lbl">Type</span>${chipsHtml(TYPES, d.type, 'pick-type', 'sheet')}</div>
        <div class="field"><span class="lbl">Priority</span>${chipsHtml(PRIORITIES, d.priority, 'pick-priority', 'sheet')}</div>
        <div class="row wrap">
            <div class="field"><label for="d-raised">Raised by</label><input class="input" id="d-raised" list="dl-people" data-scope="sheet" data-bind="raisedBy" value="${esc(d.raisedBy)}"></div>
            <div class="field"><label for="d-owner">Owner / PIC</label><input class="input" id="d-owner" list="dl-owners" data-scope="sheet" data-bind="owner" value="${esc(d.owner)}"></div>
            <div class="field"><label for="d-due">Due date</label><input class="input" id="d-due" type="date" data-scope="sheet" data-bind="due" value="${esc(d.due)}"></div>
        </div>
        <div class="row wrap">
            <div class="field"><label for="d-session">Session</label><select class="select" id="d-session" data-scope="sheet" data-bind="sessionId">
                <option value="">— None —</option>${sessions.map((s) => `<option value="${s.id}" ${s.id === d.sessionId ? 'selected' : ''}>${esc(sessionLabel(s))}</option>`).join('')}</select></div>
            <div class="field"><label for="d-tags">Tags</label><input class="input" id="d-tags" data-scope="sheet" data-bind="tagsText" value="${esc(d.tagsText)}" placeholder="Comma separated"></div>
        </div>
        <div class="section-title">Follow-ups (${(d.comments || []).length})</div>
        <div class="comments">${(d.comments || []).map((c) => `<div class="comment"><small><span>${c.by ? `<b>${esc(c.by)}</b> · ` : ''}${fmtTime(c.at)}</span>${!c.byUid || c.byUid === ui.user.uid || isOwner() ? `<button class="small muted" data-a="del-comment" data-id="${c.id}">Remove</button>` : ''}</small><p>${esc(c.text)}</p></div>`).join('')}</div>
        <div class="field">${micField('textarea', 'd-comment', 'commentText', 'sheet', d.commentText || '', 'style="min-height:64px" placeholder="Add a follow-up note, decision or response…"')}
            <button class="btn" style="margin-top:8px" data-a="add-comment">Add follow-up</button></div>
        ${(d.history || []).length ? `<div class="section-title">History</div><div class="history">${d.history.slice().reverse().map((h) => `<span>${fmtTime(h.at)}${h.by ? ' · ' + esc(h.by) : ''} — ${esc(h.text)}</span>`).join('')}</div>` : ''}
        <div class="sheet-actions"><button class="btn danger" data-a="del-feedback">Delete</button>
            <div style="display:flex;gap:8px"><button class="btn" data-a="close">Cancel</button><button class="btn primary" data-a="save-feedback">Save changes</button></div></div>`;
}

function sheetSession() {
    const d = ui.draft, isNew = !sessionById(d.id);
    const items = feedback.filter((f) => f.sessionId === d.id).sort((a, b) => a.createdAt - b.createdAt);
    return `<div class="sheet-head"><h2>${isNew ? 'New review session' : 'Review session'}</h2><button class="icon-btn" data-a="close" aria-label="Close">${I.close}</button></div>
        ${isNew ? '' : `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
            ${d.id === ui.activeSessionId ? '<span class="badge" style="--c:#16a34a">● Active session</span>' : '<button class="btn primary" data-a="activate-session">Capture in this session</button>'}
            <button class="btn" data-a="print-session">${I.print} Print minutes</button>
            <button class="btn" data-a="export-csv" data-scope="session">${I.download} CSV</button></div>`}
        <div class="field"><label for="s-title">Title</label><input class="input title" id="s-title" data-scope="sheet" data-bind="title" value="${esc(d.title)}" placeholder="e.g. Finance module walkthrough"></div>
        <div class="row wrap">
            <div class="field"><label for="s-date">Date</label><input class="input" type="date" id="s-date" data-scope="sheet" data-bind="date" value="${esc(d.date)}"></div>
            <div class="field"><label for="s-entity">Entity</label><input class="input" id="s-entity" list="dl-entities" data-scope="sheet" data-bind="entity" value="${esc(d.entity)}" placeholder="Entity reviewed"></div>
        </div>
        <div class="field"><label for="s-venue">Venue / mode</label><input class="input" id="s-venue" data-scope="sheet" data-bind="venue" value="${esc(d.venue)}" placeholder="e.g. Meeting room 3 / Teams"></div>
        <div class="field"><span class="lbl">Modules covered</span><div class="chips">${config.modules.map((m) => `<button class="${(d.modules || []).includes(m) ? 'on' : ''}" data-a="toggle-module" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
        <div class="field"><label for="s-att">Attendees</label><textarea class="textarea" id="s-att" data-scope="sheet" data-bind="attendees" placeholder="One per line — Name, role / department">${esc(d.attendees)}</textarea></div>
        <div class="field"><label for="s-notes">General notes / minutes</label>${micField('textarea', 's-notes', 'notes', 'sheet', d.notes, 'style="min-height:120px" placeholder="Agenda, overall impressions, decisions, next steps…"')}</div>
        ${isNew ? '' : `<div class="section-title">Feedback captured (${items.length})</div><div class="card">${items.length ? `<div class="items">${items.map(itemRow).join('')}</div>` : '<div class="empty"><p>None yet.</p></div>'}</div>`}
        <div class="sheet-actions">${isNew ? '<span></span>' : '<button class="btn danger" data-a="del-session">Delete session</button>'}
            <div style="display:flex;gap:8px"><button class="btn" data-a="close">Cancel</button><button class="btn primary" data-a="save-session">${isNew ? 'Create & start capturing' : 'Save'}</button></div></div>`;
}

// ---------- Sharing
function shareCard() {
    if (!shared()) {
        return `<div class="section-title">Sharing</div>
            <p class="muted small" style="margin-bottom:12px">This is your <b>Personal</b> workspace — only you can see it. Create a shared workspace to get a code other developers can join.</p>
            <button class="btn primary" data-a="workspaces">${I.users} Share with others</button>`;
    }
    const w = ui.wsDoc || {}, owner = isOwner();
    return `<div class="section-title"><span>Sharing</span>${owner ? '<span class="badge" style="--c:#16a34a">Owner</span>' : ''}</div>
        <div class="code-box">
            <div><span class="lbl">Workspace code</span><div class="code">${fmtCode(ui.ws)}</div></div>
            <div class="code-actions"><button class="btn" data-a="copy-code">${I.copy} Copy code</button><button class="btn primary" data-a="copy-link">${I.copy} Copy invite link</button></div>
        </div>
        <p class="muted small" style="margin:10px 0 14px">Anyone who signs in with Google and enters this code${w.joinOpen ? '' : ' <b>(joining is currently closed)</b>'} can view and edit everything in this workspace.</p>
        ${owner ? `<label class="switch"><input type="checkbox" data-change="join-open" ${w.joinOpen ? 'checked' : ''}><span>Allow new people to join with the code</span></label>` : ''}
        <div class="section-title">Members (${memberList().length})</div>
        <div class="members">${memberList().map((m) => `<div class="member">${avatar(m)}<span class="grow"><b>${esc(m.name)}${m.id === ui.user.uid ? ' (you)' : ''}</b><small>${esc(m.email || '')}</small></span>
            ${m.role === 'owner' ? '<span class="badge" style="--c:#16a34a">Owner</span>' : owner ? `<button class="btn" data-a="remove-member" data-id="${m.id}">Remove</button>` : '<span class="muted small">Member</span>'}</div>`).join('')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
            ${owner ? '<button class="btn" data-a="rename-ws">Rename</button><button class="btn danger" data-a="delete-ws">Delete workspace</button>' : '<button class="btn danger" data-a="leave-ws">Leave workspace</button>'}
        </div>`;
}

function sheetWorkspaces() {
    const d = ui.draft;
    const row = (code, name, sub, icon) => `<button class="ws-row ${ui.ws === code ? 'on' : ''}" data-a="switch-ws" data-id="${code}">
        <span class="ws-ico ${code === 'personal' ? '' : 'shared'}">${icon}</span><span class="grow"><b>${esc(name)}</b><small>${sub}</small></span>${ui.ws === code ? '<span class="badge" style="--c:#16a34a">Current</span>' : ''}</button>`;
    const hasPersonal = !shared() && (feedback.length || sessions.length);
    return `<div class="sheet-head"><h2>Workspaces</h2><button class="icon-btn" data-a="close" aria-label="Close">${I.close}</button></div>
        <div class="ws-list">
            ${row('personal', 'Personal', 'Private to you', I.lock)}
            ${prefs.workspaces.map((w) => row(w.code, w.name, `Shared · ${fmtCode(w.code)}`, I.users)).join('')}
        </div>
        <div class="section-title">Join with a code</div>
        <div class="card pad">
            <p class="muted small" style="margin-bottom:10px">Got a code from a colleague? Enter it to see and add to their notes.</p>
            <div class="row"><input class="input code-input" id="w-join" data-scope="sheet" data-bind="joinCode" value="${esc(d.joinCode)}" placeholder="XXXX-XXXX" maxlength="9" autocomplete="off" autocapitalize="characters" data-enter="join-ws">
                <button class="btn primary" style="flex:none" data-a="join-ws" ${d.busy ? 'disabled' : ''}>Join</button></div>
        </div>
        <div class="section-title">Create a shared workspace</div>
        <div class="card pad">
            <p class="muted small" style="margin-bottom:10px">You’ll get a code to share with other developers. Everyone in it can capture and update feedback in real time.</p>
            <div class="field"><input class="input" id="w-name" data-scope="sheet" data-bind="name" value="${esc(d.name)}" placeholder="e.g. eSOEs UAT — Phase 1" maxlength="60" data-enter="create-ws"></div>
            ${hasPersonal ? `<label class="switch" style="margin-bottom:12px"><input type="checkbox" data-change="copy-personal" ${d.copy ? 'checked' : ''}><span>Copy my personal notes into it (${feedback.length} feedback, ${sessions.length} sessions)</span></label>` : ''}
            <button class="btn primary" data-a="create-ws" ${d.busy ? 'disabled' : ''}>${d.busy ? 'Creating…' : 'Create & get code'}</button>
        </div>
        ${shared() ? `<div class="section-title">Current workspace</div><div class="card pad">${shareCard()}</div>` : ''}`;
}

async function copyText(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch (e) { prompt('Copy this:', text); }
}

// ---------------------------------------------------------------- Export / print
function toCsv(items) {
    const cols = [
        ['Ref', (f) => f.ref], ['Captured', (f) => new Date(f.createdAt).toLocaleString()], ['Session date', (f) => sessionById(f.sessionId)?.date || ''],
        ['Session', (f) => sessionById(f.sessionId)?.title || ''], ['Entity', (f) => f.entity], ['Module', (f) => f.module], ['Raised by', (f) => f.raisedBy],
        ['Type', (f) => byId(TYPES, f.type).label], ['Priority', (f) => byId(PRIORITIES, f.priority).label], ['Status', (f) => byId(STATUSES, f.status).label],
        ['Summary', (f) => f.title], ['Details', (f) => f.details], ['Legacy system', (f) => f.legacy], ['Expected in new system', (f) => f.expected],
        ['Owner', (f) => f.owner], ['Due', (f) => f.due], ['Tags', (f) => (f.tags || []).join(', ')],
        ['Follow-ups', (f) => (f.comments || []).map((c) => `[${new Date(c.at).toLocaleDateString()}] ${c.text}`).join('\n')]
    ];
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return '﻿' + [cols.map((c) => cell(c[0])).join(','), ...items.map((f) => cols.map((c) => cell(c[1](f))).join(','))].join('\r\n');
}

function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function printSession(s) {
    const items = feedback.filter((f) => f.sessionId === s.id).sort((a, b) => (a.module || '').localeCompare(b.module || '') || a.createdAt - b.createdAt);
    const byModule = new Map();
    items.forEach((f) => { const k = f.module || 'General'; if (!byModule.has(k)) byModule.set(k, []); byModule.get(k).push(f); });
    document.getElementById('print-root').innerHTML = `
        <h1>${esc(s.title || 'Review session')} — minutes</h1>
        <div class="meta">${fmtDate(s.date)}${s.entity ? ' · Entity: ' + esc(s.entity) : ''}${s.venue ? ' · ' + esc(s.venue) : ''} · ${items.length} feedback point(s)</div>
        ${s.attendees ? `<h2>Attendees</h2><div class="notes">${esc(s.attendees)}</div>` : ''}
        ${s.notes ? `<h2>General notes</h2><div class="notes">${esc(s.notes)}</div>` : ''}
        ${[...byModule].map(([m, list]) => `<h2>${esc(m)}</h2><table><thead><tr><th style="width:8%">Ref</th><th style="width:30%">Feedback</th><th>Legacy / Expected</th><th style="width:11%">Type</th><th style="width:9%">Priority</th><th style="width:12%">Raised by</th><th style="width:10%">Status</th></tr></thead><tbody>
            ${list.map((f) => `<tr><td>${esc(f.ref)}</td><td><b>${esc(f.title)}</b>${f.details ? `<div class="notes">${esc(f.details)}</div>` : ''}</td>
                <td>${f.legacy ? `<div class="notes"><b>Legacy:</b> ${esc(f.legacy)}</div>` : ''}${f.expected ? `<div class="notes"><b>Expected:</b> ${esc(f.expected)}</div>` : ''}</td>
                <td>${esc(byId(TYPES, f.type).label)}</td><td>${esc(byId(PRIORITIES, f.priority).label)}</td><td>${esc(f.raisedBy)}</td><td>${esc(byId(STATUSES, f.status).label)}</td></tr>`).join('')}
            </tbody></table>`).join('')}`;
    window.print();
}

// ---------------------------------------------------------------- Actions
async function saveCapture() {
    const d = ui.capture;
    if (!d.title.trim() && !d.details.trim()) { toast('Write the feedback first'); document.getElementById('c-title')?.focus(); return; }
    const ws = ui.ws;
    stopDictation();
    ui.capture = blankCapture({ entity: d.entity, module: d.module, raisedBy: d.raisedBy, tags: d.tags });
    ui.ctxOpen = false;
    clearDraft();
    buzz(20);
    render();
    if (!matchMedia('(max-width: 860px)').matches) document.getElementById('c-title')?.focus();
    const { seq, ref: refNo } = await allocRef();
    if (ui.ws !== ws) return;
    const f = {
        id: uid(), seq, ref: refNo, sessionId: ui.activeSessionId || '', createdBy: me(),
        entity: d.entity.trim(), module: d.module.trim(), raisedBy: d.raisedBy.trim(),
        type: d.type, priority: d.priority, status: 'open',
        title: d.title.trim() || d.details.trim().split('\n')[0].slice(0, 120), details: d.details.trim(),
        legacy: d.legacy.trim(), expected: d.expected.trim(), owner: '', due: '',
        tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean),
        comments: [], history: [], createdAt: Date.now()
    };
    feedback.push(f);
    saveFeedback(f);
    const changed = remember('entities', f.entity) | remember('modules', f.module);
    if (changed) saveConfig();
    render();
    toast(`${f.ref} saved`);
}

function saveDraftFeedback() {
    const d = ui.draft;
    const prev = feedback.find((f) => f.id === d.id);
    if (!d.title.trim()) { toast('Summary can’t be empty'); return; }
    const f = { ...d, title: d.title.trim(), tags: d.tagsText.split(',').map((t) => t.trim()).filter(Boolean) };
    delete f.tagsText; delete f.commentText;
    const hist = [...(f.history || [])];
    const at = Date.now();
    if (prev) {
        if (prev.status !== f.status) hist.push({ at, by: ui.user.name, text: `Status: ${byId(STATUSES, prev.status).label} → ${byId(STATUSES, f.status).label}` });
        if (prev.priority !== f.priority) hist.push({ at, by: ui.user.name, text: `Priority: ${byId(PRIORITIES, prev.priority).label} → ${byId(PRIORITIES, f.priority).label}` });
        if ((prev.owner || '') !== (f.owner || '')) hist.push({ at, by: ui.user.name, text: `Owner: ${f.owner || '—'}` });
    }
    f.history = hist;
    Object.assign(prev || {}, f);
    if (!prev) feedback.push(f);
    saveFeedback(f);
    const changed = remember('entities', f.entity) | remember('modules', f.module) | remember('owners', f.owner);
    if (changed) saveConfig();
    closeSheet(); render(); toast(`${f.ref} updated`);
}

const A = {
    tab: (el) => { stopDictation(); ui.tab = el.dataset.id; closeSheet(); render(); window.scrollTo(0, 0); },
    login,
    logout: () => { if (confirm('Sign out?')) signOut(auth); },
    theme: (el) => { prefs.theme = el.dataset.v; applyTheme(); savePrefs(); render(); },
    close: () => closeSheet(),
    scrim: (el, e) => { if (e.target === el) closeSheet(); },

    'pick-type': (el) => { scopeObj(el).type = el.dataset.v; el.dataset.scope === 'sheet' ? renderSheet() : render(); },
    'pick-priority': (el) => { scopeObj(el).priority = el.dataset.v; el.dataset.scope === 'sheet' ? renderSheet() : render(); },
    'pick-status': (el) => { ui.draft.status = el.dataset.v; renderSheet(); },
    'save-capture': saveCapture,

    workspaces: () => openSheet({ type: 'workspaces' }, { joinCode: '', name: '', copy: false, busy: false }),
    'switch-ws': (el) => { if (el.dataset.id !== ui.ws) openWorkspace(el.dataset.id); else closeSheet(); },
    'join-ws': async () => {
        const code = normCode(ui.draft.joinCode);
        if (prefs.workspaces.some((w) => w.code === code)) { openWorkspace(code); return; }
        ui.draft.busy = true; renderSheet();
        const ok = await joinWorkspace(code);
        if (!ok && ui.draft) { ui.draft.busy = false; renderSheet(); }
    },
    'create-ws': async () => {
        const name = ui.draft.name.trim();
        if (!name) { toast('Give the workspace a name'); document.getElementById('w-name')?.focus(); return; }
        ui.draft.busy = true; renderSheet();
        try {
            const code = await createWorkspace(name, ui.draft.copy);
            ui.tab = 'settings'; render();
            toast(`Workspace created — code ${fmtCode(code)}`);
        } catch (e) {
            console.error(e);
            toast(e.code === 'permission-denied' ? 'Couldn’t create — Firestore rules need updating' : 'Couldn’t create workspace');
            if (ui.draft) { ui.draft.busy = false; renderSheet(); }
        }
    },
    'copy-code': () => copyText(fmtCode(ui.ws), 'Code copied'),
    'copy-link': () => copyText(`Join our eSOEs review notes: ${inviteLink(ui.ws)}  (code ${fmtCode(ui.ws)})`, 'Invite link copied'),
    'remove-member': (el) => {
        const m = (ui.wsDoc.members || {})[el.dataset.id];
        if (!m || !confirm(`Remove ${m.name} from this workspace? They lose access immediately.`)) return;
        track(updateDoc(wsRef(ui.ws), { [`members.${el.dataset.id}`]: deleteField() }));
    },
    'rename-ws': () => {
        const name = prompt('Workspace name', ui.wsDoc.name);
        if (name && name.trim()) track(updateDoc(wsRef(ui.ws), { name: name.trim() }));
    },
    'leave-ws': async () => {
        if (!confirm('Leave this workspace? You’ll need the code again to rejoin.')) return;
        const code = ui.ws;
        try {
            await updateDoc(wsRef(code), { [`members.${ui.user.uid}`]: deleteField() });
            forgetWorkspace(code);
            openWorkspace('personal');
        } catch (e) { console.error(e); toast('Couldn’t leave — check your connection'); }
    },
    'delete-ws': async () => {
        if (prompt(`This permanently deletes all ${feedback.length} feedback items and ${sessions.length} sessions for every member.\n\nType DELETE to confirm.`) !== 'DELETE') return;
        const code = ui.ws;
        try {
            const refs = [];
            for (const c of ['sessions', 'feedback', 'meta']) (await getDocs(collection(db, 'esoes_workspaces', code, c))).forEach((d) => refs.push(d.ref));
            for (let i = 0; i < refs.length; i += 400) {
                const batch = writeBatch(db);
                refs.slice(i, i + 400).forEach((r) => batch.delete(r));
                await batch.commit();
            }
            dataUnsubs.forEach((u) => u()); dataUnsubs = [];
            await deleteDoc(wsRef(code));
            forgetWorkspace(code);
            openWorkspace('personal');
            toast('Workspace deleted');
        } catch (e) { console.error(e); toast('Couldn’t delete workspace'); }
    },
    'clear-capture': () => {
        const d = ui.capture;
        if ((d.title.trim() || d.details.trim()) && !confirm('Clear what you’ve typed?')) return;
        stopDictation(); clearDraft();
        ui.capture = blankCapture({ entity: d.entity, module: d.module, raisedBy: d.raisedBy }); render();
    },
    'toggle-ctx': () => {
        const open = document.querySelector('.ctx')?.classList.contains('open');
        ui.ctxOpen = !open || !ui.capture.entity.trim();
        render();
        if (ui.ctxOpen) document.getElementById('c-entity')?.focus();
    },
    dictate: (el) => startDictation(el),
    'quick-capture': () => { ui.tab = 'capture'; closeSheet(); render(); window.scrollTo(0, 0); },
    'toggle-filters': () => { ui.showFilters = !ui.showFilters; render(); },
    'dict-lang': (el) => { prefs.lang = el.dataset.v; savePrefs(); render(); },

    'open-feedback': (el) => {
        const f = feedback.find((x) => x.id === el.dataset.id);
        if (!f) return;
        openSheet({ type: 'feedback' }, { owner: '', due: '', legacy: '', expected: '', details: '', raisedBy: '', comments: [], history: [], ...JSON.parse(JSON.stringify(f)), tagsText: (f.tags || []).join(', ') });
    },
    'save-feedback': saveDraftFeedback,
    'add-comment': () => {
        const text = (ui.draft.commentText || '').trim();
        if (!text) return;
        stopDictation();
        ui.draft.commentText = '';
        const prev = feedback.find((f) => f.id === ui.draft.id);
        const c = { id: uid(), at: Date.now(), by: ui.user.name, byUid: ui.user.uid, text };
        buzz();
        ui.draft.comments = [...(ui.draft.comments || []), c];
        if (prev) { prev.comments = [...(prev.comments || []), c]; saveFeedback(prev); }
        renderSheet(); toast('Follow-up added');
    },
    'del-comment': (el) => {
        if (!confirm('Remove this follow-up?')) return;
        const prev = feedback.find((f) => f.id === ui.draft.id);
        ui.draft.comments = ui.draft.comments.filter((c) => c.id !== el.dataset.id);
        if (prev) { prev.comments = (prev.comments || []).filter((c) => c.id !== el.dataset.id); saveFeedback(prev); }
        renderSheet();
    },
    'del-feedback': () => {
        if (!confirm(`Delete ${ui.draft.ref}? This can’t be undone.`)) return;
        const id = ui.draft.id;
        feedback = feedback.filter((f) => f.id !== id);
        track(deleteDoc(ref('feedback', id)));
        closeSheet(); render(); toast('Deleted');
    },

    'new-session': () => openSheet({ type: 'session' }, { id: uid(), title: '', date: todayKey(), entity: '', venue: '', modules: [], attendees: '', notes: '', createdAt: Date.now() }),
    'open-session': (el) => {
        const s = sessionById(el.dataset.id);
        if (s) openSheet({ type: 'session' }, { venue: '', modules: [], attendees: '', notes: '', ...JSON.parse(JSON.stringify(s)) });
    },
    'toggle-module': (el) => {
        const m = el.dataset.v, list = ui.draft.modules || [];
        ui.draft.modules = list.includes(m) ? list.filter((x) => x !== m) : [...list, m];
        renderSheet();
    },
    'save-session': () => {
        const d = ui.draft, isNew = !sessionById(d.id);
        if (!d.title.trim() && !d.entity.trim()) { toast('Add a title or entity'); document.getElementById('s-title')?.focus(); return; }
        const s = { ...d, title: d.title.trim(), entity: d.entity.trim() };
        const i = sessions.findIndex((x) => x.id === s.id);
        if (i >= 0) sessions[i] = s; else sessions.unshift(s);
        saveSession(s);
        if (remember('entities', s.entity)) saveConfig();
        if (isNew) { setActive(s.id); ui.capture = blankCapture(); ui.tab = 'capture'; }
        closeSheet(); render();
        toast(isNew ? 'Session started — capture away' : 'Session saved');
        if (isNew) document.getElementById('c-title')?.focus();
    },
    'activate-session': () => {
        setActive(ui.draft.id);
        ui.capture = blankCapture();
        ui.tab = 'capture';
        closeSheet(); render(); document.getElementById('c-title')?.focus();
    },
    'del-session': () => {
        const n = feedback.filter((f) => f.sessionId === ui.draft.id).length;
        if (!confirm(`Delete this session?${n ? ` Its ${n} feedback item(s) are kept but unlinked.` : ''}`)) return;
        const id = ui.draft.id;
        sessions = sessions.filter((s) => s.id !== id);
        const batch = writeBatch(db);
        batch.delete(ref('sessions', id));
        feedback.filter((f) => f.sessionId === id).forEach((f) => { f.sessionId = ''; f.updatedAt = Date.now(); batch.set(ref('feedback', f.id), clean(f)); });
        track(batch.commit());
        if (ui.activeSessionId === id) setActive('');
        closeSheet(); render(); toast('Session deleted');
    },
    'print-session': () => { const s = sessionById(ui.draft.id); if (s) printSession(s); },

    'clear-filters': () => { ui.filters = { ...ui.filters, q: '', entity: '', module: '', type: '', priority: '', status: 'open*', session: '' }; render(); },
    drill: (el) => {
        ui.filters = { ...ui.filters, q: '', entity: '', module: '', type: '', priority: '', session: '', status: el.dataset.status ?? '' };
        for (const k of ['entity', 'module', 'type', 'priority']) if (el.dataset[k] != null) ui.filters[k] = el.dataset[k] === '(No entity)' || el.dataset[k] === '(No module)' ? '' : el.dataset[k];
        ui.tab = 'feedback'; render(); window.scrollTo(0, 0);
    },

    'save-lists': () => {
        for (const key of ['entities', 'modules', 'owners']) {
            const el = document.querySelector(`[data-list="${key}"]`);
            config[key] = [...new Set(el.value.split('\n').map((x) => x.trim()).filter(Boolean))];
        }
        saveConfig(); render(); toast('Lists saved');
    },
    'export-csv': (el) => {
        const scope = el.dataset.scope;
        let items = feedback, name = 'all';
        if (scope === 'filtered') { items = filtered(); name = 'filtered'; }
        if (scope === 'session') {
            const s = sessionById(ui.draft.id);
            items = feedback.filter((f) => f.sessionId === s.id);
            name = `${s.date}-${(s.entity || s.title || 'session').replace(/[^\w-]+/g, '_')}`;
        }
        if (scope !== 'filtered') items = items.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));
        download(`esoes-feedback-${name}-${todayKey()}.csv`, toCsv(items), 'text/csv;charset=utf-8');
    },
    'export-json': () => download(`esoes-review-backup-${todayKey()}.json`, JSON.stringify({ config, sessions, feedback }, null, 2), 'application/json'),
    'import-json': () => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.json,application/json';
        inp.onchange = async () => {
            try {
                const data = JSON.parse(await inp.files[0].text());
                if (!Array.isArray(data.feedback) || !Array.isArray(data.sessions)) throw new Error('bad file');
                if (!confirm(`Restore ${data.feedback.length} feedback items and ${data.sessions.length} sessions? Items with the same ID are overwritten.`)) return;
                const all = [...data.sessions.map((s) => ['sessions', s]), ...data.feedback.map((f) => ['feedback', f])];
                for (let i = 0; i < all.length; i += 400) {
                    const batch = writeBatch(db);
                    all.slice(i, i + 400).forEach(([c, o]) => batch.set(ref(c, o.id), clean(o)));
                    await track(batch.commit());
                }
                if (data.config) { config = { ...config, ...data.config }; saveConfig(); }
                toast('Backup restored');
            } catch (e) { console.error(e); toast('That file isn’t a valid backup'); }
        };
        inp.click();
    }
};

const scopeObj = (el) => (el.dataset.scope === 'sheet' ? ui.draft : el.dataset.scope === 'filters' ? ui.filters : ui.capture);

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { if (el.tagName === 'BUTTON') e.preventDefault(); fn(el, e); }
});

let searchTimer;
document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.bind) return;
    const obj = scopeObj(t);
    if (!obj) return;
    obj[t.dataset.bind] = t.value;
    if (obj === ui.capture) saveDraft();
    if (t.dataset.scope === 'filters') { clearTimeout(searchTimer); searchTimer = setTimeout(render, 120); }
});

document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.change === 'active-session') { setActive(t.value); render(); }
    else if (t.dataset.change === 'join-open') track(updateDoc(wsRef(ui.ws), { joinOpen: t.checked }));
    else if (t.dataset.change === 'copy-personal') { ui.draft.copy = t.checked; }
    else if (t.dataset.change === 'filter') { ui.filters[t.dataset.k] = t.value; render(); }
    else if (t.dataset.bind && t.tagName === 'SELECT') { const obj = scopeObj(t); if (obj) obj[t.dataset.bind] = t.value; }
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (ui.sheet?.type === 'feedback') saveDraftFeedback();
        else if (ui.sheet?.type === 'session') A['save-session']();
        else if (ui.tab === 'capture' && ui.user) saveCapture();
        return;
    }
    if (e.key === 'Escape' && ui.sheet) { closeSheet(); return; }
    if (e.key === 'Enter' && e.target.dataset?.enter && A[e.target.dataset.enter]) { e.preventDefault(); A[e.target.dataset.enter](e.target); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    if (e.key === '/' && !typing && ui.tab === 'feedback' && !ui.sheet) { e.preventDefault(); document.getElementById('f-q')?.focus(); }
});

window.addEventListener('beforeunload', (e) => {
    const d = ui.capture;
    if (d && (d.title.trim() || d.details.trim())) { e.preventDefault(); e.returnValue = ''; }
});
