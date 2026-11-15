/**
 * Ocean - the business flow.
 * Every change of order state goes through here, so stock, invoices, the
 * timeline and the public tracking record always move together.
 *
 *   customer  places order ............................ requested
 *   supplier  weighs, sends quote ..................... quoted      (or confirms at listed prices)
 *   customer  accepts quote ........................... confirmed
 *   supplier  packs: stock out + invoice issued ....... ready       (driver assigned, or left on the job board)
 *   driver    starts delivery: live GPS sharing ....... delivering
 *   driver    hands over, records payment ............. delivered
 */
import { store } from './store.js';
import {
    newOrderNo, newTrackCode, itemQty, calcTotals, trackingFromOrder, invoiceFromOrder
} from './model.js';
import { geoErrorText, haversineKm } from './geo.js';

let ctx = null; // the app state: { profile, settings, user }
export const bindFlow = (state) => { ctx = state; };

const me = () => (ctx.profile && (ctx.profile.name || ctx.profile.email)) || 'Someone';
let mirrorWarned = false;

/** Keep the public tracking record in step with the order. Never blocks the order itself. */
export function mirror(order) {
    if (!order.trackCode) return;
    store.set('tracking', order.trackCode, trackingFromOrder(order, ctx.settings)).catch((e) => {
        if (!mirrorWarned) console.warn('Public tracking record could not be written (check the "tracking" database rule).', e);
        mirrorWarned = true;
    });
}

async function move(order, status, patch = {}) {
    const data = {
        ...patch, status, updatedAt: Date.now(),
        timeline: [...(order.timeline || []), { status, at: Date.now(), by: me(), note: patch.cancelReason || '' }]
    };
    await store.update('orders', order.id, data);
    mirror({ ...order, ...data });
}

const driverFields = (d) => d
    ? { driverId: d.id, driverName: d.name || 'Driver', driverPhone: d.phone || '', vehicle: [d.vehicle, d.plate].filter(Boolean).join(' · ') }
    : { driverId: null, driverName: '', driverPhone: '', vehicle: '' };

/** Create an order. Customers create "requested" orders; the supplier can enter a confirmed one directly. */
export async function createOrder({ customer, items, slot, notes, method, deliveryFee, confirmed }) {
    const now = Date.now();
    const status = confirmed ? 'confirmed' : 'requested';
    const order = {
        orderNo: newOrderNo(), trackCode: newTrackCode(), status,
        clientId: customer.id || '', clientName: customer.name || '', storeName: customer.storeName || customer.name || 'Walk-in Customer',
        phone: customer.phone || '', tin: customer.tin || '', deliveryAddress: customer.address || '', dest: customer.loc || null,
        items, deliveryFee: Number(deliveryFee) || 0, sstRate: Number(ctx.settings.sstRate) || 0,
        slot, notes: notes || '', payment: { method: method || 'cod', status: 'unpaid' },
        driverId: null, createdBy: ctx.user.uid,
        timeline: [{ status, at: now, by: me() }], createdAt: now, updatedAt: now
    };
    Object.assign(order, calcTotals(items, order.deliveryFee, order.sstRate));
    order.id = await store.add('orders', order);
    mirror(order);
    return order;
}

/** Supplier sets the weighed quantities and final prices. `confirm` skips the customer's acceptance. */
export function saveQuote(order, items, deliveryFee, nextStatus) {
    const patch = { items, deliveryFee: Number(deliveryFee) || 0, ...calcTotals(items, deliveryFee, order.sstRate) };
    if (nextStatus === order.status) return store.update('orders', order.id, { ...patch, updatedAt: Date.now() }).then(() => mirror({ ...order, ...patch }));
    return move(order, nextStatus, patch);
}

export const confirmOrder = (order) => move(order, 'confirmed');
export const acceptQuote = (order) => move(order, 'confirmed');

/** Pack the order: take the stock out of the tanks, issue the invoice, hand it to a driver. */
export async function packOrder(order, driver) {
    const invoiceNo = await store.nextInvoiceNo();
    const invoice = invoiceFromOrder(order, ctx.settings, invoiceNo);
    const invoiceId = await store.add('invoices', invoice);
    await Promise.all(order.items.filter((i) => i.id && itemQty(i) > 0).map((i) =>
        store.inc('products', i.id, 'quantity', -itemQty(i)).catch((e) => console.warn('Stock not adjusted for', i.name, e))));
    await move(order, 'ready', {
        invoiceId, invoiceNo, stockTaken: true, packedAt: Date.now(),
        trackCode: order.trackCode || newTrackCode(), ...driverFields(driver)
    });
    return invoiceNo;
}

export async function assignDriver(order, driver) {
    const patch = { ...driverFields(driver), updatedAt: Date.now() };
    await store.update('orders', order.id, patch);
    mirror({ ...order, ...patch });
}

export async function startDelivery(order) {
    await move(order, 'delivering', { startedAt: Date.now(), driverLoc: null });
}

export async function completeDelivery(order, { recipient, paid, method }) {
    const payment = paid
        ? { method: method || order.payment.method, status: 'paid', paidAt: Date.now(), collectedBy: me() }
        : order.payment;
    await move(order, 'delivered', { deliveredAt: Date.now(), pod: { recipient: recipient || '', by: me() }, payment });
}

