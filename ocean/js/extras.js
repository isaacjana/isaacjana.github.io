/**
 * Ocean - features around the core flow:
 * alerts, WhatsApp messages, repeat (standing) orders, statements,
 * sales reports, stock history and the one-time Live Catch import.
 */
import { store } from './store.js';
import {
    PAYMENT, rm, round2, itemQty, itemPrice, fmtSlot, fmtDateTime, summariseItems, supplierFromSettings, dayKey
} from './model.js';
import { esc, $, toast, fail, openSheet, ask, readForm, select, downloadText } from './ui.js';
import * as flow from './flow.js';

let S = null;       // app state
let app = null;     // { render, loadPdf, trackUrl, priceList }
export function bindExtras(state, hooks) { S = state; app = hooks; }

const byId = (list, id) => list.find((x) => x.id === id);
const appUrl = () => new URL('./', location.href).href;

/* ================================================================== */
/* Alerts                                                              */
/* ================================================================== */
const ALERT_KEY = 'ocean_alerts';
let seen = null; // order id -> status, as of the last look

export const alertsOn = () => localStorage.getItem(ALERT_KEY) === 'on';

export async function toggleAlerts() {
    if (alertsOn()) { localStorage.setItem(ALERT_KEY, 'off'); toast('Alerts turned off'); return; }
    localStorage.setItem(ALERT_KEY, 'on');
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    const ok = 'Notification' in window && Notification.permission === 'granted';
    toast(ok ? 'Alerts on. You will be notified while Ocean is open, even in the background.' : 'Alerts on inside the app. Allow notifications in your browser to also see them when Ocean is in the background.');
}

function alertText(o, was) {
    const who = o.storeName, mine = o.driverId === S.user.uid;
    if (S.role === 'admin') {
        if (!was && o.status === 'requested') return ['New order', `${who}: ${summariseItems(o.items)}`];
        if (was === 'quoted' && o.status === 'confirmed') return ['Quote accepted', `${who} accepted ${rm(o.total)}. Ready to pack.`];
        if (was && o.status === 'cancelled') return ['Order cancelled', `${who} · ${o.orderNo}`];
        if (was && o.status === 'delivered') return ['Delivered', `${who} · ${o.payment.status === 'paid' ? 'payment collected' : 'not paid yet'}`];
    } else if (S.role === 'client') {
        if (o.status === 'quoted') return ['Your quote is ready', `${o.orderNo}: ${rm(o.total)}. Open to accept.`];
        if (was && o.status === 'ready') return ['Order packed', `${o.orderNo} is packed and waiting for the driver.`];
        if (was && o.status === 'delivering') return ['Driver on the way', `${o.orderNo}: track the delivery live.`];
        if (was && o.status === 'delivered') return ['Delivered', `${o.orderNo} has been delivered.`];
        if (was && o.status === 'cancelled') return ['Order cancelled', o.orderNo];
    } else if (o.status === 'ready' && was !== 'ready') {
        if (mine) return ['Job assigned to you', `${who} · ${fmtSlot(o.slot)}`];
        if (!o.driverId) return ['New job on the board', `${who} · ${fmtSlot(o.slot)}`];
    }
    return null;
}

/** Compare orders with the last look and announce what other people changed. */
export function checkAlerts() {
    if (!S.ordersReady) return;
    const now = new Map(S.orders.map((o) => [o.id, o.status]));
    const before = seen;
    seen = now;
    if (!before || !alertsOn()) return; // first load: nothing to compare with
    S.orders.forEach((o) => {
        const was = before.get(o.id);
        if (was === o.status) return;
        const last = (o.timeline || [])[o.timeline.length - 1];
        if (last && last.by && last.by === (S.profile.name || S.profile.email)) return; // my own action
        const text = alertText(o, was);
        if (!text) return;
        toast(`${text[0]}: ${text[1]}`);
        if (navigator.vibrate) navigator.vibrate(200);
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const opts = { body: text[1], icon: 'assets/icon-192.png', tag: o.id };
            // Phones only allow notifications through the service worker
            (navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : Promise.resolve(null))
                .then((reg) => (reg ? reg.showNotification(text[0], opts) : new Notification(text[0], opts)))
                .catch(() => { });
        }
    });
}
export const resetAlerts = () => { seen = null; };

