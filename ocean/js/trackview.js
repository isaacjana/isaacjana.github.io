/**
 * Ocean - live delivery view.
 * Used inside the app (customer and supplier) and by the public tracking
 * page. Feed it a tracking record (see trackingFromOrder) each time the
 * data changes; it moves the truck, redraws the route and updates the ETA.
 */
import { STATUS, timeAgo, fmtSlot } from './model.js';
import { makeMap, pin, route, glide, haversineKm } from './geo.js';
import { esc } from './ui.js';

const TRACK_STEPS = [['confirmed', 'Confirmed'], ['ready', 'Packed'], ['delivering', 'On the way'], ['delivered', 'Delivered']];
const ORDER = ['requested', 'quoted', 'confirmed', 'ready', 'delivering', 'delivered'];
const STALE_MS = 90000;

export function createTrackView(root, { depot, extra }) {
    root.innerHTML = `
        <div class="map" data-map></div>
        <div class="pad" style="padding-top:14px" data-panel></div>`;
    const panel = root.querySelector('[data-panel]');
    let map = null, mapFailed = false, truck = null, destPin = null, line = null;
    let cur = null, eta = null, lastRouteAt = 0, lastRouteFrom = null, fitted = false;

    const ready = makeMap(root.querySelector('[data-map]'), depot).then((m) => { map = m; }).catch(() => { mapFailed = true; });
    const ticker = setInterval(() => cur && drawPanel(), 5000);

    async function drawMap() {
        await ready;
        if (!map || !cur) return;
        const L = window.L;
        const { dest, loc, status } = cur;
        if (dest && !destPin) destPin = L.marker([dest.lat, dest.lng], { icon: pin('🏠', 'dest') }).addTo(map);
        const moving = status === 'delivering' && loc;
        if (moving) {
            if (!truck) truck = L.marker([loc.lat, loc.lng], { icon: pin('🚚', 'truck'), zIndexOffset: 500 }).addTo(map);
            else glide(truck, loc);
        } else if (truck) { map.removeLayer(truck); truck = null; }

        if (moving && dest) {
            // Ask for a fresh road route only now and then: when the truck has moved or 30s have passed
            const movedKm = lastRouteFrom ? haversineKm(lastRouteFrom, loc) : Infinity;
            if (Date.now() - lastRouteAt > 30000 || movedKm > 0.4) {
                lastRouteAt = Date.now(); lastRouteFrom = { ...loc };
                const r = await route(loc, dest);
                if (!cur || cur.status !== 'delivering') return;
                eta = r;
                if (line) map.removeLayer(line);
                line = L.polyline(r.path, { color: '#0a6c8c', weight: 5, opacity: .8, dashArray: r.exact ? null : '8 10' }).addTo(map);
                if (!fitted) { map.fitBounds(line.getBounds(), { padding: [40, 40] }); fitted = true; }
                drawPanel();
            }
        } else {
            if (line) { map.removeLayer(line); line = null; }
            eta = null;
            if (dest && !fitted) { map.setView([dest.lat, dest.lng], 15); fitted = true; }
        }
    }

    function drawPanel() {
        const t = cur;
        const st = STATUS[t.status] || STATUS.requested;
        const at = ORDER.indexOf(t.status);
        const steps = TRACK_STEPS.map(([key, label]) => {
            const i = ORDER.indexOf(key);
            const cls = t.status === 'cancelled' ? '' : i < at || t.status === 'delivered' ? 'done' : i === at ? 'now' : '';
            return `<div class="s ${cls}"><i></i>${label}</div>`;
        }).join('');

        let headline;
        if (t.status === 'delivering') {
            const age = t.loc ? Date.now() - t.loc.ts : Infinity;
            if (!t.loc) headline = `<div class="notice">The driver has set off. Waiting for the first GPS position…</div>`;
            else {
                const stale = age > STALE_MS;
                headline = `
                    <div class="eta">
                        ${t.dest ? `<div><b class="num">${eta ? eta.min : '–'}</b> <span class="mute">min</span></div>` : '<div class="thumb">🚚</div>'}
                        <div class="grow small">
                            <div class="bold">${eta ? `About ${eta.km.toFixed(1)} km away${eta.exact ? '' : ' (estimate)'}` : (t.dest ? 'Working out the route…' : 'Driver is on the way')}</div>
                            <div class="${stale ? '' : 'dot-live '}mute row" style="gap:6px">${stale ? '⚠️ Signal lost · last seen ' : 'Live · updated '}${timeAgo(t.loc.ts)}</div>
                        </div>
                    </div>`;
            }
        } else if (t.status === 'delivered') {
            headline = `<div class="notice ok">Delivered${t.deliveredAt ? ' ' + timeAgo(t.deliveredAt) : ''}${t.receivedBy ? ` · received by ${esc(t.receivedBy)}` : ''}.</div>`;
        } else if (t.status === 'cancelled') {
            headline = `<div class="notice bad">This order was cancelled.</div>`;
        } else {
            headline = `<div class="notice">${esc(st.hint)}. Live tracking starts when the driver sets off.</div>`;
        }

        const d = t.driver;
        panel.innerHTML = `
            ${mapFailed ? '<div class="notice warn">The map could not be loaded, but the status below is live.</div>' : ''}
            <div class="card stack">
                <div class="head"><div><div class="tiny mute">ORDER ${esc(t.orderNo || '')}</div><h2>${esc(t.storeName || 'Delivery')}</h2></div><span class="pill ${st.tone}">${st.label}</span></div>
                <div class="steps">${steps}</div>
                ${headline}
            </div>
            ${extra ? extra(t) : ''}
            ${d ? `<div class="card row">
                <div class="thumb">🚚</div>
                <div class="grow"><div class="bold clip">${esc(d.name)}</div><div class="small mute clip">${esc(d.vehicle || 'Your driver')}</div></div>
                ${d.phone ? `<a class="btn soft sm" href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}">📞 Call</a>` : ''}
            </div>` : ''}
            <div class="card stack tight">
                <div class="small"><span class="mute">Deliver to</span><br>${esc(t.address || 'Address not set')}</div>
                <div class="small"><span class="mute">When</span><br>${esc(fmtSlot(t.slot))}</div>
                ${(t.items || []).length ? `<div class="small"><span class="mute">Items</span><br>${t.items.map((i) => `${esc(i.name)} · ${i.qty} ${esc(i.unit || '')}`).join('<br>')}</div>` : ''}
            </div>
            ${t.supplier && t.supplier.phone ? `<p class="small mute" style="text-align:center">Questions? Call ${esc(t.supplier.name)} on <a href="tel:${esc(t.supplier.phone.replace(/[^\d+]/g, ''))}">${esc(t.supplier.phone)}</a></p>` : ''}`;
    }

    return {
        update(t) {
            if (!t) return;
            cur = t;
            drawPanel();
            drawMap();
        },
        destroy() {
            clearInterval(ticker);
            if (map) map.remove();
        }
    };
}