/** Cancel. If the order was already packed, the stock goes back and the invoice is voided. */
export async function cancelOrder(order, reason) {
    if (order.stockTaken) {
        await Promise.all(order.items.filter((i) => i.id && itemQty(i) > 0).map((i) =>
            store.inc('products', i.id, 'quantity', itemQty(i)).catch(() => { })));
        if (order.invoiceId) await store.update('invoices', order.invoiceId, { status: 'void' }).catch(() => { });
    }
    await move(order, 'cancelled', { cancelReason: reason || '', stockTaken: false });
}

export async function setInvoicePaid(invoice, paid, order) {
    await store.update('invoices', invoice.id, { status: paid ? 'paid' : 'unpaid', paidAt: paid ? Date.now() : null });
    if (order) await store.update('orders', order.id, { payment: { ...order.payment, status: paid ? 'paid' : 'unpaid', paidAt: paid ? Date.now() : null } });
}

/**
 * Drivers cannot edit invoices, so when a driver records a payment the
 * supplier's app marks the matching invoice as paid the next time it is open.
 */
const reconciling = new Set();
export function reconcileInvoices(orders, invoices) {
    invoices.forEach((inv) => {
        if (inv.status !== 'unpaid' || !inv.orderId || reconciling.has(inv.id)) return;
        const o = orders.find((x) => x.id === inv.orderId);
        if (o && o.payment && o.payment.status === 'paid') {
            reconciling.add(inv.id);
            store.update('invoices', inv.id, { status: 'paid', paidAt: o.payment.paidAt || Date.now() })
                .catch(() => { }).finally(() => setTimeout(() => reconciling.delete(inv.id), 5000));
        }
    });
}

/* ------------------------------------------------------------------ */
/* Live location sharing (driver)                                      */
/* ------------------------------------------------------------------ */
const SEND_EVERY_MS = 5000;     // never write more often than this
const HEARTBEAT_MS = 20000;     // write at least this often, even when parked
const MIN_MOVE_KM = 0.008;      // ignore GPS jitter under ~8 m

export const tracker = {
    order: null, state: 'off', error: '', last: null, onChange: null,
    _watch: null, _sentAt: 0, _sentPos: null, _lock: null, _sim: null,

    /** Start sharing this device's position for an order that is out for delivery. */
    start(order) {
        if (this.order && this.order.id === order.id && this.state !== 'off') { this.order = order; return; }
        this.stop();
        this.order = order;
        this._sentAt = 0; this._sentPos = null;
        if (!navigator.geolocation) return this._set('error', 'This device does not support location.');
        this._set('starting');
        this._watch = navigator.geolocation.watchPosition(
            (p) => this._got({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, heading: p.coords.heading, speed: p.coords.speed }),
            (e) => this._set(e.code === 1 ? 'denied' : 'error', geoErrorText(e)),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
        this._keepAwake();
    },

    stop() {
        if (this._watch !== null && navigator.geolocation) navigator.geolocation.clearWatch(this._watch);
        clearInterval(this._sim);
        if (this._lock) { this._lock.release().catch(() => { }); this._lock = null; }
        this._watch = null; this._sim = null; this.order = null; this.last = null;
        this._set('off');
    },

    /** Demo only: drive along a route so tracking can be shown without leaving the desk. */
    simulate(path) {
        clearInterval(this._sim);
        if (this._watch !== null) { navigator.geolocation.clearWatch(this._watch); this._watch = null; }
        let i = 0;
        const stride = Math.max(1, Math.round(path.length / 45));
        this._sim = setInterval(() => {
            i = Math.min(path.length - 1, i + stride);
            this._sentAt = 0; // the simulator writes every step
            this._got({ lat: path[i][0], lng: path[i][1], acc: 5, heading: null, speed: 8 });
            if (i >= path.length - 1) { clearInterval(this._sim); this._sim = null; }
        }, 1000);
    },

    _got(pos) {
        if (!this.order) return;
        this.last = { ...pos, ts: Date.now() };
        this._set('on');
        const since = Date.now() - this._sentAt;
        const moved = this._sentPos ? haversineKm(this._sentPos, pos) : Infinity;
        if (since < SEND_EVERY_MS || (moved < MIN_MOVE_KM && since < HEARTBEAT_MS)) return;
        this._sentAt = Date.now(); this._sentPos = pos;
        const loc = { lat: pos.lat, lng: pos.lng, acc: Math.round(pos.acc || 0), heading: pos.heading ?? null, speed: pos.speed ?? null, ts: Date.now() };
        const { id, trackCode } = this.order;
        store.update('orders', id, { driverLoc: loc }).catch((e) => this._set('error', 'Position could not be sent: ' + (e.message || 'no connection')));
        // Position only: the order's status is mirrored separately, so a late GPS fix can never undo "delivered"
        if (trackCode) store.set('tracking', trackCode, { loc, updatedAt: Date.now() }).catch(() => { });
    },

    _set(state, error = '') {
        this.state = state; this.error = error;
        if (this.onChange) this.onChange();
    },

    /** Keep the screen on while driving: phones stop GPS updates for a web page once the screen locks. */
    async _keepAwake() {
        try {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') this._lock = await navigator.wakeLock.request('screen');
        } catch (e) { /* not supported or refused: tracking still works while the page is open */ }
    }
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && tracker.order && tracker.state !== 'off') tracker._keepAwake();
});