/* ================================================================== */
/* WhatsApp messages                                                   */
/* ================================================================== */
/** The message a supplier sends a customer at the order's current step. */
export function customerMessage(o) {
    const biz = S.settings.name || 'Ocean';
    const track = app.trackUrl(o);
    const body = {
        requested: `we have received your order ${o.orderNo} and will confirm the weights shortly.`,
        quoted: `your quote for order ${o.orderNo} is ready: ${rm(o.total)}. Please accept it in Ocean so we can pack: ${appUrl()}`,
        confirmed: `order ${o.orderNo} is confirmed (${rm(o.total)}). Delivery: ${fmtSlot(o.slot)}.`,
        ready: `order ${o.orderNo} is packed. Delivery: ${fmtSlot(o.slot)}. Follow it here: ${track}`,
        delivering: `your order ${o.orderNo} is on the way${o.driverName ? ' with ' + o.driverName : ''}. Track it live: ${track}`,
        delivered: `order ${o.orderNo} has been delivered. Invoice ${o.invoiceNo || ''}: ${rm(o.total)} (${o.payment.status === 'paid' ? 'paid, thank you' : 'payment due'}).`,
        cancelled: `order ${o.orderNo} has been cancelled.`
    }[o.status];
    return `Hi ${o.storeName}, this is ${biz}: ${body}`;
}

/** The message a customer sends the supplier about an order. */
export function supplierMessage(o) {
    return `Hi ${S.settings.name || 'Ocean'}, this is ${o.storeName} about order ${o.orderNo} (${summariseItems(o.items)}, ${fmtSlot(o.slot)}).`;
}

/* ================================================================== */
/* Repeat (standing) orders                                            */
/* ================================================================== */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const daysText = (days) => (days.length === 7 ? 'Every day' : days.map((d) => DAYS[d]).join(', '));

