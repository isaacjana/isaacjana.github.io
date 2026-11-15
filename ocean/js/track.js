/**
 * Ocean - public delivery tracking page.
 * Opens from a link (track.html?c=CODE) with no account needed. It reads the
 * public tracking record and follows it live. If the database does not allow
 * public reads yet, the visitor can sign in and the page reads the order itself.
 */
import { store, isDemo } from './store.js';
import { DEFAULT_DEPOT } from './config.js';
import { normaliseOrder, trackingFromOrder } from './model.js';
import { createTrackView } from './trackview.js';

const $ = (id) => document.getElementById(id);
const code = (new URLSearchParams(location.search).get('c') || '').trim().toUpperCase();
let view = null;
let stop = null;

function askForCode(error) {
    $('track').hidden = true;
    $('ask').hidden = false;
    $('ask-error').hidden = !error;
    $('ask-error').textContent = error || '';
    $('code').value = code;
}

function show(record) {
    $('ask').hidden = true;
    $('track').hidden = false;
    if (!view) view = createTrackView($('track'), { depot: record.dest || DEFAULT_DEPOT });
    view.update(record);
    document.title = `${record.storeName || 'Delivery'} - Ocean tracking`;
}

/** Signed-in fallback: read the order directly. */
function followOrder() {
    if (stop) stop();
    stop = store.watch('orders', (rows, err) => {
        if (err) return askForCode('You do not have access to this delivery.');
        if (!rows.length) return askForCode('No delivery matches that code.');
        show(trackingFromOrder(normaliseOrder(rows[0]), null));
    }, ['trackCode', '==', code]);
}

async function start() {
    $('ask-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const c = $('code').value.trim().toUpperCase();
        if (c) location.href = `track.html?c=${encodeURIComponent(c)}${isDemo() ? '&demo=1' : ''}`;
    });
    if (isDemo()) $('top-note').textContent = 'Demo tracking';
    if (!code) return askForCode();

    try {
        await store.init();
    } catch (e) {
        return askForCode('Could not connect. Check your internet connection and try again.');
    }

    stop = store.watchDoc('tracking', code, (record, err) => {
        if (record) return show(record);
        if (!err) return askForCode('No delivery matches that code. Check it and try again.');
        // Public reads are not enabled: offer sign-in instead
        askForCode('This delivery needs you to sign in before it can be shown.');
        $('signin').hidden = false;
    });

    $('signin').addEventListener('click', async () => {
        try { await store.signIn(); } catch (e) { askForCode('Sign-in did not complete. Please try again.'); }
    });
    store.onAuth((user) => { if (user && $('track').hidden && !$('signin').hidden) followOrder(); });
}

start();
