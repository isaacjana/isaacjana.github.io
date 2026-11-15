/**
 * Ocean - data layer.
 *
 * One small API with two back ends:
 *   live: Firebase Auth + Firestore (loaded on demand)
 *   demo: everything kept in this browser's localStorage, so the whole flow
 *         can be tried, or shown to a customer, without an account.
 *
 * Collections: users, users/{uid}/customPrices, products, orders, invoices,
 *              tracking (public delivery tracking), ocean_settings
 */
import { firebaseConfig, DEFAULT_DEPOT } from './config.js';
import { newTrackCode } from './model.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.7.1/';
const MODE_KEY = 'ocean_mode';
const DEMO_DB = 'ocean_demo_db_v1';
const DEMO_USER = 'ocean_demo_user'; // kept per tab, so each tab can be a different person

const params = new URLSearchParams(location.search);
if (params.has('demo')) localStorage.setItem(MODE_KEY, params.get('demo') === '0' ? 'live' : 'demo');

export const isDemo = () => localStorage.getItem(MODE_KEY) === 'demo';

/* ------------------------------------------------------------------ */
/* Live back end (Firebase)                                            */
/* ------------------------------------------------------------------ */
let fb = null; // { fs, au, db, auth } once loaded

async function loadFirebase() {
    if (fb) return fb;
    const [appMod, fs, au] = await Promise.all([
        import(SDK + 'firebase-app.js'),
        import(SDK + 'firebase-firestore.js'),
        import(SDK + 'firebase-auth.js')
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    const db = fs.initializeFirestore(app, { ignoreUndefinedProperties: true });
    fb = { fs, au, db, auth: au.getAuth(app) };
    return fb;
}

const colRef = (path) => fb.fs.collection(fb.db, ...path.split('/'));
const docRef = (path, id) => fb.fs.doc(fb.db, ...path.split('/'), id);

const live = {
    async init() { await loadFirebase(); },
    onAuth(cb) {
        return fb.au.onAuthStateChanged(fb.auth, (u) => cb(u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' } : null));
    },
    async signIn() {
        const provider = new fb.au.GoogleAuthProvider();
        try {
            await fb.au.signInWithPopup(fb.auth, provider);
        } catch (e) {
            // Pop-ups are often blocked inside installed web apps: fall back to a full-page sign-in
            if (/popup-blocked|operation-not-supported/.test(e.code || '')) return fb.au.signInWithRedirect(fb.auth, provider);
            throw e;
        }
    },
    signOut() { return fb.au.signOut(fb.auth); },
    watch(path, cb, where) {
        const q = where ? fb.fs.query(colRef(path), fb.fs.where(...where)) : colRef(path);
        return fb.fs.onSnapshot(q,
            (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
            (err) => cb([], err));
    },
    watchDoc(path, id, cb) {
        return fb.fs.onSnapshot(docRef(path, id),
            (d) => cb(d.exists() ? { id: d.id, ...d.data() } : null),
            (err) => cb(null, err));
    },
    async get(path, id) {
        const d = await fb.fs.getDoc(docRef(path, id));
        return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    async add(path, data) { readDemo(); return (await fb.fs.addDoc(colRef(path), data)).id; },
    set(path, id, data) { return fb.fs.setDoc(docRef(path, id), data, { merge: true }); },
    update(path, id, data) { return fb.fs.updateDoc(docRef(path, id), data); },
    remove(path, id) { return fb.fs.deleteDoc(docRef(path, id)); },
    inc(path, id, field, delta) { return fb.fs.updateDoc(docRef(path, id), { [field]: fb.fs.increment(delta) }); },
    async nextNumber(name) {
        const ref = docRef('ocean_settings', 'counters');
        const year = new Date().getFullYear();
        return fb.fs.runTransaction(fb.db, async (tx) => {
            const cur = ((await tx.get(ref)).data() || {})[name] || {};
            const n = cur.year === year ? (cur.n || 0) + 1 : 1;
            tx.set(ref, { [name]: { year, n } }, { merge: true });
            return n;
        });
    }
};

/* ------------------------------------------------------------------ */
/* Demo back end (localStorage)                                        */
/* ------------------------------------------------------------------ */
// Several tabs share this data (supplier, driver, customer), so every write
// re-reads the stored copy first instead of trusting what this tab has in memory.
const listeners = new Set();
let demoDb = null;
const authListeners = new Set();

function readDemo() {
    try { demoDb = JSON.parse(localStorage.getItem(DEMO_DB)); } catch (e) { demoDb = null; }
    if (!demoDb) { demoDb = seedDemo(); writeDemo(); }
    return demoDb;
}
function writeDemo() { localStorage.setItem(DEMO_DB, JSON.stringify(demoDb)); }
function notify() { listeners.forEach((fn) => fn()); }
const table = (path) => (demoDb[path] = demoDb[path] || {});
const match = (doc, where) => {
    if (!where) return true;
    const [field, op, value] = where;
    return op === 'in' ? value.includes(doc[field]) : doc[field] === value;
};
const rows = (path, where) => Object.entries(table(path)).map(([id, d]) => ({ id, ...d })).filter((d) => match(d, where));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Another tab changed the data (e.g. the driver's tab moved): reload and re-render
window.addEventListener('storage', (e) => {
    if (e.key === DEMO_DB && isDemo()) { readDemo(); notify(); }
});

const demo = {
    async init() { readDemo(); },
    onAuth(cb) {
        authListeners.add(cb);
        const id = sessionStorage.getItem(DEMO_USER);
        const u = id && table('users')[id];
        setTimeout(() => cb(u ? { uid: id, name: u.name, email: u.email, photoURL: '' } : null), 0);
        return () => authListeners.delete(cb);
    },
    async signIn(userId) {
        sessionStorage.setItem(DEMO_USER, userId);
        const u = table('users')[userId];
        authListeners.forEach((cb) => cb({ uid: userId, name: u.name, email: u.email, photoURL: '' }));
    },
    async signOut() {
        sessionStorage.removeItem(DEMO_USER);
        authListeners.forEach((cb) => cb(null));
    },
    watch(path, cb, where) {
        const fn = () => cb(rows(path, where));
        listeners.add(fn); setTimeout(fn, 0);
        return () => listeners.delete(fn);
    },
    watchDoc(path, id, cb) {
        const fn = () => { const d = table(path)[id]; cb(d ? { id, ...d } : null); };
        listeners.add(fn); setTimeout(fn, 0);
        return () => listeners.delete(fn);
    },
    async get(path, id) { const d = table(path)[id]; return d ? { id, ...d } : null; },
    async add(path, data) { readDemo(); const id = uid(); table(path)[id] = clean(data); writeDemo(); notify(); return id; },
    async set(path, id, data) { readDemo(); table(path)[id] = { ...(table(path)[id] || {}), ...clean(data) }; writeDemo(); notify(); },
    async update(path, id, data) {
        readDemo();
        if (!table(path)[id]) throw new Error('Record not found');
        Object.assign(table(path)[id], clean(data)); writeDemo(); notify();
    },
    async remove(path, id) { readDemo(); delete table(path)[id]; writeDemo(); notify(); },
    async inc(path, id, field, delta) {
        readDemo();
        const d = table(path)[id]; if (!d) return;
        d[field] = Math.round(((Number(d[field]) || 0) + delta) * 100) / 100; writeDemo(); notify();
    },
    async nextNumber(name) {
        readDemo();
        const c = table('ocean_settings').counters = table('ocean_settings').counters || {};
        const year = new Date().getFullYear();
        const cur = c[name] || {};
        c[name] = { year, n: cur.year === year ? cur.n + 1 : 1 };
        writeDemo();
        return c[name].n;
    }
};
const clean = (o) => JSON.parse(JSON.stringify(o));

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
const be = () => (isDemo() ? demo : live);

export const store = {
    init: () => be().init(),
    onAuth: (cb) => be().onAuth(cb),
    signIn: (demoUserId) => be().signIn(demoUserId),
    signOut: () => be().signOut(),
    watch: (path, cb, where) => be().watch(path, cb, where),
    watchDoc: (path, id, cb) => be().watchDoc(path, id, cb),
    get: (path, id) => be().get(path, id),
    add: (path, data) => be().add(path, data),
    set: (path, id, data) => be().set(path, id, data),
    update: (path, id, data) => be().update(path, id, data),
    remove: (path, id) => be().remove(path, id),
    inc: (path, id, field, delta) => be().inc(path, id, field, delta),
    /** Next invoice number, e.g. INV-2026-00042. Never blocks an order: falls back to a time-based number. */
    async nextInvoiceNo() {
        const year = new Date().getFullYear();
        try {
            return `INV-${year}-${String(await be().nextNumber('invoice')).padStart(5, '0')}`;
        } catch (e) {
            console.warn('Invoice counter unavailable, using a time-based number', e);
            return `INV-${year}-T${Date.now().toString(36).toUpperCase()}`;
        }
    },
    setMode(mode) { localStorage.setItem(MODE_KEY, mode); },
    resetDemo() { localStorage.removeItem(DEMO_DB); sessionStorage.removeItem(DEMO_USER); }
};

export const DEMO_USERS = [
    { id: 'demo_admin', role: 'admin', label: 'Supplier (admin)', hint: 'Quote, pack, assign drivers, invoice' },
    { id: 'demo_client', role: 'client', label: 'Customer (restaurant)', hint: 'Order live seafood and track delivery' },
    { id: 'demo_driver', role: 'driver', label: 'Driver', hint: 'Pick up jobs and share live location' }
];

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */
function seedDemo() {
    const now = Date.now();
    const H = 3600000;
    const today = new Date().toISOString().slice(0, 10);
    const P = (id, name, icon, price, unit, quantity, lowAt) => [id, { name, icon, price, unit, quantity, lowAt, active: true }];
    const products = Object.fromEntries([
        P('p_prawn', 'Tiger Prawn (L)', '🦐', 45, 'kg', 25, 5),
        P('p_crab', 'Sarawak Mud Crab', '🦀', 85, 'kg', 12, 4),
        P('p_seabass', 'Live Seabass', '🐟', 35, 'kg', 18, 5),
        P('p_lobster', 'Rock Lobster', '🦞', 180, 'kg', 4, 3),
        P('p_grouper', 'Red Grouper', '🐠', 95, 'kg', 9, 3),
        P('p_clam', 'Bamboo Clam', '🐚', 28, 'kg', 30, 8),
        P('p_squid', 'Fresh Squid', '🦑', 32, 'kg', 0, 5)
    ]);
    const sri = { clientId: 'demo_client', clientName: 'Aminah Yusof', storeName: 'Restoran Sri Sarawak', phone: '+60 12-888 1234', tin: 'C20881234050', deliveryAddress: 'Lot 456, Jalan Padungan, 93100 Kuching, Sarawak', dest: { lat: 1.5571, lng: 110.3531 } };
    const top = { clientId: 'demo_client2', clientName: 'Mr Lim', storeName: 'Top Spot Seafood', phone: '+60 16-555 9876', tin: '', deliveryAddress: 'Jalan Bukit Mata Kuching, 93100 Kuching, Sarawak', dest: { lat: 1.5562, lng: 110.3497 } };
    const line = (id, qty, extra) => ({ id, name: products[id].name, unit: products[id].unit, price: products[id].price, qty, ...extra });
    const order = (n, base, status, items, more) => ({
        orderNo: `OC-DEMO-${n}`, trackCode: newTrackCode(), status, items, deliveryFee: 8, sstRate: 0,
        slot: { date: today, window: '2pm - 5pm' }, notes: '', payment: { method: 'cod', status: 'unpaid' },
        timeline: [{ status: 'requested', at: now - 5 * H, by: base.clientName }], createdAt: now - 5 * H, updatedAt: now - H, ...base, ...more
    });
    return {
        ocean_settings: {
            business: {
                name: 'Ocean Fresh Sarawak Sdn Bhd', tin: 'C25845678900', msic: '46312', sstNo: '', phone: '+60 82-123 456',
                address: 'Lot 123, Jalan Bako, Kuching Port, 93050 Kuching, Sarawak', depot: { ...DEFAULT_DEPOT }, sstRate: 0, deliveryFee: 8
            },
            counters: { invoice: { year: new Date().getFullYear(), n: 0 } }
        },
        users: {
            demo_admin: { name: 'Isaac (Ocean HQ)', email: 'admin@ocean.demo', role: 'admin', phone: '+60 82-123 456' },
            demo_client: { name: sri.clientName, email: 'sri@ocean.demo', role: 'client', storeName: sri.storeName, phone: sri.phone, tin: sri.tin, address: sri.deliveryAddress, loc: sri.dest },
            demo_client2: { name: top.clientName, email: 'topspot@ocean.demo', role: 'client', storeName: top.storeName, phone: top.phone, address: top.deliveryAddress, loc: top.dest },
            demo_driver: { name: 'Jefri', email: 'jefri@ocean.demo', role: 'driver', phone: '+60 13-777 4321', vehicle: 'Toyota Hilux', plate: 'QAA 1234' }
        },
        'users/demo_client/customPrices': { p_prawn: { price: 42 } },
        products,
        orders: {
            o_demo1: order(1, top, 'requested', [line('p_crab', 3), line('p_clam', 5)], { notes: 'Crabs 500g and above please' }),
            o_demo2: order(2, sri, 'quoted', [line('p_prawn', 5, { price: 42, finalQty: 5.2, finalPrice: 42 }), line('p_seabass', 4, { finalQty: 4.4, finalPrice: 35 })], {
                timeline: [{ status: 'requested', at: now - 5 * H, by: sri.clientName }, { status: 'quoted', at: now - H, by: 'Isaac (Ocean HQ)' }]
            }),
            o_demo3: order(3, top, 'confirmed', [line('p_grouper', 2, { finalQty: 2.3, finalPrice: 95 }), line('p_lobster', 1, { finalQty: 1.1, finalPrice: 180 })], {
                timeline: [{ status: 'requested', at: now - 5 * H, by: top.clientName }, { status: 'quoted', at: now - 3 * H, by: 'Isaac (Ocean HQ)' }, { status: 'confirmed', at: now - 2 * H, by: top.clientName }]
            })
        },
        invoices: {},
        tracking: {}
    };
}
