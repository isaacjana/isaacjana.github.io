/**
 * Ocean - main app.
 * One mobile-first app for the three people in a delivery:
 *   supplier (admin): Today, Orders, Stock, Invoices, More
 *   customer (client): Shop, My orders, Account
 *   driver:            Jobs, Done, Account
 */
import { store, isDemo, DEMO_USERS } from './store.js';
import { DEFAULT_DEPOT } from './config.js';
import {
    STATUS, STEPS, ACTIVE, PAYMENT, rm, round2, itemQty, itemPrice, calcTotals, normaliseOrder, normaliseInvoice,
    summariseItems, trackingFromOrder, supplierFromSettings, timeAgo, fmtDateTime, fmtSlot, isToday, dayKey
} from './model.js';
import { makeMap, pin, route, geocode, getPosition, navLink } from './geo.js';
import {
    esc, $, toast, fail, openSheet, refreshSheets, closeAllSheets, ask, readForm, field, area, select, share, pickImage
} from './ui.js';
import * as flow from './flow.js';
import { tracker } from './flow.js';
import { createTrackView } from './trackview.js';
import * as extras from './extras.js';
import { LANGS, getLang, setLang, startI18n } from './i18n.js';

const SETTINGS_KEY = 'ocean_settings_local';
const DEFAULT_SETTINGS = { name: 'Ocean', tin: '', msic: '', sstNo: '', phone: '', address: '', depot: DEFAULT_DEPOT, sstRate: 0, deliveryFee: 0, cutoff: '', qr: '' };

const S = {
    user: null, profile: null, role: 'client', tab: '',
    products: [], orders: [], users: [], invoices: [], prices: {}, stockLog: [], plan: [],
    settings: { ...DEFAULT_SETTINGS, ...readLocal(SETTINGS_KEY) },
    cart: {}, q: '', orderFilter: 'active', invFilter: 'all',
    acting: null, actingPrices: {}        // supplier entering an order for a customer
};
flow.bindFlow(S);
extras.bindExtras(S, { render: () => render(), loadPdf: () => loadPdf(), trackUrl: (o) => trackUrl(o), priceList: (uid) => loadPrices(uid) });

const TABS = {
    admin: [['today', '🏠', 'Today'], ['orders', '📋', 'Orders'], ['stock', '🐟', 'Stock'], ['invoices', '🧾', 'Invoices'], ['more', '☰', 'More']],
    client: [['shop', '🛒', 'Shop'], ['orders', '📦', 'My orders'], ['account', '👤', 'Account']],
    driver: [['jobs', '🚚', 'Jobs'], ['history', '✅', 'Done'], ['account', '👤', 'Account']]
};
const ROLE_LABEL = { admin: 'Supplier', client: 'Customer', driver: 'Driver' };
const WINDOWS = ['As soon as possible', '9am - 12pm', '12pm - 3pm', '3pm - 6pm'];