/** Customer: repeat this order on chosen weekdays. Saved on their profile. */
export function openRepeat(o) {
    const sheet = openSheet({
        title: 'Repeat this order', form: true,
        render: () => ({
            body: `
                <div class="card small">${o.items.map((i) => `${esc(i.name)} · ${i.qty} ${esc(i.unit)}`).join('<br>')}</div>
                <div class="field"><span>Deliver every</span>
                    <div class="row wrap">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="check" style="min-width:74px"><input type="checkbox" data-day="${d}"><span>${DAYS[d]}</span></label>`).join('')}</div></div>
                ${select('Time', 'window', [['', 'As soon as possible'], ...['9am - 12pm', '12pm - 3pm', '3pm - 6pm'].map((w) => [w, w])], (o.slot && o.slot.window) || '')}
                <div class="notice">The order is created for you the day before each delivery. Prices follow the price list on that day, and you still approve the weighed quote.</div>`,
            foot: `<button class="btn block" data-save>Save repeat order</button>`
        }),
        onMount: (el) => $('[data-save]', el).addEventListener('click', async () => {
            const days = [...el.querySelectorAll('[data-day]:checked')].map((c) => Number(c.dataset.day));
            if (!days.length) return toast('Pick at least one day', true);
            const entry = {
                id: Math.random().toString(36).slice(2, 9), days, window: readForm(el).window,
                items: o.items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, qty: i.qty })),
                method: o.payment.method, notes: o.notes || '', last: dayKey(Date.now())
            };
            try {
                await store.set('users', S.user.uid, { standing: [...(S.profile.standing || []), entry] });
                sheet.close(); toast('Repeat order saved. See it under Account.');
            } catch (e) { fail(e, 'save the repeat order'); }
        })
    });
}

export function standingCards() {
    const list = S.profile.standing || [];
    if (!list.length) return '';
    return `<h2>Repeat orders</h2><div class="list">${list.map((s) => `
        <div class="card row"><div class="thumb">🔁</div>
            <div class="grow"><b>${esc(daysText(s.days))}${s.window ? ' · ' + esc(s.window) : ''}</b><div class="small mute clip">${esc(s.items.map((i) => `${i.name} ${i.qty}${i.unit}`).join(', '))}</div></div>
            <button class="btn sm bad" data-act="stopRepeat" data-id="${s.id}">Stop</button></div>`).join('')}</div>`;
}

export async function stopRepeat(id) {
    if (!(await ask({ title: 'Stop this repeat order?', text: 'No more orders will be created from it. Orders already placed are not affected.', yes: 'Stop', danger: true }))) return;
    try { await store.set('users', S.user.uid, { standing: (S.profile.standing || []).filter((s) => s.id !== id) }); toast('Repeat order stopped'); } catch (e) { fail(e, 'stop the repeat order'); }
}

const running = new Set();
/**
 * Create the orders that are due from repeat orders: tomorrow's (and today's,
 * if missed). There is no server, so this runs whenever the customer's or the
 * supplier's app is open. Each order gets a fixed id per day, so two devices
 * running at once cannot create it twice.
 */
export async function runStanding(people) {
    const today = dayKey(Date.now());
    for (const u of people) {
        const list = u.standing || [];
        if (!list.length || running.has(u.id)) continue;
        const due = [];
        list.forEach((s) => [0, 1].forEach((offset) => {
            const date = new Date(Date.now() + offset * 86400000);
            const key = dayKey(date);
            if (s.days.includes(date.getDay()) && (s.last || '') < key) due.push({ s, key });
        }));
        if (!due.length) continue;
        running.add(u.id);
        try {
            const prices = await app.priceList(u.id);
            // Mark them done first, so another device opening now does not repeat the work
            const latest = (sid) => due.filter((d) => d.s.id === sid).map((d) => d.key).sort().pop();
            await store.set('users', u.id, { standing: list.map((s) => (latest(s.id) ? { ...s, last: latest(s.id) } : s)) });
            for (const { s, key } of due) {
                if (key < today) continue;
                const items = s.items.map((i) => {
                    const p = byId(S.products, i.id);
                    return p && p.active !== false && Number(p.quantity) > 0 ? { id: p.id, name: p.name, unit: p.unit, price: Number(prices[p.id] ?? p.price) || 0, qty: i.qty } : null;
                }).filter(Boolean);
                if (!items.length) continue;
                await flow.createOrder({
                    id: `rep_${u.id}_${s.id}_${key}`.replace(/[^\w-]/g, ''), standing: true,
                    customer: { id: u.id, name: u.name, storeName: u.storeName, phone: u.phone, tin: u.tin, address: u.address, loc: u.loc || null },
                    items, slot: { date: key, window: s.window || '' }, notes: [s.notes, 'Repeat order'].filter(Boolean).join(' · '),
                    method: s.method, deliveryFee: Number(S.settings.deliveryFee) || 0
                });
            }
        } catch (e) { console.warn('Repeat orders could not be created', e); }
        setTimeout(() => running.delete(u.id), 15000);
    }
}

/* ================================================================== */
/* Statements                                                          */
/* ================================================================== */
const monthLabel = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });

function statementData(clientId, month) {
    const person = clientId === S.user.uid ? S.profile : (byId(S.users, clientId) || {});
    const rows = S.invoices.filter((v) => v.clientId === clientId && String(v.date).startsWith(month))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((v) => ({ date: v.date, invoiceNo: v.invoiceNo, reference: v.reference || v.orderNo || '', amount: v.grandTotal, status: v.status }));
    return {
        supplier: supplierFromSettings(S.settings), period: monthLabel(month), rows, paymentQr: S.settings.qr || '',
        buyer: { name: person.storeName || person.name || 'Customer', tin: person.tin || '', phone: person.phone || '', address: person.address || '' }
    };
}

/** Monthly statement for one customer: PDF, or a consolidated invoice in the Invoice app. */
export function openStatement(clientId) {
    const admin = S.role === 'admin';
    const month = dayKey(Date.now()).slice(0, 7);
    const clients = S.users.filter((u) => u.role === 'client');
    const sheet = openSheet({
        title: 'Monthly statement', form: true,
        render: () => ({
            body: `
                ${admin ? select('Customer', 'client', clients.map((u) => [u.id, u.storeName || u.name || u.email]), clientId || '') : ''}
                <label class="field"><span>Month</span><input class="input" type="month" name="month" value="${month}" max="${month}"></label>
                <div class="card small" data-sum></div>`,
            foot: `${admin ? '<button class="btn ghost" data-consol>Consolidated invoice</button>' : ''}<button class="btn" data-pdf>⬇ Statement PDF</button>`
        }),
        onMount: (el) => {
            const data = () => { const f = readForm(el); return statementData(admin ? f.client : S.user.uid, f.month || month); };
            const sum = () => {
                const d = data(), live = d.rows.filter((r) => r.status !== 'void');
                const billed = live.reduce((t, r) => t + r.amount, 0), paid = live.filter((r) => r.status === 'paid').reduce((t, r) => t + r.amount, 0);
                $('[data-sum]', el).innerHTML = d.rows.length
                    ? `<div class="lines"><div><span>${live.length} ${live.length === 1 ? 'invoice' : 'invoices'}</span><span class="num">${rm(billed)}</span></div><div><span>Paid</span><span class="num">${rm(paid)}</span></div><div class="total"><span>Balance due</span><span class="num">${rm(billed - paid)}</span></div></div>`
                    : '<span class="mute">No invoices in this month.</span>';
            };
            sum();
            el.addEventListener('change', sum);
            el.addEventListener('click', async (e) => {
                const d = data();
                if (e.target.hasAttribute('data-pdf')) {
                    if (!d.rows.length) return toast('There are no invoices in this month', true);
                    try { await app.loadPdf(); window.MSInvoice.downloadStatement(d); } catch (err) { fail(err, 'create the statement'); }
                } else if (e.target.hasAttribute('data-consol')) {
                    const live = d.rows.filter((r) => r.status !== 'void');
                    if (!live.length) return toast('There are no invoices in this month', true);
                    const inv = {
                        invoiceNo: `CONS-${(readForm(el).month || month).replace('-', '')}`, date: dayKey(Date.now()), isConsolidated: true,
                        supplier: d.supplier, buyer: d.buyer,
                        items: live.map((r) => ({ description: `${r.invoiceNo} (${r.date})`, qty: 1, unitPrice: r.amount, taxRate: 0 }))
                    };
                    window.open(window.MSInvoice.sendToEditor(inv, '../invoice/', `Ocean statement ${d.period}`), '_blank');
                }
            });
        }
    });
}

/* ================================================================== */
/* Stock history                                                       */
/* ================================================================== */
const REASON = { received: 'Received', packed: 'Packed for order', returned: 'Returned (order cancelled)', correction: 'Count corrected', wastage: 'Written off' };

export function stockLogRows(productId, limit = 60) {
    const rows = S.stockLog.filter((r) => !productId || r.productId === productId).slice(0, limit);
    if (!rows.length) return '<p class="small mute">No stock movements recorded yet.</p>';
    return `<div class="lines small">${rows.map((r) => `<div><span>${productId ? '' : `<b>${esc(r.name)}</b><br>`}${esc(REASON[r.reason] || r.reason)}${r.ref ? ' ' + esc(r.ref) : ''}<br><span class="mute">${fmtDateTime(r.at)} · ${esc(r.by || '')}</span></span><b class="num" style="color:var(${r.delta < 0 ? '--bad' : '--ok'})">${r.delta > 0 ? '+' : ''}${r.delta} ${esc(r.unit || '')}</b></div>`).join('')}</div>`;
}

export function openStockLog() {
    openSheet({ title: 'Stock history', full: true, render: () => ({ body: `<div class="card">${stockLogRows(null, 150)}</div>` }) });
}

/* ================================================================== */
/* Sales reports                                                       */
/* ================================================================== */
let reportDays = 7;

function report(days) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    const from = start.getTime();
    const done = S.orders.filter((o) => o.status === 'delivered' && (o.deliveredAt || o.updatedAt) >= from);
    const daily = new Map();
    for (let i = 0; i < days; i++) daily.set(dayKey(from + i * 86400000), 0);
    const products = new Map(), customers = new Map();
    done.forEach((o) => {
        const k = dayKey(o.deliveredAt || o.updatedAt);
        daily.set(k, round2((daily.get(k) || 0) + o.total));
        const c = customers.get(o.storeName) || { name: o.storeName, orders: 0, revenue: 0 };
        c.orders++; c.revenue += o.total; customers.set(o.storeName, c);
        o.items.forEach((i) => {
            const p = products.get(i.name) || { name: i.name, unit: i.unit, qty: 0, revenue: 0 };
            p.qty += itemQty(i); p.revenue += itemQty(i) * itemPrice(i); products.set(i.name, p);
        });
    });
    const waste = S.stockLog.filter((r) => r.reason === 'wastage' && r.at >= from);
    const wasteBy = new Map();
    waste.forEach((r) => {
        const w = wasteBy.get(r.name) || { name: r.name, unit: r.unit, qty: 0, cost: 0 };
        const p = byId(S.products, r.productId);
        w.qty += -r.delta; w.cost += -r.delta * (p ? Number(p.price) || 0 : 0); wasteBy.set(r.name, w);
    });
    const top = (m) => [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    return {
        done, daily: [...daily.entries()], revenue: round2(done.reduce((t, o) => t + o.total, 0)),
        cancelled: S.orders.filter((o) => o.status === 'cancelled' && (o.updatedAt || o.createdAt) >= from).length,
        products: top(products), customers: top(customers), waste: [...wasteBy.values()].sort((a, b) => b.cost - a.cost)
    };
}

/** Daily revenue as thin bars: one series, so one colour and no legend. */
function barChart(daily) {
    const W = 340, H = 150, padL = 4, padB = 18, padT = 16;
    const max = Math.max(1, ...daily.map(([, v]) => v));
    const slot = (W - padL * 2) / daily.length;
    const bw = Math.max(2, Math.min(22, slot - 2));
    const y = (v) => padT + (H - padT - padB) * (1 - v / max);
    const label = (k) => new Date(k + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
    const bars = daily.map(([k, v], i) => {
        const x = padL + i * slot + (slot - bw) / 2, top = y(v), h = H - padB - top, r = Math.min(4, bw / 2, h);
        const shape = v > 0 ? `<path d="M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${H - padB} Z" fill="var(--brand)"/>` : '';
        return `<g data-tip="${label(k)}: ${rm(v)}">${shape}<rect x="${padL + i * slot}" y="0" width="${slot}" height="${H}" fill="transparent"/></g>`;
    }).join('');
    const ticks = [0, Math.floor((daily.length - 1) / 2), daily.length - 1].filter((v, i, a) => a.indexOf(v) === i);
    return `
        <div class="chart" style="position:relative">
            <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Revenue delivered per day">
                <line x1="0" x2="${W}" y1="${y(max)}" y2="${y(max)}" stroke="var(--line)" stroke-dasharray="3 4"/>
                <text x="${W}" y="${y(max) - 4}" text-anchor="end" font-size="10" fill="var(--mute)">${rm(max)}</text>
                <line x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}" stroke="var(--line)"/>
                ${bars}
                ${ticks.map((i) => `<text x="${padL + i * slot + slot / 2}" y="${H - 4}" text-anchor="${i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'}" font-size="10" fill="var(--mute)">${label(daily[i][0])}</text>`).join('')}
            </svg>
            <div class="tip" hidden></div>
        </div>`;
}

export function openReports() {
    const sheet = openSheet({
        title: 'Sales report', full: true,
        render: () => {
            const r = report(reportDays);
            const rows = (list, fn) => (list.length ? `<div class="lines small">${list.map(fn).join('')}</div>` : '<p class="small mute">Nothing in this period.</p>');
            return {
                body: `
                    <div class="seg">${[[7, '7 days'], [30, '30 days'], [90, '90 days']].map(([d, l]) => `<button class="${reportDays === d ? 'on' : ''}" data-days="${d}">${l}</button>`).join('')}</div>
                    <div class="kpis">
                        <div class="kpi"><b class="num">${rm(r.revenue).replace('RM ', '')}</b><span>RM delivered</span></div>
                        <div class="kpi"><b>${r.done.length}</b><span>Orders delivered</span></div>
                        <div class="kpi"><b class="num">${rm(r.done.length ? r.revenue / r.done.length : 0).replace('RM ', '')}</b><span>RM average order</span></div>
                        <div class="kpi"><b>${r.cancelled}</b><span>Cancelled</span></div>
                    </div>
                    <div class="card stack tight"><h3>Revenue delivered per day</h3>${barChart(r.daily)}
                        <details class="small"><summary class="mute">Show as a table</summary><div class="lines">${r.daily.filter(([, v]) => v > 0).map(([k, v]) => `<div><span>${k}</span><span class="num">${rm(v)}</span></div>`).join('') || '<span class="mute">No deliveries.</span>'}</div></details></div>
                    <div class="card stack tight"><h3>Top products</h3>${rows(r.products, (p) => `<div><span>${esc(p.name)}<br><span class="mute">${round2(p.qty)} ${esc(p.unit)} sold</span></span><b class="num">${rm(p.revenue)}</b></div>`)}</div>
                    <div class="card stack tight"><h3>Top customers</h3>${rows(r.customers, (c) => `<div><span>${esc(c.name)}<br><span class="mute">${c.orders} ${c.orders === 1 ? 'order' : 'orders'}</span></span><b class="num">${rm(c.revenue)}</b></div>`)}</div>
                    <div class="card stack tight"><h3>Wastage</h3><p class="tiny mute">Stock written off, valued at today's list price.</p>${rows(r.waste, (w) => `<div><span>${esc(w.name)}<br><span class="mute">${round2(w.qty)} ${esc(w.unit)}</span></span><b class="num">${rm(w.cost)}</b></div>`)}</div>`,
                foot: `<button class="btn ghost block" data-csv>⬇ Export delivered orders (CSV)</button>`
            };
        },
        onMount: (el) => {
            el.addEventListener('click', (e) => {
                if (e.target.dataset.days) { reportDays = Number(e.target.dataset.days); sheet.draw(); }
                if (e.target.hasAttribute('data-csv')) {
                    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                    const lines = [['Delivered', 'Order', 'Invoice', 'Customer', 'Items', 'Total (RM)', 'Payment', 'Paid', 'Driver'].join(',')];
                    report(reportDays).done.forEach((o) => lines.push([dayKey(o.deliveredAt || o.updatedAt), o.orderNo, o.invoiceNo || '', o.storeName, summariseItems(o.items), o.total.toFixed(2), PAYMENT[o.payment.method] || '', o.payment.status, o.driverName || ''].map(q).join(',')));
                    downloadText(`ocean-sales-${reportDays}d-${dayKey(Date.now())}.csv`, lines.join('\n'));
                }
            });
            // Tap or hover a bar to read its value
            const show = (e) => {
                const g = e.target.closest('[data-tip]'), tip = $('.tip', el);
                if (!tip) return;
                if (!g) { tip.hidden = true; return; }
                const box = $('.chart', el).getBoundingClientRect();
                tip.textContent = g.dataset.tip; tip.hidden = false;
                tip.style.left = Math.max(0, Math.min(box.width - tip.offsetWidth, e.clientX - box.left - tip.offsetWidth / 2)) + 'px';
            };
            el.addEventListener('pointermove', show);
            el.addEventListener('pointerdown', show);
        }
    });
}

