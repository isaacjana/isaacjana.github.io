/**
 * Ocean - business rules shared by the app and the public tracking page.
 *
 * Order flow:
 *   requested -> quoted -> confirmed -> ready -> delivering -> delivered
 *                   (any step before delivery can end in "cancelled")
 */

export const STATUS = {
    requested: { label: 'Requested', tone: 'warn', hint: 'Waiting for the supplier to confirm weights and prices' },
    quoted: { label: 'Quote sent', tone: 'info', hint: 'Waiting for the customer to accept the quote' },
    confirmed: { label: 'Confirmed', tone: 'info', hint: 'Waiting to be packed' },
    ready: { label: 'Packed', tone: 'brand', hint: 'Packed and waiting for the driver' },
    delivering: { label: 'On the way', tone: 'brand', hint: 'The driver is on the way' },
    delivered: { label: 'Delivered', tone: 'ok', hint: 'Delivered' },
    cancelled: { label: 'Cancelled', tone: 'bad', hint: 'This order was cancelled' }
};

export const STEPS = ['requested', 'quoted', 'confirmed', 'ready', 'delivering', 'delivered'];
export const ACTIVE = ['requested', 'quoted', 'confirmed', 'ready', 'delivering'];

// Statuses written by the earlier versions of Ocean / Live Catch
const LEGACY_STATUS = {
    pending: 'requested', pending_acceptance: 'quoted', accepted: 'confirmed',
    picked_up: 'delivering', completed: 'delivered'
};

