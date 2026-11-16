/** Ocean - small UI helpers: escaping, toasts, bottom sheets, dialogs. */

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);

export function toast(message, bad = false) {
    const el = document.createElement('div');
    el.className = 'toast' + (bad ? ' bad' : '');
    el.textContent = message;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), bad ? 5000 : 2800);
}

/** Show a failure in plain words, with a hint when the database refused access. */
export function fail(e, doing) {
    console.error(e);
    const denied = /permission|insufficient/i.test((e && (e.code || e.message)) || '');
    toast(denied ? `Not allowed to ${doing}. The database rules may need updating.` : `Could not ${doing}. ${(e && e.message) || ''}`, true);
}

const open = [];

/**
 * Open a bottom sheet (a centred dialog on wide screens).
 *   render()  returns { body, foot } HTML; called again on every data change
 *             unless `form` is set (so typing is never wiped out).
 *   onMount(el, sheet) runs once after the sheet is in the page.
 */
export function openSheet({ title, render, full = false, form = false, flush = false, onMount, onClose }) {
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML = `
        <div class="sheet${full ? ' full' : ''}" role="dialog" aria-modal="true">
            <div class="sheet-head"><h2 class="clip"></h2><button class="x" data-close aria-label="Close">✕</button></div>
            <div class="sheet-body${flush ? ' flush' : ''}"></div>
            <div class="sheet-foot" hidden></div>
        </div>`;
    const sheet = {
        el: scrim, form, onClose,
        setTitle(t) { $('h2', scrim).textContent = t; },
        draw() {
            const out = render ? render(sheet) : null;
            if (!out) return;
            if (out.title) sheet.setTitle(out.title);
            if (out.body !== undefined) $('.sheet-body', scrim).innerHTML = out.body;
            const foot = $('.sheet-foot', scrim);
            foot.hidden = !out.foot;
            foot.innerHTML = out.foot || '';
        },
        close() {
            const i = open.indexOf(sheet);
            if (i < 0) return;
            open.splice(i, 1);
            scrim.remove();
            if (sheet.onClose) sheet.onClose();
        }
    };
    sheet.setTitle(title || '');
    scrim.addEventListener('click', (e) => {
        if (e.target === scrim || e.target.closest('[data-close]')) sheet.close();
    });
    $('#sheets').appendChild(scrim);
    open.push(sheet);
    sheet.draw();
    if (onMount) onMount(scrim, sheet);
    return sheet;
}

/** Re-draw every open sheet that shows live data. */
export function refreshSheets() {
    open.forEach((s) => {
        if (s.form) { if (s.onData) s.onData(); return; }
        s.draw();
        if (s.onData) s.onData();
    });
}

export const closeAllSheets = () => [...open].forEach((s) => s.close());
export const topSheet = () => open[open.length - 1] || null;

/** Yes / no question. Resolves true when confirmed. */
export function ask({ title, text, yes = 'Confirm', no = 'Not now', danger = false }) {
    return new Promise((resolve) => {
        let answer = false;
        const s = openSheet({
            title, form: true,
            render: () => ({
                body: `<p>${esc(text)}</p>`,
                foot: `<button class="btn ghost" data-close>${esc(no)}</button><button class="btn ${danger ? 'bad' : ''}" data-yes>${esc(yes)}</button>`
            }),
            onMount: (el) => $('[data-yes]', el).addEventListener('click', () => { answer = true; s.close(); }),
            onClose: () => resolve(answer)
        });
    });
}

/** Read every named input inside an element into a plain object. */
export function readForm(root) {
    const out = {};
    root.querySelectorAll('[name]').forEach((el) => {
        out[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value.trim();
    });
    return out;
}

export const field = (label, name, value = '', attrs = '') =>
    `<label class="field"><span>${esc(label)}</span><input class="input" name="${name}" value="${esc(value)}" ${attrs}></label>`;

export const area = (label, name, value = '', attrs = '') =>
    `<label class="field"><span>${esc(label)}</span><textarea class="input" name="${name}" ${attrs}>${esc(value)}</textarea></label>`;

export const select = (label, name, options, value) =>
    `<label class="field"><span>${esc(label)}</span><select class="input" name="${name}">${options.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;

export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        return ok;
    }
}

/** Use the phone's share sheet when there is one, otherwise copy the link. */
export async function share(title, text, url) {
    if (navigator.share) {
        try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    toast((await copyText(url)) ? 'Link copied' : url);
}

/**
 * Let the user take or choose a photo and shrink it to a small JPEG.
 * Resolves with a data URL, or null if they backed out.
 */
export function pickImage({ maxSide = 900, quality = 0.6, camera = true } = {}) {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        if (camera) input.capture = 'environment';
        input.onchange = () => {
            const file = input.files[0];
            if (!file) return resolve(null);
            const img = new Image();
            img.onload = () => {
                const k = Math.min(1, maxSide / Math.max(img.width, img.height));
                const c = document.createElement('canvas');
                c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                URL.revokeObjectURL(img.src);
                resolve(c.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        };
        input.click();
    });
}

export function downloadText(name, text, type = 'text/csv') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