/* ================================================================== */
/* One-time import from the old Live Catch app                         */
/* ================================================================== */
export async function importLiveCatch() {
    if (!(await ask({ title: 'Import from Live Catch?', text: 'Copies the stock list and delivery clients from the old Live Catch app into Ocean. Anything with a name that already exists here is skipped, so it is safe to run twice.', yes: 'Import' }))) return;
    try {
        const { stock, clients } = await store.readLiveCatch();
        const have = new Set(S.products.map((p) => String(p.name).toLowerCase()));
        const known = new Set(S.users.map((u) => String(u.storeName || u.name || '').toLowerCase()));
        let p = 0, c = 0;
        for (const item of stock) {
            if (!item || !item.name || have.has(String(item.name).toLowerCase())) continue;
            await store.add('products', { name: item.name, price: Number(item.price) || 0, unit: item.unit || 'kg', quantity: Number(item.quantity) || 0, image: item.image || '', icon: '🐟', lowAt: 5, active: true, updatedAt: Date.now() });
            p++;
        }
        for (const cl of clients) {
            if (!cl || !cl.name || known.has(String(cl.name).toLowerCase())) continue;
            await store.add('users', { role: 'client', manual: true, name: cl.name, storeName: cl.name, address: cl.address || '', oceanSince: Date.now() });
            c++;
        }
        toast(`Imported ${p} ${p === 1 ? 'product' : 'products'} and ${c} ${c === 1 ? 'customer' : 'customers'}.`);
    } catch (e) { fail(e, 'import from Live Catch'); }
}