export const PAYMENT = { cod: 'Cash on delivery', transfer: 'Bank transfer', credit: 'Credit terms' };

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const rm = (n) => 'RM ' + round2(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Firestore Timestamp, Date, ISO string or number -> milliseconds. */
export function ms(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
}

export const itemQty = (i) => Number(i.finalQty ?? i.qty) || 0;
export const itemPrice = (i) => Number(i.finalPrice ?? i.price) || 0;

/** Totals for a set of order lines. SST applies to goods only, not the delivery fee. */
export function calcTotals(items, deliveryFee, sstRate) {
    const subtotal = round2((items || []).reduce((s, i) => s + itemQty(i) * itemPrice(i), 0));
    const tax = round2(subtotal * (Number(sstRate) || 0) / 100);
    const fee = round2(deliveryFee);
    return { subtotal, tax, deliveryFee: fee, total: round2(subtotal + tax + fee) };
}

/** Bring any stored order (old or new) into the current shape. */
export function normaliseOrder(o) {
    const status = STATUS[o.status] ? o.status : (LEGACY_STATUS[String(o.status || '').toLowerCase().replace(/\s+/g, '_')] || 'requested');
    const items = (o.items || []).map((i) => ({ ...i, qty: Number(i.qty) || 0, price: Number(i.price) || 0, unit: i.unit || 'kg' }));
    const createdAt = ms(o.createdAt);
    const out = {
        deliveryFee: 0, sstRate: 0, payment: { method: 'cod', status: 'unpaid' }, timeline: [],
        ...o, status, items, createdAt
    };
    out.orderNo = o.orderNo || ('OC-' + String(o.id || '').slice(0, 6).toUpperCase());
    out.storeName = o.storeName || o.clientName || (o.customer && o.customer.name) || 'Customer';
    out.deliveryAddress = o.deliveryAddress || (o.customer && o.customer.address) || '';
    Object.assign(out, calcTotals(items, out.deliveryFee, out.sstRate));
    if (!items.length && o.total) out.total = Number(o.total) || 0;
    return out;
}

export function newOrderNo() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `OC-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Hard-to-guess code for the public tracking link. */
export function newTrackCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

export function summariseItems(items) {
    const list = items || [];
    if (!list.length) return 'No items';
    const first = list.slice(0, 2).map((i) => `${i.name} ${itemQty(i)}${i.unit}`).join(', ');
    return list.length > 2 ? `${first} +${list.length - 2} more` : first;
}

/**
 * The public tracking record: only what a recipient needs to follow a
 * delivery. Prices, the customer's phone and account details stay private.
 */
export function trackingFromOrder(o, supplier) {
    return {
        code: o.trackCode,
        orderNo: o.orderNo,
        status: o.status,
        storeName: o.storeName || '',
        address: o.deliveryAddress || '',
        dest: o.dest || null,
        slot: o.slot || null,
        items: (o.items || []).map((i) => ({ name: i.name, qty: itemQty(i), unit: i.unit })),
        driver: o.driverId ? { name: o.driverName || 'Driver', phone: o.driverPhone || '', vehicle: o.vehicle || '' } : null,
        loc: o.driverLoc || null,
        startedAt: o.startedAt || null,
        deliveredAt: o.deliveredAt || null,
        receivedBy: (o.pod && o.pod.recipient) || '',
        supplier: { name: (supplier && supplier.name) || 'Ocean', phone: (supplier && supplier.phone) || '' },
        updatedAt: Date.now()
    };
}

/** Build the invoice for an order, in the shape the Invoice app uses. */
export function invoiceFromOrder(o, settings, invoiceNo) {
    const rate = Number(o.sstRate) || 0;
    const items = (o.items || []).filter((i) => itemQty(i) > 0).map((i) => ({
        description: i.name, qty: itemQty(i), unit: i.unit, unitPrice: itemPrice(i), taxRate: rate
    }));
    if (o.deliveryFee > 0) items.push({ description: 'Delivery', qty: 1, unit: '', unitPrice: round2(o.deliveryFee), taxRate: 0 });
    const t = calcTotals(o.items, o.deliveryFee, rate);
    return {
        invoiceNo,
        date: new Date().toISOString().slice(0, 10),
        reference: o.orderNo,
        orderId: o.id,
        orderNo: o.orderNo,
        clientId: o.clientId || '',
        status: o.payment && o.payment.status === 'paid' ? 'paid' : 'unpaid',
        isConsolidated: false,
        supplier: supplierFromSettings(settings),
        buyer: { name: o.storeName || o.clientName || 'Walk-in Customer', tin: o.tin || '', phone: o.phone || '', address: o.deliveryAddress || '' },
        items,
        subtotal: round2(t.subtotal + t.deliveryFee),
        totalTax: t.tax,
        grandTotal: t.total,
        notes: PAYMENT[o.payment && o.payment.method] || '',
        createdAt: Date.now()
    };
}

export function supplierFromSettings(s) {
    s = s || {};
    return { name: s.name || '', tin: s.tin || '', msic: s.msic || '', sst: s.sstNo || '', phone: s.phone || '', address: s.address || '' };
}

/** Invoices saved by the previous version only had a reference and an amount. */
export function normaliseInvoice(v) {
    if (v.invoiceNo && v.buyer) return { status: 'unpaid', ...v, createdAt: ms(v.createdAt) };
    const items = (v.items || []).map((i) => ({
        description: i.name || i.description || 'Item', qty: itemQty(i), unit: i.unit || '', unitPrice: itemPrice(i), taxRate: 0
    }));
    const total = Number(v.amount ?? v.grandTotal) || items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const created = ms(v.createdAt);
    return {
        ...v,
        invoiceNo: v.invoiceNo || v.invoiceRef || 'INV',
        date: v.date || new Date(created || Date.now()).toISOString().slice(0, 10),
        status: v.status || 'unpaid',
        supplier: v.supplier || { name: '', tin: v.tin || '', msic: v.msic || '', sst: v.sst || '', phone: '', address: '' },
        buyer: v.buyer || { name: v.storeName || v.clientName || 'Customer', tin: '', phone: '', address: v.address || '' },
        items, subtotal: round2(total), totalTax: 0, grandTotal: round2(total), createdAt: created
    };
}

export function timeAgo(t) {
    const s = Math.max(0, Math.round((Date.now() - ms(t)) / 1000));
    if (s < 10) return 'just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    return new Date(ms(t)).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

export function fmtDateTime(t) {
    if (!t) return '';
    return new Date(ms(t)).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function fmtSlot(slot) {
    if (!slot || !slot.date) return 'As soon as possible';
    const d = new Date(slot.date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    const day = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
    return slot.window ? `${day}, ${slot.window}` : day;
}

export const isToday = (t) => new Date(ms(t)).toDateString() === new Date().toDateString();