function readLocal(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
const isAdmin = () => S.role === 'admin';
const byId = (list, id) => list.find((x) => x.id === id);
const depot = () => S.settings.depot || DEFAULT_DEPOT;
const telHref = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
const waHref = (p, text = '') => `https://wa.me/${String(p || '').replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const trackUrl = (o) => new URL(`track.html?c=${o.trackCode}${isDemo() ? '&demo=1' : ''}`, location.href).href;

/* ================================================================== */
/* Start-up, sign-in                                                   */
/* ================================================================== */
let unsubs = [];
let warnedDenied = false;

async function boot() {
    try {
        await store.init();
    } catch (e) {
        console.error(e);
        return drawGate('Ocean could not connect. Check your internet connection and reload, or try the demo.');
    }
    store.onAuth(onUser);
}

async function onUser(user) {
    unsubs.forEach((u) => u()); unsubs = [];
    tracker.stop();
    extras.resetAlerts(); planKey = ''; S.ordersReady = false;
    closeAllSheets();
    S.user = user;
    if (!user) { S.profile = null; $('#app').hidden = true; $('#gate').hidden = false; return drawGate(); }
    try {
        let profile = await store.get('users', user.uid);
        if (!profile || !profile.role) {
            // First time in Ocean: everyone starts as a customer; the supplier promotes staff and drivers
            const fresh = { name: (profile && profile.name) || user.name || '', email: user.email || '', role: 'client', oceanSince: Date.now() };
            await store.set('users', user.uid, fresh);
            profile = { id: user.uid, ...(profile || {}), ...fresh };
        }
        setProfile(profile);
    } catch (e) {
        console.error(e);
        return drawGate('Signed in, but your Ocean profile could not be loaded. The database rules may not allow it yet.');
    }
    $('#gate').hidden = true; $('#gate-box').innerHTML = ''; $('#app').hidden = false;
    S.tab = TABS[S.role][0][0];
    subscribe();
    render();
    if (location.hash === '#settings' && isAdmin()) openSettings();
    if (S.role !== 'admin' && !S.profile.phone) openProfile(true);
}

function setProfile(p) {
    S.profile = p;
    const role = String(p.role || 'client').toLowerCase();
    S.role = TABS[role] ? role : 'client';
}

function subscribe() {
    const uid = S.user.uid;
    const on = (path, where, apply, optional) => unsubs.push(store.watch(path, (rows, err) => {
        if (err) {
            console.error(path, err);
            if (!warnedDenied && !optional) { warnedDenied = true; toast(`Some data could not be loaded (${path}). The database rules may need updating.`, true); }
        }
        apply(rows);
        afterData();
    }, where));

    unsubs.push(store.watchDoc('users', uid, (p) => {
        if (!p) return;
        const before = S.role;
        setProfile(p);
        if (S.role !== before) { onUser(S.user); return; } // promoted or changed role: rebuild
        render();
    }));
    unsubs.push(store.watchDoc('ocean_settings', 'business', (doc) => {
        if (doc) { S.settings = { ...DEFAULT_SETTINGS, ...doc }; localStorage.setItem(SETTINGS_KEY, JSON.stringify(S.settings)); }
        afterData();
    }));
    on('products', null, (rows) => { S.products = rows.sort((a, b) => String(a.name).localeCompare(String(b.name))); });

    const orders = { a: null, b: null };
    const setOrders = () => {
        const seen = new Map();
        [...(orders.a || []), ...(orders.b || [])].forEach((o) => seen.set(o.id, normaliseOrder(o)));
        // Alerts only start once every order query has answered, so existing orders are not announced as new
        S.ordersReady = !!orders.a && (S.role !== 'driver' || !!orders.b);
        S.orders = [...seen.values()].sort((x, y) => y.createdAt - x.createdAt);
    };
    if (isAdmin()) {
        on('orders', null, (rows) => { orders.a = rows; setOrders(); });
        on('users', null, (rows) => { S.users = rows.filter((u) => TABS[String(u.role || '').toLowerCase()]).map((u) => ({ ...u, role: String(u.role).toLowerCase() })); });
        on('invoices', null, (rows) => { S.invoices = rows.map(normaliseInvoice).sort((x, y) => y.createdAt - x.createdAt); });
        on('ocean_stock_log', null, (rows) => { S.stockLog = rows.sort((x, y) => y.at - x.at); }, true);
    } else if (S.role === 'client') {
        on('orders', ['clientId', '==', uid], (rows) => { orders.a = rows; setOrders(); });
        on('invoices', ['clientId', '==', uid], (rows) => { S.invoices = rows.map(normaliseInvoice); });
        on(`users/${uid}/customPrices`, null, (rows) => { S.prices = Object.fromEntries(rows.map((r) => [r.id, Number(r.price)])); });
    } else {
        on('orders', ['status', 'in', ['ready', 'delivering']], (rows) => { orders.a = rows; setOrders(); });
        on('orders', ['driverId', '==', uid], (rows) => { orders.b = rows; setOrders(); });
    }
}

/** Runs after any data arrives. */
function afterData() {
    if (isAdmin()) flow.reconcileInvoices(S.orders, S.invoices);
    if (S.role === 'driver') {
        // Share location for everything on board. This also picks sharing back up after a reload.
        const live = S.orders.filter((o) => o.status === 'delivering' && o.driverId === S.user.uid);
        tracker.sync(live);
        planRun(live);
    }
    extras.checkAlerts();
    if (S.products.length) {
        if (isAdmin()) extras.runStanding(S.users.filter((u) => u.role === 'client'));
        else if (S.role === 'client') extras.runStanding([{ ...S.profile, id: S.user.uid }]);
    }
    render();
}

/** Order the driver's stops (nearest next) whenever the set of deliveries on board changes. */
let planKey = '';
function planRun(live) {
    const key = live.map((o) => o.id).sort().join();
    if (key === planKey) return;
    planKey = key;
    const planned = flow.planStops(tracker.last || depot(), live);
    S.plan = planned.map((o) => o.id);
    flow.saveStopOrder(planned);
}

function drawGate(error) {
    const box = $('#gate-box');
    const demo = isDemo();
    box.innerHTML = `
        <div class="logo-card"><img src="assets/logo.png" alt="Ocean" width="230" height="131"></div>
        <div><h1>Live seafood, delivered.</h1><p>Order, pack, track the driver live and invoice, all in one place.</p></div>
        ${error ? `<div class="notice bad">${esc(error)}</div>` : ''}
        ${demo ? `
            <p class="small bold">Demo mode: pick who you want to be</p>
            ${DEMO_USERS.map((u) => `<button class="btn line role" data-act="demoUser" data-id="${u.id}"><span>${u.label}</span><small>${u.hint}</small></button>`).join('')}
            <button class="btn white" data-act="leaveDemo">Use my real account</button>` : `
            <button class="btn white" data-act="signIn">Sign in with Google</button>
            <button class="btn line" data-act="enterDemo">Try the demo (no account)</button>`}
        <a class="btn line" href="track.html">📍 Track a delivery</a>
        ${langPicker('line')}`;
}

const langPicker = (cls = 'ghost') => `<label class="btn ${cls} block" style="gap:10px">🌐 <select data-lang aria-label="Language" style="background:none;border:0;font-weight:700;color:inherit">${LANGS.map(([id, name]) => `<option value="${id}" ${getLang() === id ? 'selected' : ''} style="color:#000">${name}</option>`).join('')}</select></label>`;

/* ================================================================== */
/* Rendering                                                           */
/* ================================================================== */
function render() {
    if (!S.profile) return;
    $('#who-name').textContent = S.profile.storeName || S.profile.name || S.user.email;
    $('#who-role').textContent = ROLE_LABEL[S.role];
    const bar = $('#demo-bar');
    bar.hidden = !isDemo();
    if (isDemo()) bar.textContent = 'Demo mode: nothing here is real, and it stays on this device.';
    drawGpsChip();

    const badges = {
        orders: isAdmin() ? S.orders.filter((o) => o.status === 'requested').length : S.orders.filter((o) => o.status === 'quoted').length,
        jobs: S.orders.filter((o) => o.status === 'ready' && (!o.driverId || o.driverId === S.user.uid)).length,
        stock: S.products.filter((p) => p.active !== false && Number(p.quantity) <= Number(p.lowAt ?? 0)).length
    };
    $('#tabs').innerHTML = TABS[S.role].map(([id, ico, label]) => `
        <button class="tab ${S.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}">
            <span class="ico">${ico}</span>${label}${badges[id] ? `<span class="badge">${badges[id]}</span>` : ''}
        </button>`).join('');

    // Keep the caret where it was if the user is typing in the view
    const active = document.activeElement;
    const keep = active && active.id && $('#view').contains(active) ? { id: active.id, pos: active.selectionStart } : null;
    $('#view').innerHTML = (VIEWS[S.tab] || VIEWS[TABS[S.role][0][0]])();
    if (keep) {
        const el = document.getElementById(keep.id);
        if (el) { el.focus(); try { el.setSelectionRange(keep.pos, keep.pos); } catch (e) { /* not a text input */ } }
    }
    refreshSheets();
}

function drawGpsChip() {
    const el = $('#gps-chip');
    if (!navigator.onLine) { el.innerHTML = '<span class="chip off">Offline</span>'; return; }
    if (S.role !== 'driver' || tracker.state === 'off') { el.innerHTML = ''; return; }
    el.innerHTML = tracker.state === 'on' ? '<span class="chip live">Sharing location</span>'
        : tracker.state === 'starting' ? '<span class="chip">Finding GPS…</span>'
            : '<button class="chip off" data-act="gpsHelp" style="border:0;cursor:pointer">Location off</button>';
}
tracker.onChange = () => { drawGpsChip(); refreshSheets(); if (S.tab === 'jobs') render(); };

const empty = (icon, text) => `<div class="empty"><span class="big">${icon}</span>${text}</div>`;
const pill = (status) => `<span class="pill ${STATUS[status].tone}">${STATUS[status].label}</span>`;
const thumb = (p) => `<div class="thumb">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${esc(p.icon || '🐟')}'))">` : esc(p.icon || '🐟')}</div>`;

function orderCard(o) {
    const todo = isAdmin()
        ? { requested: 'Weigh and quote', confirmed: 'Pack and assign a driver', ready: o.driverId ? '' : 'No driver yet' }[o.status]
        : S.role === 'client' ? { quoted: 'Review and accept the quote' }[o.status] : '';
    return `
        <div class="card tap stack tight ${todo ? 'flag' : ''}" data-act="order" data-id="${o.id}">
            <div class="head"><b class="clip">${esc(S.role === 'client' ? o.orderNo : o.storeName)}</b>${pill(o.status)}</div>
            <div class="small mute clip">${S.role === 'client' ? '' : esc(o.orderNo) + ' · '}${esc(fmtSlot(o.slot))}</div>
            <div class="small clip">${esc(summariseItems(o.items))}</div>
            <div class="head"><span class="bold num">${o.status === 'requested' ? 'Est. ' : ''}${rm(o.total)}</span>${todo ? `<span class="small bold" style="color:var(--brand)">${todo} ›</span>` : `<span class="tiny mute">${timeAgo(o.updatedAt || o.createdAt)}</span>`}</div>
        </div>`;
}

const VIEWS = {
    /* ---------------- Supplier ---------------- */
    today() {
        const count = (s) => S.orders.filter((o) => o.status === s).length;
        const road = S.orders.filter((o) => o.status === 'delivering');
        const doneToday = S.orders.filter((o) => o.status === 'delivered' && isToday(o.deliveredAt || o.updatedAt));
        const next = S.orders.filter((o) => ['requested', 'confirmed'].includes(o.status) || (o.status === 'ready' && !o.driverId)).reverse();
        const low = S.products.filter((p) => p.active !== false && Number(p.quantity) <= Number(p.lowAt ?? 0));
        const unpaid = S.invoices.filter((v) => v.status === 'unpaid');
        const hour = new Date().getHours();
        return `
            <div><h1>Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}</h1>
                <p class="mute small">${new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
            <div class="kpis">
                <button class="kpi ${count('requested') ? 'hot' : ''}" data-act="filter" data-id="requested"><b>${count('requested')}</b><span>To quote</span></button>
                <button class="kpi ${count('confirmed') ? 'hot' : ''}" data-act="filter" data-id="confirmed"><b>${count('confirmed')}</b><span>To pack</span></button>
                <button class="kpi" data-act="filter" data-id="road"><b>${count('ready') + road.length}</b><span>Packed / on the way</span></button>
                <button class="kpi" data-act="filter" data-id="delivered"><b class="num">${rm(doneToday.reduce((s, o) => s + o.total, 0)).replace('RM ', '')}</b><span>RM delivered today (${doneToday.length})</span></button>
            </div>
            ${road.length ? `<div class="card row"><div class="thumb">🚚</div><div class="grow"><b>${road.length} ${road.length === 1 ? 'delivery' : 'deliveries'} on the road</b><div class="small mute">Watch the drivers live</div></div><button class="btn sm" data-act="liveMap">Live map</button></div>` : ''}
            <div class="head"><h2>Needs you</h2><button class="btn sm soft" data-act="newOrder">＋ New order</button></div>
            <div class="list">${next.length ? next.map(orderCard).join('') : empty('✅', 'Nothing waiting. New orders will show up here.')}</div>
            ${low.length ? `<h2>Low stock</h2><div class="list">${low.map((p) => `
                <div class="card tap row" data-act="product" data-id="${p.id}">${thumb(p)}<div class="grow"><b class="clip">${esc(p.name)}</b><div class="small mute">${Number(p.quantity) <= 0 ? 'Out of stock' : `${p.quantity} ${esc(p.unit)} left`}</div></div><span class="pill ${Number(p.quantity) <= 0 ? 'bad' : 'warn'}">${Number(p.quantity) <= 0 ? 'Out' : 'Low'}</span></div>`).join('')}</div>` : ''}
            ${unpaid.length ? `<div class="card tap row" data-act="unpaid"><div class="thumb">🧾</div><div class="grow"><b>${unpaid.length} unpaid ${unpaid.length === 1 ? 'invoice' : 'invoices'}</b><div class="small mute">${rm(unpaid.reduce((s, v) => s + v.grandTotal, 0))} outstanding</div></div><span class="mute">›</span></div>` : ''}`;
    },

    orders() {
        if (!isAdmin()) return VIEWS.myOrders();
        const filters = [['active', 'Active'], ['requested', 'To quote'], ['quoted', 'Quoted'], ['confirmed', 'To pack'], ['road', 'On the way'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
        const f = S.orderFilter;
        const list = S.orders.filter((o) => f === 'active' ? ACTIVE.includes(o.status) : f === 'road' ? ['ready', 'delivering'].includes(o.status) : o.status === f);
        return `
            <div class="head"><h1>Orders</h1><button class="btn sm" data-act="newOrder">＋ New order</button></div>
            <div class="seg">${filters.map(([id, label]) => `<button class="${f === id ? 'on' : ''}" data-act="filter" data-id="${id}">${label}</button>`).join('')}</div>
            <div class="list">${list.length ? list.map(orderCard).join('') : empty('📋', 'No orders here.')}</div>`;
    },

    stock() {
        const reserved = reservedStock();
        return `
            <div class="head"><h1>Live stock</h1><div class="row"><button class="btn sm ghost" data-act="stockLog">History</button><button class="btn sm" data-act="product" data-id="">＋ Add</button></div></div>
            <p class="small mute">Stock leaves the tank when an order is packed. "Reserved" is promised to confirmed orders that are not packed yet.</p>
            <div class="list">${S.products.length ? S.products.map((p) => {
            const qty = Number(p.quantity) || 0, res = reserved[p.id] || 0;
            const state = p.active === false ? ['plain', 'Hidden'] : qty <= 0 ? ['bad', 'Out'] : qty <= Number(p.lowAt ?? 0) ? ['warn', 'Low'] : ['ok', 'In stock'];
            return `<div class="card tap row" data-act="product" data-id="${p.id}">${thumb(p)}
                    <div class="grow"><b class="clip">${esc(p.name)}</b><div class="small mute">${rm(p.price)} / ${esc(p.unit)}${res ? ` · ${round2(res)} reserved` : ''}</div></div>
                    <div class="right"><div class="bold num">${qty} ${esc(p.unit)}</div><span class="pill ${state[0]}">${state[1]}</span></div></div>`;
        }).join('') : empty('🐟', 'No products yet. Add what is in your tanks today.')}</div>`;
    },

    invoices() {
        const f = S.invFilter;
        const list = S.invoices.filter((v) => f === 'all' || v.status === f);
        const owed = S.invoices.filter((v) => v.status === 'unpaid').reduce((s, v) => s + v.grandTotal, 0);
        return `
            <div class="head"><h1>Invoices</h1><div class="row"><button class="btn sm ghost" data-act="statement">Statement</button><button class="btn sm soft" data-act="blankInvoice">＋ Blank</button></div></div>
            <div class="card row"><div class="grow"><div class="small mute">Outstanding</div><b class="num" style="font-size:22px">${rm(owed)}</b></div><div class="small mute right">An invoice is issued<br>when an order is packed</div></div>
            <div class="seg">${[['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid'], ['void', 'Void']].map(([id, label]) => `<button class="${f === id ? 'on' : ''}" data-act="invFilter" data-id="${id}">${label}</button>`).join('')}</div>
            <div class="list">${list.length ? list.map((v) => `
                <div class="card tap stack tight" data-act="invoice" data-id="${v.id}">
                    <div class="head"><b class="clip">${esc(v.buyer.name)}</b><span class="pill ${v.status === 'paid' ? 'ok' : v.status === 'void' ? 'plain' : 'warn'}">${v.status}</span></div>
                    <div class="head small"><span class="mute">${esc(v.invoiceNo)} · ${esc(v.date)}</span><b class="num">${rm(v.grandTotal)}</b></div>
                </div>`).join('') : empty('🧾', 'No invoices yet. Pack an order to issue the first one.')}</div>`;
    },

    more() {
        const people = S.users.length;
        const item = (act, ico, title, sub) => `<div class="card tap row" data-act="${act}"><div class="thumb">${ico}</div><div class="grow"><b>${title}</b><div class="small mute">${sub}</div></div><span class="mute">›</span></div>`;
        return `
            <h1>More</h1>
            <div class="list">
                ${item('people', '👥', 'Customers and team', `${people} ${people === 1 ? 'person' : 'people'}: set prices, drivers and roles`)}
                ${item('settings', '🏢', 'Business details', 'Name, TIN, SST, delivery fee and depot pin (printed on invoices)')}
                ${item('reports', '📈', 'Sales report', 'Revenue, top products, top customers and wastage')}
                ${item('statement', '📑', 'Monthly statements', 'One PDF per customer showing what is paid and owed')}
                ${item('liveMap', '🗺️', 'Live map', 'See every delivery that is on the road')}
                ${item('openInvoiceApp', '🧾', 'Invoice app', 'Write a one-off invoice with your business details filled in')}
                ${item('profile', '👤', 'My profile', esc(S.profile.name || S.user.email))}
                ${isDemo() ? '' : item('importLiveCatch', '📥', 'Import from Live Catch', 'One-time copy of the old stock list and delivery clients')}
            </div>
            ${accountFooter()}`;
    },

    /* ---------------- Customer (and supplier entering an order) ---------------- */
    shop() {
        const q = S.q.toLowerCase();
        const list = S.products.filter((p) => p.active !== false && (!q || String(p.name).toLowerCase().includes(q)));
        const needsProfile = S.role === 'client' && !S.profile.address;
        return `
            ${S.acting ? `<div class="notice row"><span class="grow">Entering an order for <b>${esc(S.acting.storeName || S.acting.name || 'a walk-in customer')}</b></span><button class="btn sm ghost" data-act="stopActing">Cancel</button></div>`
            : `<div><h1>Today's live catch</h1><p class="mute small">Live seafood is weighed when packed. You approve the final price before it ships.</p></div>`}
            ${!S.acting && S.settings.cutoff ? `<div class="notice ${pastCutoff() ? 'warn' : ''}">${pastCutoff() ? `Same-day orders closed at ${fmtTime(S.settings.cutoff)}. Orders placed now are delivered from tomorrow.` : `Order before ${fmtTime(S.settings.cutoff)} for delivery today.`}</div>` : ''}
            ${needsProfile ? `<div class="notice warn row"><span class="grow">Add your delivery address before ordering.</span><button class="btn sm" data-act="profile">Add</button></div>` : ''}
            <input class="input" id="q" type="search" placeholder="Search seafood" value="${esc(S.q)}" data-input="search" autocomplete="off">
            <div class="products">${list.length ? list.map(productCard).join('') : ''}</div>
            <div id="no-match" ${list.length ? 'hidden' : ''}>${empty('🐟', S.products.length ? 'Nothing matches your search.' : 'The catch list is empty right now. Check back soon.')}</div>
            <div id="cartbar">${cartBar()}</div>`;
    },

    myOrders() {
        const active = S.orders.filter((o) => ACTIVE.includes(o.status));
        const past = S.orders.filter((o) => !ACTIVE.includes(o.status)).slice(0, 30);
        return `
            <h1>My orders</h1>
            <div class="list">${active.length ? active.map(orderCard).join('') : empty('📦', 'No orders in progress.')}</div>
            ${past.length ? `<h2>Earlier</h2><div class="list">${past.map(orderCard).join('')}</div>` : ''}`;
    },

    account() {
        const p = S.profile;
        const line = (label, value) => `<div><span class="mute">${label}</span><span class="right">${esc(value || '—')}</span></div>`;
        return `
            <h1>Account</h1>
            <div class="card stack">
                <div class="lines small">
                    ${line('Name', p.name)}
                    ${S.role === 'client' ? line('Store', p.storeName) + line('Delivery address', p.address) + line('Map pin', p.loc ? 'Set' : 'Not set') + line('TIN (for e-invoice)', p.tin) : ''}
                    ${line('Phone', p.phone)}
                    ${S.role === 'driver' ? line('Vehicle', [p.vehicle, p.plate].filter(Boolean).join(' · ')) : ''}
                </div>
                <button class="btn soft block" data-act="profile">Edit details</button>
            </div>
            ${S.role === 'client' && !p.loc ? '<div class="notice warn">Set your map pin so the driver finds you and you get an accurate arrival time.</div>' : ''}
            ${S.role === 'client' ? extras.standingCards() + '<button class="btn ghost block" data-act="statement">📑 Monthly statement</button>' : ''}
            ${accountFooter()}`;
    },

    /* ---------------- Driver ---------------- */
    jobs() {
        const uid = S.user.uid;
        const rank = (o) => (o.status === 'delivering' ? (S.plan.indexOf(o.id) + 1 || 50) : 100);
        const mine = S.orders.filter((o) => o.driverId === uid && ['ready', 'delivering'].includes(o.status)).sort((a, b) => rank(a) - rank(b));
        const packed = mine.filter((o) => o.status === 'ready');
        const onBoard = mine.filter((o) => o.status === 'delivering');
        const open = S.orders.filter((o) => o.status === 'ready' && !o.driverId);
        const job = (o, action) => `
            <div class="card stack tight ${o.status === 'delivering' ? 'flag' : ''}">
                <div class="head"><b class="clip">${o.status === 'delivering' && onBoard.length > 1 ? `<span>Stop ${onBoard.indexOf(o) + 1}: </span>` : ''}${esc(o.storeName)}</b>${pill(o.status)}</div>
                <div class="small">📍 ${esc(o.deliveryAddress || 'Address not set')}</div>
                <div class="small mute">${esc(fmtSlot(o.slot))} · ${esc(summariseItems(o.items))}</div>
                ${o.payment.method === 'cod' && o.payment.status !== 'paid' ? `<div class="small bold">Collect ${rm(o.total)} cash</div>` : ''}
                ${action}
            </div>`;
        const gps = tracker.state === 'denied' || tracker.state === 'error'
            ? `<div class="notice bad">${esc(tracker.error)} The customer cannot see you until this is fixed.</div>` : '';
        return `
            <h1>Jobs</h1>
            ${gps}
            <div class="head"><h2>My deliveries</h2>${packed.length > 1 ? `<button class="btn sm" data-act="startAll">Start all ${packed.length}</button>` : ''}</div>
            ${onBoard.length > 1 ? '<p class="small mute">Stops are listed nearest first. Each customer sees how many stops come before theirs.</p>' : ''}
            <div class="list">${mine.length ? mine.map((o) => job(o, `<button class="btn block" data-act="delivery" data-id="${o.id}">${o.status === 'delivering' ? 'Continue delivery' : 'Open job'}</button>`)).join('') : empty('🚚', 'Nothing assigned to you yet.')}</div>
            <h2>Waiting for a driver</h2>
            <div class="list">${open.length ? open.map((o) => job(o, `<button class="btn soft block" data-act="claim" data-id="${o.id}">Take this job</button>`)).join('') : empty('👍', 'No open jobs right now.')}</div>`;
    },

    history() {
        const done = S.orders.filter((o) => o.status === 'delivered' && o.driverId === S.user.uid).sort((a, b) => (b.deliveredAt || 0) - (a.deliveredAt || 0));
        const today = done.filter((o) => isToday(o.deliveredAt));
        const cash = today.filter((o) => o.payment.status === 'paid' && o.payment.method === 'cod').reduce((s, o) => s + o.total, 0);
        return `
            <h1>Done</h1>
            <div class="kpis"><div class="kpi"><b>${today.length}</b><span>Delivered today</span></div><div class="kpi"><b class="num">${rm(cash)}</b><span>Cash to hand in</span></div></div>
            <div class="list">${done.length ? done.slice(0, 40).map((o) => `
                <div class="card stack tight"><div class="head"><b class="clip">${esc(o.storeName)}</b><span class="small mute">${fmtDateTime(o.deliveredAt)}</span></div>
                <div class="small mute clip">${esc(o.orderNo)} · ${rm(o.total)} · ${o.payment.status === 'paid' ? 'paid' : 'not collected'}${o.pod && o.pod.recipient ? ' · received by ' + esc(o.pod.recipient) : ''}</div></div>`).join('') : empty('✅', 'Your completed deliveries will be listed here.')}</div>`;
    }
};

function accountFooter() {
    return `
        <div class="stack">
            <button class="btn ghost block" data-act="alerts">${extras.alertsOn() ? '🔔 Alerts are on: tap to turn off' : '🔕 Turn on alerts'}</button>
            ${langPicker()}
            ${isDemo() ? `<button class="btn soft block" data-act="signOut">Switch demo role</button><button class="btn ghost block" data-act="resetDemo">Reset demo data</button>` : ''}
            <a class="btn ghost block" href="track.html">📍 Track a delivery by code</a>
            <button class="btn bad block" data-act="signOut">Sign out</button>
        </div>`;
}

/* ================================================================== */
/* Shop and checkout                                                   */
/* ================================================================== */
function reservedStock() {
    const out = {};
    S.orders.filter((o) => o.status === 'confirmed').forEach((o) => o.items.forEach((i) => { if (i.id) out[i.id] = (out[i.id] || 0) + itemQty(i); }));
    return out;
}
const priceFor = (p) => Number((S.acting ? S.actingPrices : S.prices)[p.id] ?? p.price) || 0;
const stepFor = (p) => (p.unit === 'kg' ? 0.5 : 1);

function productCard(p) {
    const qty = Number(p.quantity) || 0;
    const out = qty <= 0;
    const special = priceFor(p) !== Number(p.price);
    return `
        <div class="product ${out ? 'out' : ''}">
            <div class="row">${thumb(p)}<div class="grow"><b style="display:block;line-height:1.2">${esc(p.name)}</b><span class="tiny ${out ? '' : 'mute'}" ${out ? 'style="color:var(--bad);font-weight:700"' : ''}>${out ? 'Out of stock' : `${qty} ${esc(p.unit)} available`}</span></div></div>
            <div><b class="num">${rm(priceFor(p))}</b> <span class="small mute">/ ${esc(p.unit)}</span>${special ? ' <span class="pill ok">Your price</span>' : ''}</div>
            <div class="stepper">
                <button data-act="qty" data-id="${p.id}" data-d="-1" ${out ? 'disabled' : ''} aria-label="Less">−</button>
                <input type="number" inputmode="decimal" min="0" step="${stepFor(p)}" value="${S.cart[p.id] || ''}" placeholder="0" data-input="qty" data-id="${p.id}" id="qty-${p.id}" ${out ? 'disabled' : ''} aria-label="Quantity of ${esc(p.name)}">
                <button data-act="qty" data-id="${p.id}" data-d="1" ${out ? 'disabled' : ''} aria-label="More">+</button>
            </div>
        </div>`;
}

function cartLines() {
    return Object.entries(S.cart).map(([id, qty]) => {
        const p = byId(S.products, id);
        return p && qty > 0 ? { id, name: p.name, unit: p.unit, price: priceFor(p), qty } : null;
    }).filter(Boolean);
}

function cartBar() {
    const lines = cartLines();
    if (!lines.length) return '';
    const total = lines.reduce((s, i) => s + i.qty * i.price, 0);
    return `<div class="cartbar"><button class="btn" data-act="checkout"><span>${lines.length} ${lines.length === 1 ? 'item' : 'items'} · est. ${rm(total)}</span><span>Review order ›</span></button></div>`;
}

function setQty(id, qty) {
    const p = byId(S.products, id);
    if (!p) return;
    const max = Number(p.quantity) || 0;
    qty = Math.max(0, round2(qty));
    if (qty > max) { qty = max; toast(`Only ${max} ${p.unit} of ${p.name} available`); }
    if (qty) S.cart[id] = qty; else delete S.cart[id];
    const input = document.getElementById('qty-' + id);
    if (input && document.activeElement !== input) input.value = qty || '';
    const bar = $('#cartbar');
    if (bar) bar.innerHTML = cartBar();
}

function openCheckout() {
    const lines = cartLines();
    if (!lines.length) return;
    const walkIn = S.acting && !S.acting.id;
    const cust = S.acting || { id: S.user.uid, name: S.profile.name, storeName: S.profile.storeName, phone: S.profile.phone, tin: S.profile.tin, address: S.profile.address, loc: S.profile.loc };
    if (!S.acting && !cust.address) { toast('Add your delivery address first'); return openProfile(); }
    const fee = Number(S.settings.deliveryFee) || 0;
    const t = calcTotals(lines, fee, S.settings.sstRate);
    const today = dayKey(Date.now()), tomorrow = dayKey(Date.now() + 86400000);
    // Customers cannot book today after the cut-off; the supplier can always override
    const closed = !S.acting && pastCutoff();
    const day = closed || (!S.settings.cutoff && new Date().getHours() >= 15) ? tomorrow : today;
    let walkLoc = null;
    const sheet = openSheet({
        title: S.acting ? 'New order' : 'Review your order', form: true,
        render: () => ({
            body: `
                <div class="card lines small">
                    ${lines.map((i) => `<div><span>${esc(i.name)}<br><span class="mute">${i.qty} ${esc(i.unit)} × ${rm(i.price)}</span></span><b class="num">${rm(i.qty * i.price)}</b></div>`).join('')}
                    ${fee ? `<div><span>Delivery</span><span class="num">${rm(fee)}</span></div>` : ''}
                    ${t.tax ? `<div><span>SST ${S.settings.sstRate}%</span><span class="num">${rm(t.tax)}</span></div>` : ''}
                    <div class="total"><span>Estimated total</span><span class="num">${rm(t.total)}</span></div>
                </div>
                ${closed ? `<div class="notice warn">Same-day orders closed at ${fmtTime(S.settings.cutoff)}, so the earliest delivery is tomorrow.</div>` : ''}
                ${S.acting ? '' : '<div class="notice">Live seafood is sold by actual weight. We weigh your order, send the final price, and only pack once you accept.</div>'}
                ${walkIn ? field('Customer name', 'name', '', 'required placeholder="e.g. Kedai Makan Ah Hock"') + field('Phone', 'phone', '', 'type="tel" inputmode="tel"') + area('Delivery address', 'address') + '<button class="btn ghost block" type="button" data-pin>📍 <span data-pin-label>Set map pin (for live tracking)</span></button>' : `
                <div class="card small"><span class="mute">Deliver to</span><br><b>${esc(cust.storeName || cust.name)}</b><br>${esc(cust.address || 'No address on file')}${cust.loc ? '' : '<br><span style="color:var(--warn)">No map pin: arrival time will not be shown.</span>'}</div>`}
                <div class="grid2">
                    ${field('Delivery day', 'date', day, `type="date" min="${closed ? tomorrow : today}"`)}
                    ${select('Time', 'window', WINDOWS.map((w) => [w === WINDOWS[0] ? '' : w, w]), '')}
                </div>
                ${select('Payment', 'method', Object.entries(PAYMENT), 'cod')}
                ${area('Notes for the supplier', 'notes', '', 'placeholder="Sizes, cleaning, where to unload…"')}`,
            foot: `<button class="btn block" data-go>${S.acting ? 'Create confirmed order' : 'Send order request'}</button>`
        }),
        onMount: (el) => {
            const pinBtn = $('[data-pin]', el);
            if (pinBtn) pinBtn.addEventListener('click', () => pickLocation(walkLoc, $('[name=address]', el).value, (loc) => { walkLoc = loc; $('[data-pin-label]', el).textContent = 'Map pin set: change'; }));
            $('[data-go]', el).addEventListener('click', (e) => submit(e, el));
        }
    });
    async function submit(e, el) {
        {
            const f = readForm(el);
            if (walkIn && !f.name) return toast('Enter the customer name', true);
            if (!f.date || f.date < (closed ? tomorrow : today)) return toast(closed ? `Same-day orders closed at ${fmtTime(S.settings.cutoff)}. Pick tomorrow or later.` : 'Pick a delivery day', true);
            e.target.disabled = true;
            try {
                const customer = walkIn ? { id: '', name: f.name, storeName: f.name, phone: f.phone, address: f.address, loc: walkLoc } : cust;
                const order = await flow.createOrder({
                    customer, items: lines, slot: { date: f.date, window: f.window }, notes: f.notes, method: f.method,
                    deliveryFee: fee, confirmed: !!S.acting
                });
                S.cart = {};
                sheet.close();
                if (S.acting) { S.acting = null; S.tab = 'orders'; S.orderFilter = 'confirmed'; toast('Order created. Pack it when ready.'); }
                else { S.tab = 'orders'; toast('Order sent. We will confirm the weights shortly.'); }
                render();
                openOrder(order.id);
            } catch (err) { e.target.disabled = false; fail(err, 'place the order'); }
        }
    }
}

/* ================================================================== */
/* Order sheet: one screen, different actions per role                 */
/* ================================================================== */
function openOrder(id) {
    openSheet({
        title: 'Order',
        render: () => {
            const o = byId(S.orders, id);
            if (!o) return { title: 'Order', body: empty('📦', 'This order is no longer available.'), foot: '' };
            const at = STEPS.indexOf(o.status);
            const labels = ['Request', 'Quote', 'Confirm', 'Pack', 'On way', 'Done'];
            const steps = STEPS.map((s, i) => `<div class="s ${o.status === 'cancelled' ? '' : i < at || o.status === 'delivered' ? 'done' : i === at ? 'now' : ''}"><i></i>${labels[i]}</div>`).join('');
            const weighed = ['requested'].includes(o.status) ? false : true;
            const canSeeMoney = S.role !== 'driver';
            const inv = o.invoiceId ? byId(S.invoices, o.invoiceId) : null;
            return {
                title: o.orderNo,
                body: `
                    <div class="card stack">
                        <div class="head"><h2 class="clip">${esc(o.storeName)}</h2>${pill(o.status)}</div>
                        <div class="steps">${steps}</div>
                        <p class="small mute">${esc(o.status === 'cancelled' && o.cancelReason ? 'Cancelled: ' + o.cancelReason : STATUS[o.status].hint)}.</p>
                    </div>
                    <div class="card stack tight small">
                        <div>📍 ${esc(o.deliveryAddress || 'No delivery address')}${o.dest ? '' : ' <span class="pill warn">no map pin</span>'}</div>
                        <div>🕑 ${esc(fmtSlot(o.slot))}</div>
                        ${o.notes ? `<div>📝 ${esc(o.notes)}</div>` : ''}
                        ${S.role !== 'client' && o.phone ? `<div class="row" style="margin-top:6px"><a class="btn sm soft" href="${telHref(o.phone)}">📞 Call</a><a class="btn sm soft" href="${waHref(o.phone)}" target="_blank" rel="noopener">WhatsApp</a></div>` : ''}
                    </div>
                    <div class="card lines small">
                        ${o.items.map((i) => `<div><span>${esc(i.name)}<br><span class="mute">${itemQty(i)} ${esc(i.unit)}${canSeeMoney ? ' × ' + rm(itemPrice(i)) : ''}${weighed && i.finalQty != null && Number(i.finalQty) !== Number(i.qty) ? ` (ordered ${i.qty})` : ''}</span></span>${canSeeMoney ? `<b class="num">${rm(itemQty(i) * itemPrice(i))}</b>` : ''}</div>`).join('')}
                        ${canSeeMoney && o.deliveryFee ? `<div><span>Delivery</span><span class="num">${rm(o.deliveryFee)}</span></div>` : ''}
                        ${canSeeMoney && o.tax ? `<div><span>SST ${o.sstRate}%</span><span class="num">${rm(o.tax)}</span></div>` : ''}
                        <div class="total"><span>${o.status === 'requested' ? 'Estimated total' : S.role === 'driver' ? 'To collect' : 'Total'}</span><span class="num">${rm(o.total)}</span></div>
                        <div><span class="mute">${PAYMENT[o.payment.method] || 'Payment'}</span><span class="pill ${o.payment.status === 'paid' ? 'ok' : 'warn'}">${o.payment.status === 'paid' ? 'Paid' : 'Unpaid'}</span></div>
                    </div>
                    ${o.driverId ? `<div class="card row"><div class="thumb">🚚</div><div class="grow"><b class="clip">${esc(o.driverName)}</b><div class="small mute clip">${esc(o.vehicle || 'Driver')}</div></div>${o.driverPhone && S.role !== 'driver' ? `<a class="btn sm soft" href="${telHref(o.driverPhone)}">📞</a>` : ''}</div>` : ''}
                    ${['ready', 'delivering'].includes(o.status) && S.role !== 'driver' ? `<div class="card row"><div class="grow small"><b>${o.status === 'delivering' ? 'Driver is on the way' : 'Tracking link is ready'}</b><div class="mute">Anyone with the link can follow this delivery.</div></div><button class="btn sm ghost" data-act="shareTrack" data-id="${o.id}">Share</button></div>` : ''}
                    ${orderExtras(o)}
                    ${inv || o.invoiceNo ? `<div class="card tap row" data-act="invoice" data-id="${o.invoiceId}"><div class="thumb">🧾</div><div class="grow"><b>Invoice ${esc(o.invoiceNo)}</b><div class="small mute">Tap to view, download or share</div></div><span class="mute">›</span></div>` : ''}
                    <div class="card stack tight"><h3>History</h3><div class="timeline">${(o.timeline || []).map((e) => `<div><span><b>${(STATUS[e.status] || STATUS.requested).label}</b> <span class="mute">· ${fmtDateTime(e.at)}${e.by ? ' · ' + esc(e.by) : ''}</span></span></div>`).join('') || '<span class="mute small">No history recorded.</span>'}</div></div>`,
                foot: orderActions(o)
            };
        }
    });
}

/** Secondary actions on an order: message the other side, pay by QR, see the delivery photo, repeat weekly. */
function orderExtras(o) {
    const out = [];
    if (isAdmin() && o.phone) out.push(`<a class="btn sm soft" href="${waHref(o.phone, extras.customerMessage(o))}" target="_blank" rel="noopener">💬 Update customer on WhatsApp</a>`);
    if (S.role === 'client' && S.settings.phone) out.push(`<a class="btn sm soft" href="${waHref(S.settings.phone, extras.supplierMessage(o))}" target="_blank" rel="noopener">💬 Message supplier</a>`);
    if (S.role === 'client' && S.settings.qr && o.payment.status !== 'paid' && ['confirmed', 'ready', 'delivering', 'delivered'].includes(o.status)) out.push(`<button class="btn sm soft" data-act="payQr" data-id="${o.id}">Pay by QR</button>`);
    if (o.pod && o.pod.hasPhoto && S.role !== 'driver') out.push(`<button class="btn sm soft" data-act="podPhoto" data-id="${o.id}">📷 Delivery photo</button>`);
    if (S.role === 'client' && o.status !== 'cancelled') out.push(`<button class="btn sm ghost" data-act="repeat" data-id="${o.id}">🔁 Repeat weekly</button>`);
    return out.length ? `<div class="row wrap">${out.join('')}</div>` : '';
}

const pastCutoff = () => !!S.settings.cutoff && new Date().toTimeString().slice(0, 5) >= S.settings.cutoff;
const fmtTime = (hhmm) => new Date(`2000-01-01T${hhmm}`).toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit' });

function openQr(o) {
    openSheet({
        title: 'Pay by QR', form: true,
        render: () => ({
            body: `<div class="card stack" style="justify-items:center;text-align:center">
                <img src="${S.settings.qr}" alt="Payment QR code" style="width:min(260px,70vw);border-radius:12px;background:#fff">
                <div><div class="small mute">Amount</div><b class="num" style="font-size:26px">${rm(o.total)}</b></div>
                <div class="small">Reference: <b>${esc(o.invoiceNo || o.orderNo)}</b></div>
                <p class="small mute">Scan with your banking or e-wallet app. ${esc(S.settings.name)} marks the invoice as paid once the money arrives.</p></div>`
        })
    });
}

function orderActions(o) {
    const b = (act, label, cls = '') => `<button class="btn ${cls}" data-act="${act}" data-id="${o.id}">${label}</button>`;
    const s = o.status;
    if (isAdmin()) {
        if (s === 'requested') return b('cancel', 'Cancel', 'bad') + b('quote', 'Weigh and quote');
        if (s === 'quoted') return b('cancel', 'Cancel', 'bad') + b('quote', 'Edit quote', 'ghost') + b('confirmFor', 'Customer agreed');
        if (s === 'confirmed') return b('cancel', 'Cancel', 'bad') + b('quote', 'Adjust', 'ghost') + b('pack', 'Pack and invoice');
        if (s === 'ready') return b('cancel', 'Cancel', 'bad') + b('assign', o.driverId ? 'Change driver' : 'Assign driver', o.driverId ? 'ghost' : '') + b('track', 'Track', 'soft');
        if (s === 'delivering') return b('complete', 'Mark delivered', 'ghost') + b('track', 'Track live');
        return b('reorder', 'Repeat this order', 'ghost');
    }
    if (S.role === 'client') {
        if (s === 'requested') return b('cancel', 'Cancel order', 'bad');
        if (s === 'quoted') return b('cancel', 'Decline', 'bad') + b('accept', `Accept ${rm(o.total)}`, 'ok');
        if (s === 'ready' || s === 'delivering') return b('track', s === 'delivering' ? 'Track live' : 'Track delivery');
        if (s === 'delivered' || s === 'cancelled') return b('reorder', 'Order again');
        return '';
    }
    if (s === 'ready' && !o.driverId) return b('claim', 'Take this job');
    if (o.driverId === S.user.uid && (s === 'ready' || s === 'delivering')) return b('delivery', s === 'delivering' ? 'Continue delivery' : 'Open job');
    return '';
}

/** Supplier: enter the weighed quantities and final prices. */
function openQuote(o) {
    const adjusting = o.status === 'confirmed';
    let rows = o.items.map((i) => ({ ...i, finalQty: itemQty(i), finalPrice: itemPrice(i) }));
    let fee = o.deliveryFee;
    const others = () => S.products.filter((p) => p.active !== false && !rows.some((r) => r.id === p.id));
    const sheet = openSheet({
        title: adjusting ? 'Adjust order' : 'Weigh and quote', form: true,
        render: () => ({
            body: `
                <p class="small mute">Enter what was actually weighed. Set a quantity to 0 to drop a line.</p>
                ${rows.map((r, i) => `
                    <div class="card stack tight">
                        <div class="head"><b class="clip">${esc(r.name)}</b><span class="small mute">ordered ${r.qty} ${esc(r.unit)}</span></div>
                        <div class="grid2">
                            <label class="field"><span>Weighed (${esc(r.unit)})</span><input class="input" type="number" inputmode="decimal" step="0.01" min="0" data-row="${i}" data-k="finalQty" value="${r.finalQty}"></label>
                            <label class="field"><span>Price / ${esc(r.unit)}</span><input class="input" type="number" inputmode="decimal" step="0.01" min="0" data-row="${i}" data-k="finalPrice" value="${r.finalPrice}"></label>
                        </div>
                    </div>`).join('')}
                ${others().length ? `<label class="field"><span>Add another item</span><select class="input" data-add><option value="">Choose…</option>${others().map((p) => `<option value="${p.id}">${esc(p.name)} (${rm(p.price)}/${esc(p.unit)})</option>`).join('')}</select></label>` : ''}
                <label class="field"><span>Delivery fee (RM)</span><input class="input" type="number" inputmode="decimal" step="0.01" min="0" data-fee value="${fee}"></label>
                <div class="card lines small" data-totals></div>`,
            foot: adjusting ? `<button class="btn block" data-save="confirmed">Save changes</button>`
                : `<button class="btn ghost" data-save="confirmed">Confirm now</button><button class="btn" data-save="quoted">Send quote</button>`
        }),
        onMount: (el) => {
            const totals = () => {
                const t = calcTotals(rows, fee, o.sstRate);
                $('[data-totals]', el).innerHTML = `<div><span>Goods</span><span class="num">${rm(t.subtotal)}</span></div>${t.tax ? `<div><span>SST ${o.sstRate}%</span><span class="num">${rm(t.tax)}</span></div>` : ''}<div><span>Delivery</span><span class="num">${rm(t.deliveryFee)}</span></div><div class="total"><span>Total</span><span class="num">${rm(t.total)}</span></div>`;
            };
            totals();
            el.addEventListener('input', (e) => {
                const t = e.target;
                if (t.dataset.row !== undefined) rows[Number(t.dataset.row)][t.dataset.k] = Number(t.value) || 0;
                if (t.hasAttribute('data-fee')) fee = Number(t.value) || 0;
                totals();
            });
            el.addEventListener('change', (e) => {
                if (!e.target.hasAttribute('data-add') || !e.target.value) return;
                const p = byId(S.products, e.target.value);
                rows.push({ id: p.id, name: p.name, unit: p.unit, price: Number(p.price), qty: 0, finalQty: 1, finalPrice: Number(p.price) });
                sheet.draw(); totals();
            });
            el.addEventListener('click', async (e) => {
                const next = e.target.dataset.save;
                if (!next) return;
                const items = rows.filter((r) => r.finalQty > 0);
                if (!items.length) return toast('Keep at least one item, or cancel the order instead', true);
                e.target.disabled = true;
                try {
                    await flow.saveQuote(o, items, fee, next);
                    sheet.close();
                    toast(next === 'quoted' ? 'Quote sent to the customer' : adjusting ? 'Order updated' : 'Order confirmed');
                } catch (err) { e.target.disabled = false; fail(err, 'save the quote'); }
            });
        }
    });
}

const driverOptions = (current) => [['', 'Any driver (post to job board)'], ...S.users.filter((u) => u.role === 'driver').map((u) => [u.id, `${u.name || u.email}${u.plate ? ' · ' + u.plate : ''}`])];

function openPack(o) {
    const short = o.items.map((i) => ({ i, p: byId(S.products, i.id) })).filter(({ i, p }) => p && itemQty(i) > Number(p.quantity));
    const sheet = openSheet({
        title: 'Pack and invoice', form: true,
        render: () => ({
            body: `
                <div class="card lines small">${o.items.map((i) => `<div><span>${esc(i.name)}</span><b class="num">${itemQty(i)} ${esc(i.unit)}</b></div>`).join('')}<div class="total"><span>Invoice total</span><span class="num">${rm(o.total)}</span></div></div>
                ${short.length ? `<div class="notice warn">Stock on record is lower than this order for: ${short.map(({ i, p }) => `${esc(i.name)} (${p.quantity} ${esc(i.unit)})`).join(', ')}. Packing will take the count below zero.</div>` : ''}
                <div class="notice">Packing takes these weights out of stock and issues the invoice. The customer gets a tracking link.</div>
                ${select('Driver', 'driver', driverOptions(), o.driverId || '')}`,
            foot: `<button class="btn block" data-go>Packed: issue invoice</button>`
        }),
        onMount: (el) => $('[data-go]', el).addEventListener('click', async (e) => {
            e.target.disabled = true;
            try {
                const d = byId(S.users, readForm(el).driver);
                const no = await flow.packOrder(o, d || null);
                sheet.close();
                toast(`Packed. Invoice ${no} issued.`);
            } catch (err) { e.target.disabled = false; fail(err, 'pack the order'); }
        })
    });
}

function openAssign(o) {
    const sheet = openSheet({
        title: 'Assign driver', form: true,
        render: () => ({ body: select('Driver', 'driver', driverOptions(), o.driverId || ''), foot: `<button class="btn block" data-go>Save</button>` }),
        onMount: (el) => $('[data-go]', el).addEventListener('click', async () => {
            try { await flow.assignDriver(o, byId(S.users, readForm(el).driver) || null); sheet.close(); toast('Driver updated'); } catch (err) { fail(err, 'assign the driver'); }
        })
    });
}

function openComplete(o) {
    const cod = o.payment.status !== 'paid';
    let photo = null;
    const sheet = openSheet({
        title: 'Confirm delivery', form: true,
        render: () => ({
            body: `
                ${field('Received by', 'recipient', '', 'placeholder="Name of the person who took the goods" autocomplete="off"')}
                ${cod ? `<div class="card stack tight"><label class="check"><input type="checkbox" name="paid" ${o.payment.method === 'cod' ? 'checked' : ''}><span>Payment collected: <b>${rm(o.total)}</b></span></label>${select('Paid by', 'method', [['cod', 'Cash'], ['transfer', 'Bank transfer / QR']], o.payment.method === 'transfer' ? 'transfer' : 'cod')}
                    ${S.settings.qr ? `<div data-qr ${o.payment.method === 'transfer' ? '' : 'hidden'} style="text-align:center"><img src="${S.settings.qr}" alt="Payment QR code" style="width:min(220px,60vw);border-radius:12px;background:#fff"><div class="small mute">Let the customer scan this to pay</div></div>` : ''}</div>` : '<div class="notice ok">Already paid. Nothing to collect.</div>'}
                <div class="card stack tight"><button class="btn ghost block" type="button" data-photo>📷 <span>Add a delivery photo</span></button><img data-preview hidden alt="Delivery photo" style="width:100%;border-radius:12px"><p class="tiny mute">A photo of the goods at the door settles any later question about the delivery.</p></div>`,
            foot: `<button class="btn ok block" data-go>Delivered</button>`
        }),
        onMount: (el) => {
            el.addEventListener('change', (e) => { const qr = $('[data-qr]', el); if (e.target.name === 'method' && qr) qr.hidden = e.target.value !== 'transfer'; });
            $('[data-photo]', el).addEventListener('click', async () => {
                const shot = await pickImage();
                if (!shot) return;
                photo = shot;
                const img = $('[data-preview]', el); img.src = shot; img.hidden = false;
                $('[data-photo] span', el).textContent = 'Retake photo';
            });
            $('[data-go]', el).addEventListener('click', async (e) => {
                const f = readForm(el);
                e.target.disabled = true;
                try {
                    const saved = await flow.completeDelivery(o, { recipient: f.recipient, paid: !!f.paid, method: f.method, photo });
                    closeAllSheets();
                    toast(saved ? 'Delivery completed' : 'Delivery completed, but the photo could not be saved', !saved);
                } catch (err) { e.target.disabled = false; fail(err, 'complete the delivery'); }
            });
        }
    });
}

/* ================================================================== */
/* Live tracking                                                       */
/* ================================================================== */
/** Customer / supplier: follow one delivery. */
function openTrack(id) {
    let view = null;
    const sheet = openSheet({
        title: 'Live tracking', full: true, flush: true,
        render: () => ({ foot: `<button class="btn ghost" data-act="shareTrack" data-id="${id}">Share tracking link</button>` }),
        onMount: (el) => { view = createTrackView($('.sheet-body', el), { depot: depot() }); },
        onClose: () => view && view.destroy()
    });
    sheet.onData = () => { const o = byId(S.orders, id); if (o && view) view.update(trackingFromOrder(o, S.settings)); };
    sheet.onData();
}

/** Driver: the working screen for one job. */
function openDelivery(id) {
    let view = null;
    const cur = () => byId(S.orders, id);
    const sheet = openSheet({
        title: 'Delivery', full: true, flush: true,
        render: () => {
            const o = cur();
            if (!o || !['ready', 'delivering'].includes(o.status)) return { foot: '' };
            const nav = `<a class="btn ghost" href="${navLink(o.dest, o.deliveryAddress)}" target="_blank" rel="noopener">🧭 Map</a>`;
            return {
                title: o.storeName,
                foot: o.status === 'ready'
                    ? `<button class="btn bad" data-act="release" data-id="${id}">Release</button>${nav}<button class="btn" data-act="start" data-id="${id}">Start</button>`
                    : `${nav}${isDemo() ? `<button class="btn soft" data-act="simulate" data-id="${id}">▶ Simulate</button>` : ''}<button class="btn ok" data-act="complete" data-id="${id}">Delivered</button>`
            };
        },
        onMount: (el) => {
            view = createTrackView($('.sheet-body', el), {
                depot: depot(),
                extra: () => {
                    const o = cur();
                    if (!o) return '';
                    const gps = o.status !== 'delivering' ? ''
                        : tracker.state === 'on' ? `<div class="notice ok">Sharing your location with the customer${tracker.last && tracker.last.acc ? ` (accurate to ${Math.round(tracker.last.acc)} m)` : ''}. Keep this page open and the screen on.</div>`
                            : tracker.state === 'starting' ? '<div class="notice">Finding your position…</div>'
                                : `<div class="notice bad">${esc(tracker.error || 'Location sharing is off.')} <button class="btn sm" data-act="retryGps" data-id="${id}" style="margin-top:6px">Try again</button></div>`;
                    return `${gps}
                        <div class="card stack tight">
                            ${o.payment.status === 'paid' ? '<div class="pill ok">Already paid</div>' : `<div><span class="small mute">${o.payment.method === 'cod' ? 'Collect on delivery' : PAYMENT[o.payment.method]}</span><br><b class="num" style="font-size:22px">${rm(o.total)}</b></div>`}
                            ${o.notes ? `<div class="small">📝 ${esc(o.notes)}</div>` : ''}
                            ${o.phone ? `<div class="row"><a class="btn sm soft grow" href="${telHref(o.phone)}">📞 Call customer</a><a class="btn sm soft grow" href="${waHref(o.phone, `Hi, this is ${S.profile.name} from ${S.settings.name}. I am on my way with your order ${o.orderNo}. Track me here: ${trackUrl(o)}`)}" target="_blank" rel="noopener">WhatsApp</a></div>` : ''}
                        </div>`;
                }
            });
        },
        onClose: () => view && view.destroy()
    });
    sheet.onData = () => {
        const o = cur();
        if (!o || !view) return;
        if (!['ready', 'delivering'].includes(o.status)) return sheet.close();
        // Show this phone's own position straight away rather than waiting for the round trip
        const mine = tracker.has(id) && tracker.last ? { ...tracker.last } : o.driverLoc;
        view.update(trackingFromOrder({ ...o, driverLoc: mine }, S.settings));
    };
    sheet.onData();
}

/** Supplier: every delivery on the road, on one map. */
function openLiveMap() {
    let map = null;
    const marks = new Map();
    const sheet = openSheet({
        title: 'Live map', full: true, flush: true,
        render: () => {
            const road = S.orders.filter((o) => o.status === 'delivering');
            return {
                body: undefined,
                foot: road.length ? '' : '<p class="small mute" style="margin:auto">No deliveries are on the road right now.</p>'
            };
        },
        onMount: async (el) => {
            $('.sheet-body', el).innerHTML = '<div class="map" style="height:100%;min-height:60dvh"></div><div class="pad" data-list style="padding-top:12px"></div>';
            try { map = await makeMap($('.map', el), depot(), 13); } catch (e) { return toast(e.message, true); }
            window.L.marker([depot().lat, depot().lng], { icon: pin('🏭') }).addTo(map).bindPopup('Depot');
            sheet.onData();
        },
        onClose: () => map && map.remove()
    });
    sheet.onData = () => {
        const road = S.orders.filter((o) => o.status === 'delivering');
        const list = $('[data-list]', sheet.el);
        if (list) list.innerHTML = road.map((o) => `<div class="card tap row" data-act="track" data-id="${o.id}"><div class="thumb">🚚</div><div class="grow"><b class="clip">${esc(o.driverName || 'Driver')} → ${esc(o.storeName)}</b><div class="small mute">${o.driverLoc ? 'Updated ' + timeAgo(o.driverLoc.ts) : 'Waiting for GPS'}</div></div><span class="mute">›</span></div>`).join('');
        if (!map) return;
        const L = window.L;
        const want = new Set();
        road.forEach((o) => {
            if (o.dest) { want.add('d' + o.id); if (!marks.has('d' + o.id)) marks.set('d' + o.id, L.marker([o.dest.lat, o.dest.lng], { icon: pin('🏠', 'dest') }).addTo(map).bindPopup(esc(o.storeName))); }
            if (o.driverLoc) {
                want.add('t' + o.id);
                const m = marks.get('t' + o.id);
                if (m) m.setLatLng([o.driverLoc.lat, o.driverLoc.lng]);
                else marks.set('t' + o.id, L.marker([o.driverLoc.lat, o.driverLoc.lng], { icon: pin('🚚', 'truck'), zIndexOffset: 500 }).addTo(map).bindPopup(`${esc(o.driverName || 'Driver')} → ${esc(o.storeName)}`));
            }
        });
        marks.forEach((m, k) => { if (!want.has(k)) { map.removeLayer(m); marks.delete(k); } });
    };
}

/** Drop a pin: tap the map, use the phone's GPS, or search for the address. */
function pickLocation(initial, address, done) {
    let map = null, marker = null, chosen = initial || null;
    const place = (p, zoom) => {
        chosen = { lat: round5(p.lat), lng: round5(p.lng) };
        if (!map) return;
        if (marker) marker.setLatLng([p.lat, p.lng]); else marker = window.L.marker([p.lat, p.lng], { icon: pin('📍', 'dest') }).addTo(map);
        if (zoom) map.setView([p.lat, p.lng], 17);
    };
    const round5 = (n) => Math.round(n * 1e5) / 1e5;
    const sheet = openSheet({
        title: 'Set map pin', full: true, flush: true, form: true,
        render: () => ({
            body: `<div class="map"></div><div class="pad" style="padding-top:12px">
                <p class="small mute">Tap the map where the driver should arrive.</p>
                <div class="row"><input class="input grow" name="q" placeholder="Search an address" value="${esc(address || '')}"><button class="btn soft" data-find>Find</button></div>
                <button class="btn ghost block" data-gps>📡 Use where I am now</button></div>`,
            foot: `<button class="btn block" data-save>Save pin</button>`
        }),
        onMount: async (el) => {
            try { map = await makeMap($('.map', el), initial || depot(), initial ? 17 : 13); } catch (e) { return toast(e.message, true); }
            if (initial) place(initial);
            map.on('click', (e) => place(e.latlng));
            $('[data-find]', el).addEventListener('click', async () => {
                const q = $('[name=q]', el).value.trim();
                if (!q) return;
                try { const hit = await geocode(q); if (hit) place(hit, true); else toast('Address not found. Tap the map instead.'); } catch (e) { toast('Search is unavailable. Tap the map instead.', true); }
            });
            $('[data-gps]', el).addEventListener('click', async () => {
                try { place(await getPosition(), true); } catch (e) { toast(e.message, true); }
            });
            $('[data-save]', el).addEventListener('click', () => {
                if (!chosen) return toast('Tap the map to drop the pin first');
                sheet.close(); done(chosen);
            });
        },
        onClose: () => map && map.remove()
    });
}

/* ================================================================== */
/* Invoices: drawn by the Invoice app's engine                         */
/* ================================================================== */
let pdfReady = null;
function loadPdf() {
    if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable) return Promise.resolve();
    const script = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('The PDF library could not be loaded. Check your connection.')); document.head.appendChild(s); });
    pdfReady = pdfReady || script('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        .then(() => script('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'))
        .catch((e) => { pdfReady = null; throw e; });
    return pdfReady;
}

/** Invoices issued before the business details were filled in pick them up now. */
const printable = (v) => ({ ...v, supplier: v.supplier && v.supplier.name ? v.supplier : supplierFromSettings(S.settings), paymentQr: v.status === 'unpaid' ? S.settings.qr || '' : '' });

function openInvoice(id) {
    openSheet({
        title: 'Invoice',
        render: () => {
            const v = byId(S.invoices, id);
            if (!v) return { body: empty('🧾', 'This invoice is not available on your account.'), foot: '' };
            const o = v.orderId ? byId(S.orders, v.orderId) : null;
            return {
                title: v.invoiceNo,
                body: `
                    <div class="card stack tight">
                        <div class="head"><h2 class="clip">${esc(v.buyer.name)}</h2><span class="pill ${v.status === 'paid' ? 'ok' : v.status === 'void' ? 'plain' : 'warn'}">${v.status}</span></div>
                        <div class="small mute">${esc(v.date)}${v.reference ? ' · order ' + esc(v.reference) : ''}${v.buyer.tin ? ' · TIN ' + esc(v.buyer.tin) : ''}</div>
                    </div>
                    <div class="card lines small">
                        ${v.items.map((i) => `<div><span>${esc(i.description)}<br><span class="mute">${i.qty} ${esc(i.unit || '')} × ${rm(i.unitPrice)}</span></span><b class="num">${rm(i.qty * i.unitPrice)}</b></div>`).join('')}
                        ${v.totalTax ? `<div><span>SST</span><span class="num">${rm(v.totalTax)}</span></div>` : ''}
                        <div class="total"><span>Total</span><span class="num">${rm(v.grandTotal)}</span></div>
                    </div>
                    <div class="grid2">
                        <button class="btn" data-act="invPdf" data-id="${v.id}">⬇ PDF</button>
                        <button class="btn soft" data-act="invWa" data-id="${v.id}">WhatsApp</button>
                    </div>
                    ${isAdmin() ? `<button class="btn ghost block" data-act="invEdit" data-id="${v.id}">✏️ Open in Invoice app</button>
                    <p class="tiny mute">The Invoice app opens with this invoice filled in, so you can adjust wording or tax lines before sending.</p>` : ''}`,
                foot: isAdmin() && v.status !== 'void' ? `<button class="btn ${v.status === 'paid' ? 'ghost' : 'ok'} block" data-act="invPaid" data-id="${v.id}" data-order="${o ? o.id : ''}">${v.status === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}</button>` : ''
            };
        }
    });
}

/* ================================================================== */
/* Stock, people, settings, profile                                    */
/* ================================================================== */
function openProduct(id) {
    const p = byId(S.products, id) || { name: '', icon: '🐟', image: '', price: '', unit: 'kg', quantity: 0, lowAt: 5, active: true };
    const sheet = openSheet({
        title: id ? 'Edit product' : 'Add product', form: true,
        render: () => ({
            body: `
                ${id ? `<div class="card stack tight"><h3>Receive stock</h3><div class="row"><input class="input grow" type="number" inputmode="decimal" step="0.1" min="0" placeholder="${esc(p.unit)} received" data-recv><button class="btn" data-receive>Add</button></div><div class="head"><p class="small mute">Now: <b>${p.quantity} ${esc(p.unit)}</b></p><button class="btn sm bad" data-waste>Write off instead</button></div><p class="tiny mute">Write off stock that died or was damaged. It is counted as wastage in the sales report.</p></div>` : ''}
                ${field('Name', 'name', p.name, 'required')}
                <div class="grid2">${field('Price (RM)', 'price', p.price, 'type="number" inputmode="decimal" step="0.01" min="0"')}${select('Sold by', 'unit', [['kg', 'kg'], ['pcs', 'piece'], ['box', 'box'], ['tail', 'tail']], p.unit)}</div>
                <div class="grid2">${field('In stock', 'quantity', p.quantity, 'type="number" inputmode="decimal" step="0.1"')}${field('Warn when below', 'lowAt', p.lowAt ?? 5, 'type="number" inputmode="decimal" step="0.1" min="0"')}</div>
                <div class="grid2">${field('Icon (emoji)', 'icon', p.icon || '🐟', 'maxlength="4"')}${field('Photo link (optional)', 'image', p.image || '', 'type="url" placeholder="https://…"')}</div>
                <label class="check"><input type="checkbox" name="active" ${p.active !== false ? 'checked' : ''}><span>Show to customers</span></label>
                ${id ? `<details class="card"><summary class="bold">Stock history</summary><div style="margin-top:8px">${extras.stockLogRows(id, 30)}</div></details>` : ''}`,
            foot: `${id ? '<button class="btn bad" data-del>Delete</button>' : ''}<button class="btn" data-save>Save</button>`
        }),
        onMount: (el) => el.addEventListener('click', async (e) => {
            try {
                if (e.target.hasAttribute('data-receive')) {
                    const n = Number($('[data-recv]', el).value);
                    if (!(n > 0)) return toast('Enter how much arrived', true);
                    await store.inc('products', id, 'quantity', n);
                    flow.logStock(p, n, 'received');
                    sheet.close(); toast(`Added ${n} ${p.unit} of ${p.name}`);
                } else if (e.target.hasAttribute('data-waste')) {
                    const n = Number($('[data-recv]', el).value);
                    if (!(n > 0)) return toast('Enter how much to write off in the box first', true);
                    await store.inc('products', id, 'quantity', -n);
                    flow.logStock(p, -n, 'wastage');
                    sheet.close(); toast(`Wrote off ${n} ${p.unit} of ${p.name}`);
                } else if (e.target.hasAttribute('data-save')) {
                    const f = readForm(el);
                    if (!f.name) return toast('Give the product a name', true);
                    const data = { ...f, price: f.price || 0, quantity: f.quantity || 0, lowAt: f.lowAt ?? 0, updatedAt: Date.now() };
                    if (id) {
                        await store.update('products', id, data);
                        flow.logStock({ ...p, ...data }, data.quantity - (Number(p.quantity) || 0), 'correction');
                    } else {
                        const newId = await store.add('products', data);
                        flow.logStock({ ...data, id: newId }, data.quantity, 'received');
                    }
                    sheet.close(); toast('Saved');
                } else if (e.target.hasAttribute('data-del')) {
                    if (!(await ask({ title: 'Delete product?', text: `${p.name} will be removed from the catch list. Past orders keep their record.`, yes: 'Delete', danger: true }))) return;
                    await store.remove('products', id);
                    sheet.close(); toast('Deleted');
                }
            } catch (err) { fail(err, 'save the product'); }
        })
    });
}

function openPeople() {
    openSheet({
        title: 'Customers and team', full: true,
        render: () => {
            const group = (role, title) => {
                const list = S.users.filter((u) => u.role === role);
                return list.length ? `<h3>${title}</h3><div class="list">${list.map((u) => `
                    <div class="card tap row" data-act="person" data-id="${u.id}"><div class="thumb">${{ admin: '🏢', client: '🍽️', driver: '🚚' }[role]}</div>
                    <div class="grow"><b class="clip">${esc(u.storeName || u.name || u.email || 'Unnamed')}</b><div class="small mute clip">${esc([u.storeName ? u.name : '', u.phone, u.email].filter(Boolean).join(' · ') || 'No contact details')}</div></div>
                    ${role === 'client' && !u.loc ? '<span class="pill warn">no pin</span>' : ''}</div>`).join('')}</div>` : '';
            };
            return {
                body: `<p class="small mute">People appear here after they sign in to Ocean. Open one to make them a driver, set their prices or fix their address.</p>
                    ${group('client', 'Customers') || empty('🍽️', 'No customers yet.')}${group('driver', 'Drivers')}${group('admin', 'Supplier staff')}`,
                foot: `<button class="btn block" data-act="person" data-id="">＋ Add a customer by hand</button>`
            };
        }
    });
}

/** Shared form for "my profile" and the supplier editing someone else. */
function personForm(u, role, asAdmin) {
    return `
        ${field('Name', 'name', u.name || '')}
        ${asAdmin ? select('Role', 'role', [['client', 'Customer'], ['driver', 'Driver'], ['admin', 'Supplier staff (full access)']], role) : ''}
        ${field('Phone', 'phone', u.phone || '', 'type="tel" inputmode="tel" placeholder="+60 12-345 6789"')}
        <div data-for="client" ${role === 'client' ? '' : 'hidden'} class="stack">
            ${field('Store / restaurant name', 'storeName', u.storeName || '')}
            ${area('Delivery address', 'address', u.address || '')}
            <button class="btn ghost block" type="button" data-pin>📍 <span data-pin-label>${u.loc ? 'Map pin set: change' : 'Set map pin'}</span></button>
            ${field('TIN (for e-invoice, optional)', 'tin', u.tin || '')}
        </div>
        <div data-for="driver" ${role === 'driver' ? '' : 'hidden'} class="grid2">
            ${field('Vehicle', 'vehicle', u.vehicle || '', 'placeholder="Toyota Hilux"')}
            ${field('Plate number', 'plate', u.plate || '', 'placeholder="QAA 1234"')}
        </div>`;
}

function wirePersonForm(el, u, getLoc, setLoc) {
    el.addEventListener('change', (e) => {
        if (e.target.name !== 'role') return;
        el.querySelectorAll('[data-for]').forEach((box) => { box.hidden = box.dataset.for !== e.target.value; });
    });
    $('[data-pin]', el).addEventListener('click', () => pickLocation(getLoc(), $('[name=address]', el).value, (loc) => {
        setLoc(loc); $('[data-pin-label]', el).textContent = 'Map pin set: change';
    }));
}

function openProfile(first = false) {
    const u = S.profile;
    let loc = u.loc || null;
    const sheet = openSheet({
        title: first ? 'Welcome to Ocean' : 'My details', form: true,
        render: () => ({
            body: `${first ? `<div class="notice">${S.role === 'client' ? 'Tell us where to deliver. You can start ordering straight away.' : 'Add your contact details so customers can reach you.'}</div>` : ''}${personForm(u, S.role, false)}`,
            foot: `<button class="btn block" data-save>Save</button>`
        }),
        onMount: (el) => {
            wirePersonForm(el, u, () => loc, (l) => { loc = l; });
            $('[data-save]', el).addEventListener('click', async () => {
                const f = readForm(el);
                if (!f.phone) return toast('Add a phone number so we can reach you', true);
                try { await store.set('users', S.user.uid, { ...f, loc }); sheet.close(); toast('Saved'); } catch (err) { fail(err, 'save your details'); }
            });
        }
    });
}

function openPerson(id) {
    const u = byId(S.users, id) || { role: 'client' };
    let loc = u.loc || null;
    let prices = {};
    const sheet = openSheet({
        title: id ? (u.storeName || u.name || 'Person') : 'Add customer', form: true, full: !!id,
        render: () => ({
            body: `${personForm(u, u.role, !!id && id !== S.user.uid)}
                ${id ? `<div data-for="client" ${u.role === 'client' ? '' : 'hidden'} class="card stack tight"><h3>Special prices</h3><p class="small mute">Leave blank to charge the list price.</p><div data-prices class="stack tight"><span class="small mute">Loading…</span></div></div>` : '<div class="notice">Use this for customers who order by phone. They can sign in later with Google to order themselves.</div>'}`,
            foot: `<button class="btn ghost" data-order>New order</button><button class="btn" data-save>Save</button>`
        }),
        onMount: (el) => {
            wirePersonForm(el, u, () => loc, (l) => { loc = l; });
            if (id) loadPrices(id).then((p) => {
                prices = p;
                $('[data-prices]', el).innerHTML = S.products.map((pr) => `<label class="row small"><span class="grow clip">${esc(pr.icon || '🐟')} ${esc(pr.name)} <span class="mute">(${rm(pr.price)})</span></span><input class="input" style="width:110px;min-height:40px" type="number" inputmode="decimal" step="0.01" min="0" data-price="${pr.id}" value="${p[pr.id] ?? ''}" placeholder="${pr.price}"></label>`).join('') || '<span class="small mute">Add products first.</span>';
            });
            const save = async () => {
                const f = readForm(el);
                const data = { ...f, loc, role: f.role || u.role || 'client' };
                let uid = id;
                if (id) await store.set('users', id, data); else uid = await store.add('users', { ...data, manual: true, oceanSince: Date.now() });
                await Promise.all([...el.querySelectorAll('[data-price]')].map((inp) => {
                    const pid = inp.dataset.price, val = inp.value === '' ? null : Number(inp.value);
                    if (val === null) return prices[pid] != null ? store.remove(`users/${uid}/customPrices`, pid) : null;
                    return val !== prices[pid] ? store.set(`users/${uid}/customPrices`, pid, { price: val, updatedAt: Date.now() }) : null;
                }));
                return { id: uid, ...u, ...data };
            };
            el.addEventListener('click', async (e) => {
                const isSave = e.target.hasAttribute('data-save'), isOrder = e.target.hasAttribute('data-order');
                if (!isSave && !isOrder) return;
                try {
                    const person = await save();
                    if (isOrder) { closeAllSheets(); await startActing(person); } else { sheet.close(); toast('Saved'); }
                } catch (err) { fail(err, 'save this person'); }
            });
        }
    });
}

async function loadPrices(uid) {
    return new Promise((resolve) => {
        const stop = store.watch(`users/${uid}/customPrices`, (rows) => {
            setTimeout(() => stop && stop(), 0);
            resolve(Object.fromEntries(rows.map((r) => [r.id, Number(r.price)])));
        });
    });
}

async function startActing(person) {
    S.acting = person ? { id: person.id, name: person.name, storeName: person.storeName, phone: person.phone, tin: person.tin, address: person.address, loc: person.loc || null } : { id: '' };
    S.actingPrices = person ? await loadPrices(person.id) : {};
    S.cart = {}; S.q = ''; S.tab = 'shop';
    render();
}

function openNewOrder() {
    const clients = S.users.filter((u) => u.role === 'client');
    const sheet = openSheet({
        title: 'New order for…', form: true,
        render: () => ({
            body: `<div class="list">
                <div class="card tap row" data-pick=""><div class="thumb">🚶</div><div class="grow"><b>Walk-in / one-off customer</b><div class="small mute">Type the name and address at checkout</div></div></div>
                ${clients.map((u) => `<div class="card tap row" data-pick="${u.id}"><div class="thumb">🍽️</div><div class="grow"><b class="clip">${esc(u.storeName || u.name || u.email)}</b><div class="small mute clip">${esc(u.address || 'No address yet')}</div></div></div>`).join('')}
            </div>`
        }),
        onMount: (el) => el.addEventListener('click', async (e) => {
            const row = e.target.closest('[data-pick]');
            if (!row) return;
            sheet.close();
            await startActing(byId(S.users, row.dataset.pick) || null);
        })
    });
}

function openSettings() {
    const s = S.settings;
    let pinLoc = s.depot || null;
    let qr = s.qr || '';
    const sheet = openSheet({
        title: 'Business details', form: true, full: true,
        render: () => ({
            body: `
                <p class="small mute">These details are printed on every invoice and passed to the Invoice app.</p>
                ${field('Business name', 'name', s.name)}
                <div class="grid2">${field('TIN', 'tin', s.tin)}${field('MSIC code', 'msic', s.msic)}</div>
                <div class="grid2">${field('SST registration no.', 'sstNo', s.sstNo)}${field('Phone', 'phone', s.phone, 'type="tel"')}</div>
                ${area('Registered address', 'address', s.address)}
                <div class="grid2">${field('SST rate on goods (%)', 'sstRate', s.sstRate, 'type="number" inputmode="decimal" step="0.5" min="0"')}${field('Delivery fee (RM)', 'deliveryFee', s.deliveryFee, 'type="number" inputmode="decimal" step="0.5" min="0"')}</div>
                <label class="field"><span>Same-day order cut-off (leave empty for none)</span><input class="input" type="time" name="cutoff" value="${esc(s.cutoff || '')}"></label>
                <div class="card stack tight"><h3>Payment QR (DuitNow)</h3><p class="small mute">Shown to customers, on the driver's hand-over screen and on unpaid invoices.</p>
                    <img data-qr-img src="${qr}" ${qr ? '' : 'hidden'} alt="Payment QR code" style="width:160px;border-radius:12px;background:#fff">
                    <div class="row"><button class="btn sm soft" type="button" data-qr-pick>Choose picture</button><button class="btn sm bad" type="button" data-qr-clear ${qr ? '' : 'hidden'}>Remove</button></div></div>
                <button class="btn ghost block" type="button" data-pin>🏭 <span data-pin-label>Depot pin: ${pinLoc ? 'set, tap to change' : 'not set'}</span></button>
                <p class="tiny mute">Set the SST rate to 0 if your goods are not taxable. Ask your accountant if unsure.</p>`,
            foot: `<button class="btn block" data-save>Save</button>`
        }),
        onMount: (el) => {
            $('[data-pin]', el).addEventListener('click', () => pickLocation(pinLoc, $('[name=address]', el).value, (loc) => { pinLoc = loc; $('[data-pin-label]', el).textContent = 'Depot pin: set, tap to change'; }));
            const showQr = () => { const img = $('[data-qr-img]', el); img.src = qr; img.hidden = !qr; $('[data-qr-clear]', el).hidden = !qr; };
            $('[data-qr-pick]', el).addEventListener('click', async () => { const shot = await pickImage({ maxSide: 600, quality: 0.8, camera: false }); if (shot) { qr = shot; showQr(); } });
            $('[data-qr-clear]', el).addEventListener('click', () => { qr = ''; showQr(); });
            $('[data-save]', el).addEventListener('click', async () => {
                const f = readForm(el);
                const data = { ...f, sstRate: f.sstRate || 0, deliveryFee: f.deliveryFee || 0, depot: pinLoc || DEFAULT_DEPOT, qr };
                S.settings = { ...S.settings, ...data };
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(S.settings));
                try { await store.set('ocean_settings', 'business', data); toast('Saved'); }
                catch (err) { console.error(err); toast('Saved on this device only. The database rules do not allow shared settings yet.', true); }
                sheet.close(); render();
            });
        }
    });
}

/* ================================================================== */
/* Actions (every tappable thing with a data-act attribute)            */
/* ================================================================== */
const order = (id) => byId(S.orders, id);
const guard = (doing, fn) => async (d, el) => {
    if (el) el.disabled = true;
    try { await fn(d, el); } catch (e) { fail(e, doing); } finally { if (el) el.disabled = false; }
};

const ACTIONS = {
    signIn: guard('sign in', () => store.signIn()),
    enterDemo() { store.setMode('demo'); location.reload(); },
    leaveDemo() { store.setMode('live'); location.reload(); },
    demoUser: (d) => store.signIn(d.id),
    signOut: () => store.signOut(),
    async resetDemo() {
        if (!(await ask({ title: 'Reset the demo?', text: 'All demo orders and changes on this device will be replaced with the starting examples.', yes: 'Reset', danger: true }))) return;
        store.resetDemo(); location.reload();
    },
    tab(d) { S.tab = d.id; S.acting = null; window.scrollTo(0, 0); render(); },
    filter(d) { S.orderFilter = d.id; S.tab = 'orders'; render(); },
    invFilter(d) { S.invFilter = d.id; render(); },
    unpaid() { S.invFilter = 'unpaid'; S.tab = 'invoices'; render(); },
    gpsHelp: () => toast(tracker.error || 'Location sharing is off', true),

    // Shop
    qty(d) { const p = byId(S.products, d.id); setQty(d.id, (S.cart[d.id] || 0) + Number(d.d) * stepFor(p)); },
    checkout: () => openCheckout(),
    stopActing() { S.acting = null; S.cart = {}; S.tab = 'orders'; render(); },
    newOrder: () => openNewOrder(),
    reorder(d) {
        const o = order(d.id); if (!o) return;
        S.cart = {};
        o.items.forEach((i) => { const p = byId(S.products, i.id); if (p && p.active !== false && Number(p.quantity) > 0) S.cart[i.id] = Math.min(i.qty || itemQty(i), Number(p.quantity)); });
        closeAllSheets();
        if (isAdmin()) return startActingWithCart(o);
        S.tab = 'shop'; render();
        toast(Object.keys(S.cart).length ? 'Items added. Check quantities, then review.' : 'Those items are out of stock right now.');
    },

    // Orders
    order: (d) => openOrder(d.id),
    quote: (d) => openQuote(order(d.id)),
    confirmFor: guard('confirm the order', async (d) => { await flow.confirmOrder(order(d.id)); toast('Order confirmed'); }),
    accept: guard('accept the quote', async (d) => { await flow.acceptQuote(order(d.id)); toast('Quote accepted. We are packing your order.'); }),
    pack: (d) => openPack(order(d.id)),
    assign: (d) => openAssign(order(d.id)),
    async cancel(d) {
        const o = order(d.id);
        const packed = o.stockTaken;
        if (!(await ask({ title: S.role === 'client' && o.status === 'quoted' ? 'Decline this quote?' : 'Cancel this order?', text: packed ? 'The stock goes back on the shelf and the invoice is voided.' : 'This cannot be undone.', yes: 'Yes, cancel', no: 'Keep it', danger: true }))) return;
        try { await flow.cancelOrder(o, S.role === 'client' ? 'by customer' : 'by supplier'); toast('Order cancelled'); } catch (e) { fail(e, 'cancel the order'); }
    },
    track: (d) => openTrack(d.id),
    shareTrack(d) {
        const o = order(d.id);
        share('Track your Ocean delivery', `Follow ${S.settings.name || 'Ocean'} order ${o.orderNo} live:`, trackUrl(o));
    },
    liveMap: () => openLiveMap(),

    // Driver
    claim: guard('take the job', async (d) => {
        await flow.assignDriver(order(d.id), { id: S.user.uid, ...S.profile });
        closeAllSheets(); toast('Job is yours'); openDelivery(d.id);
    }),
    release: guard('give the job back', async (d) => { await flow.assignDriver(order(d.id), null); closeAllSheets(); toast('Job returned to the board'); }),
    delivery: (d) => { closeAllSheets(); openDelivery(d.id); },
    start: guard('start the delivery', async (d) => {
        await flow.startDelivery(order(d.id));
        toast('Delivery started. Sharing your location.');
    }),
    startAll: guard('start the run', async () => {
        const packed = S.orders.filter((o) => o.status === 'ready' && o.driverId === S.user.uid);
        for (const o of packed) await flow.startDelivery(o);
        toast(`Run started with ${packed.length} stops. Sharing your location.`);
    }),
    retryGps: () => tracker.retry(),
    complete: (d) => openComplete(order(d.id)),
    simulate: guard('simulate the drive', async (d) => {
        const o = order(d.id);
        if (!o.dest) return toast('This customer has no map pin to drive to', true);
        const from = tracker.last || depot();
        const r = await route(from, o.dest);
        tracker.simulate(r.path.length > 2 ? r.path : densify(r.path));
        toast('Simulating the drive…');
    }),

    // Extras
    alerts: async () => { await extras.toggleAlerts(); render(); },
    reports: () => extras.openReports(),
    stockLog: () => extras.openStockLog(),
    statement: () => extras.openStatement(''),
    importLiveCatch: () => extras.importLiveCatch(),
    repeat: (d) => extras.openRepeat(order(d.id)),
    stopRepeat: (d) => extras.stopRepeat(d.id),
    payQr: (d) => openQr(order(d.id)),
    podPhoto: guard('load the photo', async (d) => {
        const pod = await store.get('ocean_pod', d.id);
        if (!pod || !pod.photo) return toast('The photo is not available', true);
        openSheet({ title: 'Delivery photo', form: true, render: () => ({ body: `<img src="${pod.photo}" alt="Delivery photo" style="width:100%;border-radius:12px"><p class="small mute">Taken by ${esc(pod.by || 'the driver')} · ${fmtDateTime(pod.at)}</p>` }) });
    }),

    // Stock, people, settings
    product: (d) => openProduct(d.id),
    people: () => openPeople(),
    person: (d) => openPerson(d.id),
    settings: () => openSettings(),
    profile: () => (isAdmin() ? openPerson(S.user.uid) : openProfile()),

    // Invoices
    invoice: (d) => openInvoice(d.id),
    invPdf: guard('create the PDF', async (d) => { await loadPdf(); window.MSInvoice.download(printable(byId(S.invoices, d.id))); }),
    invWa(d) { window.open(window.MSInvoice.whatsappUrl(printable(byId(S.invoices, d.id))), '_blank', 'noopener'); },
    invEdit(d) {
        const v = printable(byId(S.invoices, d.id));
        window.open(window.MSInvoice.sendToEditor(v, '../invoice/', v.orderNo ? `Ocean order ${v.orderNo}` : 'Ocean'), '_blank');
    },
    invPaid: guard('update the invoice', async (d) => {
        const v = byId(S.invoices, d.id);
        await flow.setInvoicePaid(v, v.status !== 'paid', d.order ? order(d.order) : null);
        toast(v.status !== 'paid' ? 'Marked as paid' : 'Marked as unpaid');
    }),
    blankInvoice: () => ACTIONS.openInvoiceApp(),
    openInvoiceApp() {
        const blank = { date: new Date().toISOString().slice(0, 10), supplier: supplierFromSettings(S.settings), buyer: {}, items: [{ description: '', qty: 1, unitPrice: 0, taxRate: Number(S.settings.sstRate) || 0 }] };
        window.open(window.MSInvoice.sendToEditor(blank, '../invoice/', 'Ocean'), '_blank');
    }
};

async function startActingWithCart(o) {
    const cart = { ...S.cart };
    await startActing(byId(S.users, o.clientId) || null);
    S.cart = cart; render();
}

/** Straight-line fallback route, cut into small steps for the simulator. */
function densify([a, b], n = 40) {
    return Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
}

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) fn(el.dataset, el.tagName === 'BUTTON' ? el : null);
});

document.addEventListener('input', (e) => {
    const kind = e.target.dataset.input;
    if (kind === 'search') {
        S.q = e.target.value;
        const q = S.q.toLowerCase();
        const list = S.products.filter((p) => p.active !== false && (!q || String(p.name).toLowerCase().includes(q)));
        $('.products').innerHTML = list.map(productCard).join('');
        const none = $('#no-match');
        if (none) none.hidden = list.length > 0;
    } else if (kind === 'qty') {
        setQty(e.target.dataset.id, Number(e.target.value) || 0);
    }
});

document.addEventListener('change', (e) => {
    if (e.target.hasAttribute('data-lang')) { setLang(e.target.value); if (S.profile) render(); else drawGate(); }
});
window.addEventListener('online', () => { drawGpsChip(); toast('Back online'); });
window.addEventListener('offline', () => { drawGpsChip(); toast('No connection. Changes are kept and sent when you are back online.', true); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });

// When the customer leaves a quantity box, show the amount actually in the cart (it may have been capped to stock)
document.addEventListener('change', (e) => {
    if (e.target.dataset.input === 'qty') e.target.value = S.cart[e.target.dataset.id] || '';
});

startI18n();
boot();
