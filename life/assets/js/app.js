import {
    COLORS, EMOJIS, TIMES, DOW, TEMPLATES, uid, keyOf, parseKey, todayKey, addDays, weekStart, diffDays,
    emptyState, normalize, newHabit, seedState, countOn, isSkipped, isDone, setLog, activeHabits,
    isDue, freqLabel, dayProgress, currentStreak, bestStreak, completionRate, totalCompletions,
    perfectDayStreak, weekDoneCount, goalProgress
} from './store.js';

// Firebase is loaded lazily so the app still opens (in guest mode) if the SDK can't be fetched.
let sync = null;
const loadSync = () => (sync ? Promise.resolve(sync) : import('./sync.js').then((m) => (sync = m)));

// ---------------------------------------------------------------- State
let S = emptyState();
const ui = {
    ready: false, user: null, guest: false, tab: 'today', date: todayKey(), filter: 'all',
    sync: 'idle', sheet: null, draft: null, player: null, loginBusy: false, loginError: '',
    calMonth: null, lastToday: todayKey()
};
let unsubRemote = null, saveTimer = null;

const root = document.getElementById('root');
const sheetRoot = document.getElementById('sheet-root');
const GUEST_KEY = 'life:guest';
const cacheKey = () => `life:state:${ui.user ? ui.user.uid : 'guest'}`;

const readCache = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } };
const writeCache = () => { try { localStorage.setItem(cacheKey(), JSON.stringify(S)); } catch (e) { } };

function commit({ silent = false } = {}) {
    S.updatedAt = Date.now();
    writeCache();
    if (ui.user) {
        clearTimeout(saveTimer);
        ui.sync = 'saving';
        saveTimer = setTimeout(pushRemote, 600);
    }
    if (!silent) render();
}

async function pushRemote() {
    if (!ui.user) return;
    const u = ui.user;
    try {
        await sync.saveState(u.uid, S);
        if (ui.user === u) { ui.sync = 'ok'; refreshSyncDot(); }
    } catch (e) {
        console.error(e);
        ui.sync = 'error'; refreshSyncDot();
        toast('Couldn’t sync — changes kept on this device');
    }
}

function onRemote(data, { fromCache }) {
    if (!data) {
        if (fromCache) return; // cache doesn't know yet; wait for the server answer
        if (!S.habits.length && !S.goals.length && !S.routines.length) {
            const guest = normalize(readCache('life:state:guest'));
            S = guest.habits.length ? guest : seedState();
        }
        commit();
        return;
    }
    const remote = normalize(data);
    if ((remote.updatedAt || 0) > (S.updatedAt || 0)) {
        S = remote;
        writeCache();
        ui.sync = 'ok';
        render();
    } else if ((remote.updatedAt || 0) < (S.updatedAt || 0)) {
        pushRemote(); // offline edits are newer than the cloud
    } else {
        ui.sync = 'ok'; refreshSyncDot();
    }
}

// ---------------------------------------------------------------- Boot / auth
function startSession(user) {
    ui.user = user;
    ui.guest = !user;
    S = normalize(readCache(cacheKey()) || (user ? null : seedState()));
    if (!user && !readCache(cacheKey())) writeCache();
    ui.ready = true;
    render();
    if (user) {
        ui.sync = 'saving';
        unsubRemote = sync.subscribeState(user.uid, onRemote, (e) => {
            console.error(e); ui.sync = 'error'; refreshSyncDot();
        });
    }
}

function endSession() {
    if (unsubRemote) { unsubRemote(); unsubRemote = null; }
    clearTimeout(saveTimer);
    ui.user = null; ui.guest = false; ui.sheet = null; ui.player = null;
    S = emptyState();
}

loadSync().then((m) => {
    m.watchAuth((user) => {
        if (user) {
            if (ui.user && ui.user.uid === user.uid) return;
            endSession();
            try { localStorage.removeItem(GUEST_KEY); } catch (e) { }
            startSession({ uid: user.uid, name: user.displayName || 'You', email: user.email, photo: user.photoURL });
        } else if (ui.user || !ui.ready) {
            endSession();
            if (localStorage.getItem(GUEST_KEY)) startSession(null);
            else { ui.ready = true; render(); }
        }
    });
}).catch((e) => {
    console.error('Firebase failed to load', e);
    ui.loginError = 'Google sign-in is unavailable right now. You can still use the app on this device.';
    if (localStorage.getItem(GUEST_KEY)) startSession(null);
    else { ui.ready = true; render(); }
});

// ---------------------------------------------------------------- Helpers
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (r) => `${Math.round(r * 100)}%`;
const habitById = (id) => S.habits.find((h) => h.id === id);
const buzz = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (e) { } };
const fmtDate = (k, opts) => parseKey(k).toLocaleDateString(undefined, opts);

const I = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    routines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M4 12h16M4 18h12"/><circle cx="18" cy="6" r="2"/></svg>',
    goals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    google: '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
};

function ring(ratio, size, stroke, color = 'var(--accent)') {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
            stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, ratio))}" style="transition:stroke-dashoffset .5s"/></svg>`;
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

function confetti() {
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < 70; i++) {
        const p = document.createElement('i');
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = COLORS[i % COLORS.length];
        p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
        p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
        p.style.animationDuration = 1.4 + Math.random() * 1.4 + 's';
        p.style.animationDelay = Math.random() * .3 + 's';
        box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3400);
}

function applyTheme() {
    const t = S.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
}

// ---------------------------------------------------------------- Render
function render() {
    applyTheme();
    if (!ui.ready) return;
    if (!ui.user && !ui.guest) { root.innerHTML = viewLogin(); sheetRoot.innerHTML = ''; return; }
    const views = { today: viewToday, routines: viewRoutines, goals: viewGoals, stats: viewStats };
    const scroll = window.scrollY;
    root.innerHTML = `<main class="app">${views[ui.tab]()}</main>${viewTabbar()}`;
    window.scrollTo(0, scroll);
    renderSheet();
    renderPlayer();
}

function refreshSyncDot() {
    document.querySelectorAll('[data-syncdot]').forEach((el) => { el.className = 'dot ' + syncClass(); });
    document.querySelectorAll('[data-synctext]').forEach((el) => { el.textContent = syncText(); });
}
const syncClass = () => (!ui.user ? '' : { ok: 'ok', saving: 'busy', error: 'bad' }[ui.sync] || '');
const syncText = () => (!ui.user ? 'Only on this device' : { ok: 'Synced', saving: 'Syncing…', error: 'Sync error' }[ui.sync] || 'Connecting…');

function avatar(size) {
    const name = ui.user ? ui.user.name : 'Guest';
    const img = ui.user && ui.user.photo ? `<img src="${esc(ui.user.photo)}" alt="" referrerpolicy="no-referrer">` : esc(name[0] || '?');
    return `<button class="avatar" data-a="settings" aria-label="Account and settings"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${img}</button>`;
}

function viewTabbar() {
    const tabs = [['today', 'Today'], ['routines', 'Routines'], ['goals', 'Goals'], ['stats', 'Stats']];
    const fab = ui.tab !== 'stats' ? `<button class="fab" data-a="new" aria-label="Add">${I.plus}</button>` : '';
    return `${fab}<nav class="tabbar">${tabs.map(([id, label]) =>
        `<button class="${ui.tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${I[id]}<span>${label}</span></button>`).join('')}</nav>`;
}

function viewLogin() {
    return `<div class="login">
        <div>
            <div class="logo-mark"><span></span></div>
            <h1>Show up.<br>Every <em>day.</em></h1>
            <p class="lead">Build habits that stick, run your routines and turn goals into daily wins.</p>
            <div class="features">
                <div><span class="emoji">✅</span><span><b>Habits & streaks</b><small>Daily, specific days or X times a week</small></span></div>
                <div><span class="emoji">⏱️</span><span><b>Guided routines</b><small>Step-by-step with timers</small></span></div>
                <div><span class="emoji">🎯</span><span><b>Goals</b><small>Milestones, numbers and linked habits</small></span></div>
                <div><span class="emoji">📈</span><span><b>Insights</b><small>Heatmaps, rates and best streaks</small></span></div>
            </div>
        </div>
        <div>
            <button class="gbtn" data-a="login" ${ui.loginBusy || !sync ? 'disabled' : ''}>${I.google}<span>${ui.loginBusy ? 'Signing in…' : 'Continue with Google'}</span></button>
            ${ui.loginError ? `<p class="err">${esc(ui.loginError)}</p>` : ''}
            <button class="guest" data-a="guest">Try it without an account</button>
            <p class="fine">Your data syncs privately to your Google account.</p>
        </div>
    </div>`;
}

// ---------- Today
function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function viewToday() {
    const k = ui.date, today = todayKey();
    const rel = k === today ? greeting() : k === addDays(today, -1) ? 'Yesterday' : fmtDate(k, { weekday: 'long' });
    const ws = weekStart(k);
    const week = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(ws, i), p = dayProgress(S, d), fut = d > today;
        return `<button class="${d === k ? 'sel' : ''} ${fut ? 'future' : ''}" data-a="day" data-k="${d}" ${fut ? 'disabled' : ''}>
            <span class="dname">${DOW[parseKey(d).getDay()][0]}</span>
            <span class="mini-ring">${ring(fut ? 0 : p.ratio, 34, 3.5)}<span>${parseKey(d).getDate()}</span></span>
        </button>`;
    }).join('');

    const habits = activeHabits(S);
    const p = dayProgress(S, k);
    const perfect = perfectDayStreak(S);
    const heroTitle = !habits.length ? 'Let’s build your first habit'
        : !p.due ? 'Nothing scheduled' : p.done === p.due ? 'All done. Nice work! 🎉' : `${p.done} of ${p.due} done`;
    const heroSub = !habits.length ? 'Tap + to add one, or pick from templates.'
        : p.done === p.due && p.due ? 'You showed up today.' : `${p.due - p.done} habit${p.due - p.done === 1 ? '' : 's'} left ${k === today ? 'today' : 'that day'}.`;

    const dueList = habits.filter((h) => isDue(S, h, k));
    const otherList = habits.filter((h) => !isDue(S, h, k));
    const usedTimes = TIMES.filter((t) => dueList.some((h) => h.timeOfDay === t.id));
    if (ui.filter !== 'all' && !usedTimes.some((t) => t.id === ui.filter)) ui.filter = 'all';

    let body = '';
    if (!habits.length) {
        body = `<div class="empty"><div class="big">🌱</div><h3>No habits yet</h3><p>Small things, done daily, add up. Start with one.</p>
            <button class="btn primary" data-a="new-habit">Add a habit</button></div>`;
    } else if (ui.filter === 'all') {
        body = usedTimes.map((t) => `<div class="section-title">${t.icon} ${t.label}</div>
            <div class="list">${dueList.filter((h) => h.timeOfDay === t.id).map((h) => habitRow(h, k)).join('')}</div>`).join('');
    } else {
        body = `<div class="list" style="margin-top:14px">${dueList.filter((h) => h.timeOfDay === ui.filter).map((h) => habitRow(h, k)).join('')}</div>`;
    }
    if (otherList.length && ui.filter === 'all') {
        body += `<div class="section-title">Not scheduled</div><div class="list" style="opacity:.6">${otherList.map((h) => habitRow(h, k)).join('')}</div>`;
    }

    const routines = S.routines.filter((r) => r.steps.length);
    const routineStrip = routines.length && k === today ? `<div class="section-title">Routines</div><div class="hscroll">${routines.map((r) => {
        const done = r.steps.filter((st) => { const h = habitById(st.habitId); return h && isDone(S, h, k); }).length;
        return `<button class="routine-chip" data-a="play" data-id="${r.id}"><span class="emoji">${esc(r.emoji)}</span>
            <span><b>${esc(r.name)}</b><small>${done}/${r.steps.length} · ${routineMinutes(r)} min</small></span><span class="play-dot">${I.play}</span></button>`;
    }).join('')}</div>` : '';

    return `<header class="topbar">
            <div><div class="eyebrow">${fmtDate(k, { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>${esc(rel)}</h1></div>
            ${avatar()}
        </header>
        <div class="week">${week}</div>
        <section class="card hero">
            <div class="ring">${ring(p.ratio, 92, 9)}<b>${habits.length ? pct(p.ratio) : '—'}</b></div>
            <div><h2>${heroTitle}</h2><p>${heroSub}</p>
                ${perfect ? `<div class="chips"><span class="chip">🔥 ${perfect} perfect day${perfect === 1 ? '' : 's'}</span></div>` : ''}</div>
        </section>
        ${routineStrip}
        ${usedTimes.length > 1 ? `<div class="seg"><button class="${ui.filter === 'all' ? 'on' : ''}" data-a="filter" data-id="all">All</button>${usedTimes.map((t) =>
            `<button class="${ui.filter === t.id ? 'on' : ''}" data-a="filter" data-id="${t.id}">${t.icon} ${t.label}</button>`).join('')}</div>` : ''}
        ${body}`;
}

function habitRow(h, k) {
    const n = countOn(S, k, h.id), target = h.target || 1, done = n >= target, skipped = isSkipped(S, k, h.id);
    const streak = currentStreak(S, h);
    const sub = [];
    if (target > 1) sub.push(`${n}/${target}${h.unit ? ' ' + esc(h.unit) : ''}`);
    if (h.freq?.type === 'weekly') sub.push(`${weekDoneCount(S, h, k)}/${h.freq.times} this week`);
    else sub.push(freqLabel(h));
    if (streak) sub.push(`🔥 ${streak}`);
    if (skipped) sub.unshift('Skipped');
    const fill = skipped ? 0 : Math.min(1, n / target);
    const checkInner = done ? I.check : target > 1 && n ? `${n}` : '';
    return `<div class="habit ${done ? 'done' : ''} ${skipped ? 'skipped' : ''}" style="--c:${h.color}" data-a="habit" data-id="${h.id}" role="button" tabindex="0">
        <span class="fill" style="transform:scaleX(${fill})"></span>
        <span class="emoji">${esc(h.emoji)}</span>
        <span class="meta"><div class="name">${esc(h.name)}</div><div class="sub">${sub.map((x) => `<span>${x}</span>`).join('')}</div></span>
        <button class="check" data-a="tick" data-id="${h.id}" aria-label="${done ? 'Undo' : 'Complete'} ${esc(h.name)}">${checkInner}</button>
    </div>`;
}

// ---------- Routines
const routineMinutes = (r) => r.steps.reduce((a, st) => a + (Number(st.minutes) || 0), 0);

function viewRoutines() {
    const k = todayKey();
    const list = S.routines.map((r) => {
        const steps = r.steps.map((st, i) => {
            const h = habitById(st.habitId);
            if (!h) return '';
            return `<div class="step-row ${isDone(S, h, k) ? 'ok' : ''}" style="--c:${h.color}"><span class="n">${isDone(S, h, k) ? '✓' : i + 1}</span>
                <span>${esc(h.emoji)} ${esc(h.name)}</span><span class="t">${st.minutes ? st.minutes + ' min' : ''}</span></div>`;
        }).join('');
        const t = TIMES.find((x) => x.id === r.timeOfDay);
        return `<article class="card routine-card">
            <header><span class="emoji">${esc(r.emoji)}</span><div><h3>${esc(r.name)}</h3>
                <small>${t ? t.label + ' · ' : ''}${r.steps.length} step${r.steps.length === 1 ? '' : 's'} · ${routineMinutes(r)} min</small></div></header>
            <div class="steps">${steps || '<span style="color:var(--muted);font-size:14px">No steps yet</span>'}</div>
            <div class="row-actions">
                <button class="btn light sm" style="flex:1" data-a="play" data-id="${r.id}" ${r.steps.length ? '' : 'disabled'}>${I.play.replace('<svg', '<svg width="14" height="14"')} Start</button>
                <button class="btn sm" data-a="edit-routine" data-id="${r.id}">Edit</button>
            </div>
        </article>`;
    }).join('');
    return `<header class="topbar"><div><div class="eyebrow">Stack your habits</div><h1>Routines</h1></div>${avatar()}</header>
        ${list ? `<div class="list">${list}</div>` : `<div class="empty"><div class="big">⏱️</div><h3>No routines yet</h3>
            <p>Chain habits into a morning or evening routine and run through them with a timer.</p>
            <button class="btn primary" data-a="new">Create a routine</button></div>`}`;
}

// ---------- Goals
function goalCard(g) {
    const p = goalProgress(g);
    const left = g.deadline ? diffDays(todayKey(), g.deadline) : null;
    const meta = [];
    if (g.type === 'number') meta.push(`${g.current || 0} / ${g.target} ${esc(g.unit || '')}`);
    else meta.push(`${(g.milestones || []).filter((m) => m.done).length} / ${(g.milestones || []).length} milestones`);
    if (left != null && !g.done) meta.push(left < 0 ? `${-left}d overdue` : left === 0 ? 'Due today' : `${left}d left`);
    return `<button class="card goal ${g.done ? 'complete' : ''}" style="--c:${g.color}" data-a="goal" data-id="${g.id}">
        <header><span class="emoji">${esc(g.emoji)}</span><div><h3>${esc(g.title)}</h3><small>${meta.join(' · ')}</small></div><span class="pct">${g.done ? '✓' : pct(p)}</span></header>
        <div class="bar"><i style="width:${p * 100}%"></i></div>
    </button>`;
}

function viewGoals() {
    const active = S.goals.filter((g) => !g.done), done = S.goals.filter((g) => g.done);
    return `<header class="topbar"><div><div class="eyebrow">Aim higher</div><h1>Goals</h1></div>${avatar()}</header>
        ${S.goals.length ? `<div class="list">${active.map(goalCard).join('')}</div>
            ${done.length ? `<div class="section-title">Achieved</div><div class="list">${done.map(goalCard).join('')}</div>` : ''}`
            : `<div class="empty"><div class="big">🎯</div><h3>No goals yet</h3><p>Set a target, break it into milestones and link the habits that get you there.</p>
            <button class="btn primary" data-a="new">Set a goal</button></div>`}`;
}

// ---------- Stats
function viewStats() {
    const today = todayKey(), habits = activeHabits(S);
    if (!habits.length) return `<header class="topbar"><div><div class="eyebrow">Your progress</div><h1>Stats</h1></div>${avatar()}</header>
        <div class="empty"><div class="big">📈</div><h3>Nothing to measure yet</h3><p>Add habits and check them off — your trends show up here.</p></div>`;

    const rates = habits.map((h) => completionRate(S, h, 30));
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const total = habits.reduce((a, h) => a + totalCompletions(S, h), 0);
    const best = Math.max(0, ...habits.map((h) => bestStreak(S, h)));

    const weeks = 18, start = addDays(weekStart(today), -7 * (weeks - 1));
    const cells = Array.from({ length: weeks * 7 }, (_, i) => {
        const d = addDays(start, i);
        if (d > today) return '<i style="background:transparent"></i>';
        const r = dayProgress(S, d);
        const lvl = r.due ? Math.round(r.ratio * 100) : 0;
        return `<i title="${d}: ${r.done}/${r.due}" style="${lvl ? `background:color-mix(in srgb, var(--accent) ${20 + lvl * .8}%, var(--surface-2))` : ''}"></i>`;
    }).join('');

    const bars = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(today, i - 6), r = dayProgress(S, d);
        return `<div class="${r.ratio ? '' : 'zero'}"><i style="height:${Math.max(4, r.ratio * 100)}%"></i><span>${DOW[parseKey(d).getDay()][0]}</span></div>`;
    }).join('');

    const rows = habits.map((h, i) => ({ h, r: rates[i] })).sort((a, b) => b.r - a.r).map(({ h, r }) =>
        `<button class="stat-row" style="--c:${h.color}" data-a="habit" data-id="${h.id}"><span class="emoji">${esc(h.emoji)}</span>
            <span class="meta"><b>${esc(h.name)}</b><div class="bar"><i style="width:${r * 100}%"></i></div></span>
            <span class="val">${pct(r)}</span><span class="val" style="width:auto;color:var(--muted)">🔥${currentStreak(S, h)}</span></button>`).join('');

    return `<header class="topbar"><div><div class="eyebrow">Your progress</div><h1>Stats</h1></div>${avatar()}</header>
        <div class="tiles">
            <div class="tile"><b>${pct(dayProgress(S, today).ratio)}</b><span>Today</span></div>
            <div class="tile"><b>${pct(avg)}</b><span>30-day success</span></div>
            <div class="tile"><b>🔥 ${perfectDayStreak(S)}</b><span>Perfect-day streak</span></div>
            <div class="tile"><b>${best}</b><span>Best habit streak</span></div>
        </div>
        <div class="section-title">Last 7 days</div>
        <div class="card"><div class="bars">${bars}</div></div>
        <div class="section-title">Consistency · ${weeks} weeks <span style="text-transform:none;letter-spacing:0">${total} check-ins</span></div>
        <div class="card"><div class="heat">${cells}</div><div class="heat-legend"><span>${fmtDate(start, { month: 'short', day: 'numeric' })}</span><span>Today</span></div></div>
        <div class="section-title">Habits · 30 days</div>
        <div class="card" style="padding:6px 16px">${rows}</div>`;
}

// ---------------------------------------------------------------- Sheets
function openSheet(sheet, draft = null) { ui.sheet = sheet; ui.draft = draft; renderSheet(); }
function closeSheet() { ui.sheet = null; ui.draft = null; sheetRoot.innerHTML = ''; document.body.style.overflow = ''; }

function renderSheet() {
    if (!ui.sheet) { sheetRoot.innerHTML = ''; document.body.style.overflow = ''; return; }
    const views = { habitForm: sheetHabitForm, habitDetail: sheetHabitDetail, routineForm: sheetRoutineForm, goalForm: sheetGoalForm, goalDetail: sheetGoalDetail, settings: sheetSettings, newMenu: sheetNewMenu };
    const prev = sheetRoot.querySelector('.sheet');
    const scroll = prev ? prev.scrollTop : 0;
    const focusId = document.activeElement && document.activeElement.id;
    sheetRoot.innerHTML = `<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${views[ui.sheet.type]()}</div></div>`;
    const sheet = sheetRoot.querySelector('.sheet');
    sheet.scrollTop = scroll;
    if (prev) { sheetRoot.querySelector('.scrim').style.animation = 'none'; sheet.style.animation = 'none'; }
    if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
    document.body.style.overflow = 'hidden';
}

const sheetHead = (title, extra = '') => `<div class="sheet-head"><h2>${title}</h2><div style="display:flex;gap:8px">${extra}<button class="icon-btn" data-a="close" aria-label="Close">${I.close}</button></div></div>`;

function sheetNewMenu() {
    return `${sheetHead('Create')}<div class="menu">
        <button data-a="new-habit"><span class="emoji" style="--c:#c8ff3d;width:40px;height:40px;font-size:20px">✅</span><span class="grow">Habit<br><small>Something to do regularly</small></span></button>
        <button data-a="new-routine"><span class="emoji" style="--c:#38bdf8;width:40px;height:40px;font-size:20px">⏱️</span><span class="grow">Routine<br><small>A sequence of habits</small></span></button>
        <button data-a="new-goal"><span class="emoji" style="--c:#ffb547;width:40px;height:40px;font-size:20px">🎯</span><span class="grow">Goal<br><small>A target with a finish line</small></span></button>
    </div>`;
}

// ---------- Habit form
function sheetHabitForm() {
    const d = ui.draft, isNew = !S.habits.some((h) => h.id === d.id);
    const f = d.freq;
    return `${sheetHead(isNew ? 'New habit' : 'Edit habit')}
        ${isNew ? `<div class="templates">${TEMPLATES.map((t, i) => `<button data-a="tpl" data-i="${i}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div>` : ''}
        <div class="field"><input id="f-name" class="input big" data-bind="name" placeholder="e.g. Drink water" value="${esc(d.name)}" maxlength="60" autocomplete="off"></div>
        <div class="field"><label>Icon</label><div class="emoji-grid">${EMOJIS.map((e) => `<button class="${d.emoji === e ? 'on' : ''}" data-a="set" data-k="emoji" data-v="${e}">${e}</button>`).join('')}</div></div>
        <div class="field"><label>Colour</label><div class="colors">${COLORS.map((c) => `<button class="${d.color === c ? 'on' : ''}" style="--c:${c}" data-a="set" data-k="color" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
        <div class="field"><label>Time of day</label><div class="pick">${TIMES.map((t) => `<button class="${d.timeOfDay === t.id ? 'on' : ''}" data-a="set" data-k="timeOfDay" data-v="${t.id}">${t.icon} ${t.label}</button>`).join('')}</div></div>
        <div class="field"><label>Repeat</label><div class="pick">
            <button class="${f.type === 'daily' ? 'on' : ''}" data-a="freq" data-v="daily">Every day</button>
            <button class="${f.type === 'days' ? 'on' : ''}" data-a="freq" data-v="days">Specific days</button>
            <button class="${f.type === 'weekly' ? 'on' : ''}" data-a="freq" data-v="weekly">Times per week</button></div></div>
        ${f.type === 'days' ? `<div class="field"><div class="days">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<button class="${f.days.includes(i) ? 'on' : ''}" data-a="dow" data-v="${i}">${DOW[i].slice(0, 2)}</button>`).join('')}</div></div>` : ''}
        ${f.type === 'weekly' ? `<div class="field"><div class="stepper"><button data-a="times" data-v="-1">−</button><b>${f.times}</b><button data-a="times" data-v="1">+</button><span style="color:var(--muted)">days a week</span></div></div>` : ''}
        <div class="field"><label>Daily target</label><div class="row" style="align-items:center">
            <div class="stepper" style="flex:none"><button data-a="target" data-v="-1">−</button><b>${d.target}</b><button data-a="target" data-v="1">+</button></div>
            <input id="f-unit" class="input" data-bind="unit" placeholder="unit (optional)" value="${esc(d.unit)}" maxlength="16"></div></div>
        <div class="sheet-actions">
            ${isNew ? '' : `<button class="btn danger" data-a="del-habit">Delete</button><button class="btn" data-a="archive-habit">${d.archived ? 'Restore' : 'Archive'}</button>`}
            <button class="btn primary" data-a="save-habit">${isNew ? 'Add habit' : 'Save'}</button>
        </div>`;
}

// ---------- Habit detail
function sheetHabitDetail() {
    const h = habitById(ui.sheet.id);
    if (!h) return sheetHead('Habit');
    const k = ui.date, today = todayKey();
    const n = countOn(S, k, h.id), target = h.target || 1, skipped = isSkipped(S, k, h.id);
    const month = ui.calMonth || today.slice(0, 7);
    const first = parseKey(month + '-01');
    const lead = (first.getDay() + 6) % 7;
    const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let cal = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => `<span class="dn">${x}</span>`).join('') + '<span></span>'.repeat(lead);
    for (let i = 1; i <= daysIn; i++) {
        const d = `${month}-${String(i).padStart(2, '0')}`, c = countOn(S, d, h.id);
        const cls = [isDue(S, h, d) ? 'due' : '', c >= target ? 'done' : c ? 'part' : '', isSkipped(S, d, h.id) ? 'skip' : '', d === today ? 'today' : ''].join(' ');
        cal += `<button class="${cls}" data-a="cal-tick" data-k="${d}" ${d > today ? 'disabled' : ''}>${i}</button>`;
    }
    const goals = S.goals.filter((g) => (g.habitIds || []).includes(h.id));
    const dayLabel = k === today ? 'Today' : fmtDate(k, { weekday: 'short', day: 'numeric', month: 'short' });
    return `${sheetHead('', `<button class="icon-btn" data-a="edit-habit" data-id="${h.id}" aria-label="Edit">${I.edit}</button>`)}
        <div class="detail-hero" style="--c:${h.color}"><span class="emoji">${esc(h.emoji)}</span><div><h2>${esc(h.name)}</h2>
            <small>${freqLabel(h)} · ${TIMES.find((t) => t.id === h.timeOfDay)?.label || ''}${target > 1 ? ` · ${target} ${esc(h.unit)}` : ''}</small></div></div>
        <div class="tiles">
            <div class="tile"><b>🔥 ${currentStreak(S, h)}</b><span>Current streak${h.freq?.type === 'weekly' ? ' (weeks)' : ''}</span></div>
            <div class="tile"><b>${bestStreak(S, h)}</b><span>Best streak</span></div>
            <div class="tile"><b>${pct(completionRate(S, h, 30))}</b><span>30-day success</span></div>
            <div class="tile"><b>${totalCompletions(S, h)}</b><span>Total completions</span></div>
        </div>
        <div class="section-title">${dayLabel}</div>
        <div class="card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            ${target > 1 ? `<div class="stepper"><button data-a="count" data-v="-1">−</button><b>${n}/${target}</b><button data-a="count" data-v="1">+</button></div>`
            : `<button class="btn ${n >= 1 ? 'light' : 'primary'} sm" data-a="tick" data-id="${h.id}">${n >= 1 ? 'Mark not done' : 'Mark done'}</button>`}
            <button class="btn sm" style="margin-left:auto" data-a="skip">${skipped ? 'Unskip' : 'Skip'}</button>
        </div>
        <div class="section-title">History</div>
        <div class="card" style="--c:${h.color}">
            <div class="cal-head"><button class="icon-btn" data-a="cal-nav" data-v="-1" aria-label="Previous month">${I.left}</button>
                <span>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                <button class="icon-btn" data-a="cal-nav" data-v="1" aria-label="Next month" ${month >= today.slice(0, 7) ? 'disabled style="opacity:.3"' : ''}>${I.right}</button></div>
            <div class="cal">${cal}</div>
        </div>
        ${goals.length ? `<div class="section-title">Part of</div><div class="list">${goals.map(goalCard).join('')}</div>` : ''}`;
}

// ---------- Routine form
function sheetRoutineForm() {
    const d = ui.draft, isNew = !S.routines.some((r) => r.id === d.id);
    const chosen = d.steps.map((st, i) => {
        const h = habitById(st.habitId);
        if (!h) return '';
        return `<div class="pick-item" style="--c:${h.color}"><span class="emoji">${esc(h.emoji)}</span><span class="grow">${esc(h.name)}</span>
            <input type="number" min="0" max="240" inputmode="numeric" id="st-${i}" data-step="${i}" value="${st.minutes || 0}" aria-label="Minutes"><small style="color:var(--muted)">min</small>
            <button class="mini" data-a="step-up" data-i="${i}" aria-label="Move up" ${i ? '' : 'disabled style="opacity:.3"'}>${I.up}</button>
            <button class="mini" data-a="step-del" data-i="${i}" aria-label="Remove">${I.close}</button></div>`;
    }).join('');
    const avail = activeHabits(S).filter((h) => !d.steps.some((st) => st.habitId === h.id));
    return `${sheetHead(isNew ? 'New routine' : 'Edit routine')}
        <div class="field"><input id="r-name" class="input big" data-bind="name" placeholder="e.g. Morning routine" value="${esc(d.name)}" maxlength="50"></div>
        <div class="field"><label>Icon</label><div class="emoji-grid">${['🌅', '🌙', '☀️', '💪', '🧘', '📚', '🧠', '🛏️', '🚿', '☕', '🏃', '✨'].map((e) => `<button class="${d.emoji === e ? 'on' : ''}" data-a="set" data-k="emoji" data-v="${e}">${e}</button>`).join('')}</div></div>
        <div class="field"><label>Time of day</label><div class="pick">${TIMES.map((t) => `<button class="${d.timeOfDay === t.id ? 'on' : ''}" data-a="set" data-k="timeOfDay" data-v="${t.id}">${t.icon} ${t.label}</button>`).join('')}</div></div>
        <div class="field"><label>Steps · ${d.steps.reduce((a, s) => a + (Number(s.minutes) || 0), 0)} min</label><div class="pick-list">${chosen || '<p style="color:var(--muted);font-size:14px">Add habits below to build the sequence.</p>'}</div></div>
        ${avail.length ? `<div class="field"><label>Add habits</label><div class="pick-list">${avail.map((h) =>
            `<button class="pick-item" style="--c:${h.color}" data-a="step-add" data-id="${h.id}"><span class="emoji">${esc(h.emoji)}</span><span class="grow" style="text-align:left">${esc(h.name)}</span><span class="mini">${I.plus}</span></button>`).join('')}</div></div>`
            : !activeHabits(S).length ? '<p style="color:var(--muted);font-size:14px">Create some habits first.</p>' : ''}
        <div class="sheet-actions">${isNew ? '' : '<button class="btn danger" data-a="del-routine">Delete</button>'}<button class="btn primary" data-a="save-routine">${isNew ? 'Create routine' : 'Save'}</button></div>`;
}

// ---------- Goal form
function sheetGoalForm() {
    const d = ui.draft, isNew = !S.goals.some((g) => g.id === d.id);
    return `${sheetHead(isNew ? 'New goal' : 'Edit goal')}
        <div class="field"><input id="g-title" class="input big" data-bind="title" placeholder="e.g. Run a half marathon" value="${esc(d.title)}" maxlength="80"></div>
        <div class="field"><label>Icon</label><div class="emoji-grid">${['🎯', '🏃', '📚', '💰', '🏋️', '✈️', '🧠', '🎓', '💼', '🏠', '❤️', '🌱', '🎸', '⚖️', '🧘', '🏆'].map((e) => `<button class="${d.emoji === e ? 'on' : ''}" data-a="set" data-k="emoji" data-v="${e}">${e}</button>`).join('')}</div></div>
        <div class="field"><label>Colour</label><div class="colors">${COLORS.map((c) => `<button class="${d.color === c ? 'on' : ''}" style="--c:${c}" data-a="set" data-k="color" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
        <div class="field"><label>Measure progress by</label><div class="pick">
            <button class="${d.type === 'number' ? 'on' : ''}" data-a="set" data-k="type" data-v="number">A number</button>
            <button class="${d.type === 'milestones' ? 'on' : ''}" data-a="set" data-k="type" data-v="milestones">Milestones</button></div></div>
        ${d.type === 'number' ? `<div class="field"><div class="row">
            <div><label>Current</label><input id="g-cur" class="input" type="number" inputmode="decimal" data-bind="current" value="${d.current}"></div>
            <div><label>Target</label><input id="g-tgt" class="input" type="number" inputmode="decimal" data-bind="target" value="${d.target}"></div>
            <div><label>Unit</label><input id="g-unit" class="input" data-bind="unit" placeholder="km, books…" value="${esc(d.unit)}" maxlength="16"></div></div></div>`
            : `<div class="field"><label>Milestones</label><div class="pick-list">${d.milestones.map((m, i) =>
                `<div class="pick-item"><button class="toggle ${m.done ? 'on' : ''}" data-a="ms-toggle" data-i="${i}">${m.done ? I.check : ''}</button><span class="grow">${esc(m.text)}</span>
                <button class="mini" data-a="ms-del" data-i="${i}" aria-label="Remove">${I.close}</button></div>`).join('')}
                <div class="row"><input id="ms-new" class="input" placeholder="Add a milestone" maxlength="80" data-enter="ms-add"><button class="btn" style="flex:none" data-a="ms-add">Add</button></div></div></div>`}
        <div class="field"><label>Deadline (optional)</label><input id="g-dl" class="input" type="date" data-bind="deadline" value="${esc(d.deadline || '')}"></div>
        ${activeHabits(S).length ? `<div class="field"><label>Linked habits</label><div class="pick-list">${activeHabits(S).map((h) => {
            const on = d.habitIds.includes(h.id);
            return `<button class="pick-item" style="--c:${h.color}" data-a="g-habit" data-id="${h.id}"><span class="emoji">${esc(h.emoji)}</span><span class="grow" style="text-align:left">${esc(h.name)}</span><span class="toggle ${on ? 'on' : ''}">${on ? I.check : ''}</span></button>`;
        }).join('')}</div></div>` : ''}
        <div class="sheet-actions">${isNew ? '' : '<button class="btn danger" data-a="del-goal">Delete</button>'}<button class="btn primary" data-a="save-goal">${isNew ? 'Create goal' : 'Save'}</button></div>`;
}

// ---------- Goal detail
function sheetGoalDetail() {
    const g = S.goals.find((x) => x.id === ui.sheet.id);
    if (!g) return sheetHead('Goal');
    const p = goalProgress(g);
    const left = g.deadline ? diffDays(todayKey(), g.deadline) : null;
    const habits = (g.habitIds || []).map(habitById).filter(Boolean);
    return `${sheetHead('', `<button class="icon-btn" data-a="edit-goal" data-id="${g.id}" aria-label="Edit">${I.edit}</button>`)}
        <div class="detail-hero" style="--c:${g.color}"><span class="emoji">${esc(g.emoji)}</span><div><h2>${esc(g.title)}</h2>
            <small>${g.deadline ? `${fmtDate(g.deadline, { day: 'numeric', month: 'short', year: 'numeric' })} · ${left < 0 ? `${-left} days overdue` : `${left} days left`}` : 'No deadline'}</small></div></div>
        <div class="card hero" style="--c:${g.color}"><div class="ring">${ring(p, 92, 9, g.color)}<b>${pct(p)}</b></div>
            <div><h2>${g.type === 'number' ? `${g.current || 0} / ${g.target} ${esc(g.unit || '')}` : `${g.milestones.filter((m) => m.done).length} of ${g.milestones.length} milestones`}</h2>
            <p>${g.done ? 'Achieved 🏆' : p >= 1 ? 'Target reached — mark it achieved!' : 'Keep going.'}</p></div></div>
        ${g.type === 'number' ? `<div class="section-title">Update progress</div><div class="card" style="display:flex;gap:8px;flex-wrap:wrap">
            ${[-1, 1, 5, 10].map((v) => `<button class="btn sm" style="flex:1" data-a="g-inc" data-v="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)}</button>`).join('')}</div>`
            : `<div class="section-title">Milestones</div><div class="pick-list">${g.milestones.map((m, i) =>
                `<button class="pick-item" data-a="g-ms" data-i="${i}"><span class="toggle ${m.done ? 'on' : ''}">${m.done ? I.check : ''}</span><span class="grow" style="text-align:left;${m.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(m.text)}</span></button>`).join('') || '<p style="color:var(--muted)">No milestones — edit the goal to add some.</p>'}</div>`}
        ${habits.length ? `<div class="section-title">Habits that drive it</div><div class="list">${habits.map((h) => habitRow(h, ui.date)).join('')}</div>` : ''}
        <div class="sheet-actions"><button class="btn ${g.done ? '' : 'primary'}" data-a="g-done">${g.done ? 'Reopen goal' : 'Mark achieved'}</button></div>`;
}

// ---------- Settings
function sheetSettings() {
    const u = ui.user;
    const archived = S.habits.filter((h) => h.archived);
    return `${sheetHead('Account')}
        <div class="profile">${avatar(56).replace('data-a="settings"', '')}<div><b>${esc(u ? u.name : 'Guest')}</b>
            <small>${esc(u ? u.email : 'Not signed in')}</small><br><small><span data-syncdot class="dot ${syncClass()}"></span> <span data-synctext>${syncText()}</span></small></div></div>
        ${u ? '' : `<button class="gbtn" data-a="login" style="margin-bottom:18px">${I.google}<span>Sign in with Google to sync</span></button>`}
        <div class="section-title">Appearance</div>
        <div class="pick">${['system', 'dark', 'light'].map((t) => `<button class="${S.settings.theme === t ? 'on' : ''}" data-a="theme" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
        ${archived.length ? `<div class="section-title">Archived habits</div><div class="pick-list">${archived.map((h) =>
            `<button class="pick-item" data-a="edit-habit" data-id="${h.id}"><span class="emoji" style="--c:${h.color}">${esc(h.emoji)}</span><span class="grow" style="text-align:left">${esc(h.name)}</span><small style="color:var(--muted)">Restore</small></button>`).join('')}</div>` : ''}
        <div class="section-title">Data</div>
        <div class="menu">
            <button data-a="export"><span class="grow">Export backup</span><small>JSON</small></button>
            <button data-a="import"><span class="grow">Import backup</span></button>
            <button data-a="reset" style="color:var(--danger)"><span class="grow">Erase all data</span></button>
        </div>
        ${u ? '<button class="btn block" style="margin-top:18px" data-a="logout">Sign out</button>' : '<button class="btn block" style="margin-top:18px" data-a="leave-guest">Back to sign-in</button>'}`;
}

// ---------------------------------------------------------------- Routine player
function renderPlayer() {
    let el = document.getElementById('player');
    const pl = ui.player;
    if (!pl) { if (el) el.remove(); return; }
    const r = S.routines.find((x) => x.id === pl.id);
    if (!r) { ui.player = null; if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'player'; el.className = 'player'; document.body.appendChild(el); }
    const steps = r.steps.filter((st) => habitById(st.habitId));
    const progress = steps.map((_, i) => `<i class="${i < pl.i || pl.finished ? 'on' : ''}"></i>`).join('');
    if (pl.finished) {
        el.innerHTML = `<div class="ptop"><span></span><button class="icon-btn" data-a="player-close" aria-label="Close">${I.close}</button></div>
            <div class="progress">${progress}</div>
            <div class="pbody" style="--c:var(--accent)"><div class="pemoji">🏆</div><h2>${esc(r.name)} complete</h2>
            <p class="pmeta">${pl.completed} of ${steps.length} habits done${pl.elapsed ? ` · ${Math.round(pl.elapsed / 60)} min` : ''}</p></div>
            <div class="pfoot"><button class="btn primary" data-a="player-close">Done</button></div>`;
        return;
    }
    const st = steps[pl.i], h = habitById(st.habitId);
    el.innerHTML = `<div class="ptop"><button class="icon-btn" data-a="player-close" aria-label="Close">${I.close}</button>
            <b>${esc(r.emoji)} ${esc(r.name)}</b><span style="color:var(--muted);font-weight:700">${pl.i + 1}/${steps.length}</span></div>
        <div class="progress">${progress}</div>
        <div class="pbody" style="--c:${h.color}">
            <div class="pemoji">${esc(h.emoji)}</div><h2>${esc(h.name)}</h2>
            <p class="pmeta">${(h.target || 1) > 1 ? `${h.target} ${esc(h.unit)}` : freqLabel(h)}</p>
            ${st.minutes ? `<div class="timer" id="ptimer">${fmtTimer(pl.remaining)}</div>
                <button class="btn sm" data-a="player-toggle">${pl.running ? I.pause.replace('<svg', '<svg width="14" height="14"') + ' Pause' : I.play.replace('<svg', '<svg width="14" height="14"') + ' Start timer'}</button>` : ''}
        </div>
        <div class="pfoot">
            <button class="btn" data-a="player-skip">Skip</button>
            <button class="btn primary" data-a="player-done">${I.check.replace('<svg', '<svg width="20" height="20"')} Done</button>
        </div>`;
}

const fmtTimer = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

function startPlayer(id) {
    const r = S.routines.find((x) => x.id === id);
    if (!r || !r.steps.some((st) => habitById(st.habitId))) return;
    closeSheet();
    ui.player = { id, i: 0, remaining: 0, running: false, completed: 0, started: Date.now(), finished: false };
    loadStep();
    renderPlayer();
}

function loadStep() {
    const pl = ui.player, r = S.routines.find((x) => x.id === pl.id);
    const st = r.steps.filter((s) => habitById(s.habitId))[pl.i];
    pl.remaining = (Number(st.minutes) || 0) * 60;
    pl.running = pl.remaining > 0;
    clearInterval(pl.tick);
    if (pl.running) pl.tick = setInterval(tickPlayer, 1000);
}

function tickPlayer() {
    const pl = ui.player;
    if (!pl || !pl.running) return;
    pl.remaining--;
    const t = document.getElementById('ptimer');
    if (t) t.textContent = fmtTimer(pl.remaining);
    if (pl.remaining <= 0) {
        pl.running = false; clearInterval(pl.tick);
        try { navigator.vibrate && navigator.vibrate([120, 80, 120]); } catch (e) { }
        beep();
        renderPlayer();
    }
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; g.gain.setValueAtTime(.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .6);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .6);
    } catch (e) { }
}

function advancePlayer(done) {
    const pl = ui.player, r = S.routines.find((x) => x.id === pl.id);
    const steps = r.steps.filter((s) => habitById(s.habitId));
    if (done) {
        const h = habitById(steps[pl.i].habitId);
        setLog(S, todayKey(), h.id, h.target || 1);
        pl.completed++;
        commit({ silent: true });
        buzz();
    }
    clearInterval(pl.tick);
    if (pl.i + 1 >= steps.length) {
        pl.finished = true; pl.elapsed = Math.round((Date.now() - pl.started) / 1000);
        if (pl.completed) confetti();
    } else {
        pl.i++;
        loadStep();
    }
    renderPlayer();
}

// ---------------------------------------------------------------- Actions
function tick(id, k = ui.date) {
    const h = habitById(id);
    if (!h || k > todayKey()) return;
    const target = h.target || 1, n = countOn(S, k, id);
    logCount(h, k, target === 1 ? (n >= 1 ? 0 : 1) : (n >= target ? 0 : n + 1));
    const btn = document.querySelector(`.habit[data-id="${id}"] .check`);
    if (btn) btn.classList.add('pop');
}

// Writes a count for a habit/day and celebrates when that finishes the habit or the whole day.
function logCount(h, k, n) {
    if (n && h.createdAt && k < h.createdAt) h.createdAt = k; // back-filling history extends the habit's start
    const before = dayProgress(S, k), wasDone = isDone(S, h, k);
    setLog(S, k, h.id, n);
    buzz();
    commit();
    const after = dayProgress(S, k);
    if (after.due && after.done === after.due && before.done < before.due) { confetti(); toast('Perfect day! 🔥'); }
    else if (!wasDone && isDone(S, h, k)) {
        const s = currentStreak(S, h);
        if (s > 1 && k === todayKey()) toast(`${h.emoji} ${s}${h.freq?.type === 'weekly' ? '-week' : '-day'} streak`);
    }
}

const A = {
    tab: (el) => { ui.tab = el.dataset.id; window.scrollTo(0, 0); render(); },
    day: (el) => { ui.date = el.dataset.k; render(); },
    filter: (el) => { ui.filter = el.dataset.id; render(); },
    tick: (el) => tick(el.dataset.id),
    habit: (el) => { ui.calMonth = ui.date.slice(0, 7); openSheet({ type: 'habitDetail', id: el.dataset.id }); },
    close: () => closeSheet(),
    scrim: (el, e) => { if (e.target === el) closeSheet(); },
    settings: () => openSheet({ type: 'settings' }),

    async login() {
        ui.loginBusy = true; ui.loginError = ''; render();
        try { await (await loadSync()).signInWithGoogle(); } catch (e) {
            console.error(e);
            ui.loginError = e.code === 'auth/unauthorized-domain' ? 'This site isn’t authorised for Google sign-in yet.' : 'Sign-in failed. Please try again.';
        }
        ui.loginBusy = false;
        if (!ui.user) render();
    },
    guest: () => { try { localStorage.setItem(GUEST_KEY, '1'); } catch (e) { } startSession(null); },
    'leave-guest': () => { try { localStorage.removeItem(GUEST_KEY); } catch (e) { } endSession(); render(); },
    async logout() {
        if (!confirm('Sign out? Your data stays safe in your account.')) return;
        clearTimeout(saveTimer);
        if (ui.sync === 'saving') await pushRemote();
        try { localStorage.removeItem(cacheKey()); } catch (e) { }
        await sync.signOutUser();
    },
    theme: (el) => { S.settings.theme = el.dataset.v; commit(); },

    new: () => {
        if (ui.tab === 'routines') return A['new-routine']();
        if (ui.tab === 'goals') return A['new-goal']();
        openSheet({ type: 'newMenu' });
    },
    'new-habit': () => openSheet({ type: 'habitForm' }, newHabit({ timeOfDay: ui.filter !== 'all' ? ui.filter : 'anytime' })),
    'new-routine': () => openSheet({ type: 'routineForm' }, { id: uid(), name: '', emoji: '🌅', timeOfDay: 'morning', steps: [] }),
    'new-goal': () => openSheet({ type: 'goalForm' }, {
        id: uid(), title: '', emoji: '🎯', color: COLORS[2], type: 'number', current: 0, target: 10, unit: '',
        milestones: [], habitIds: [], deadline: '', createdAt: todayKey(), done: false
    }),

    // shared form setters
    set: (el) => { ui.draft[el.dataset.k] = el.dataset.v; renderSheet(); },

    // habit form
    tpl: (el) => {
        const t = TEMPLATES[+el.dataset.i];
        Object.assign(ui.draft, { ...t, freq: t.freq ? { ...t.freq } : { type: 'daily', days: [1, 2, 3, 4, 5], times: 3 } });
        renderSheet();
    },
    freq: (el) => { ui.draft.freq.type = el.dataset.v; renderSheet(); },
    dow: (el) => {
        const v = +el.dataset.v, days = ui.draft.freq.days;
        ui.draft.freq.days = days.includes(v) ? days.filter((x) => x !== v) : [...days, v];
        renderSheet();
    },
    times: (el) => { ui.draft.freq.times = Math.min(7, Math.max(1, ui.draft.freq.times + +el.dataset.v)); renderSheet(); },
    target: (el) => { ui.draft.target = Math.min(999, Math.max(1, ui.draft.target + +el.dataset.v)); renderSheet(); },
    'save-habit': () => {
        const d = ui.draft;
        d.name = d.name.trim();
        if (!d.name) { toast('Give your habit a name'); document.getElementById('f-name')?.focus(); return; }
        if (d.freq.type === 'days' && !d.freq.days.length) { toast('Pick at least one day'); return; }
        const i = S.habits.findIndex((h) => h.id === d.id);
        if (i >= 0) S.habits[i] = d; else S.habits.push(d);
        closeSheet(); commit(); toast(i >= 0 ? 'Habit saved' : `${d.emoji} ${d.name} added`);
    },
    'edit-habit': (el) => { const h = habitById(el.dataset.id); if (h) openSheet({ type: 'habitForm' }, JSON.parse(JSON.stringify(h))); },
    'archive-habit': () => {
        const h = habitById(ui.draft.id);
        h.archived = !h.archived;
        closeSheet(); commit(); toast(h.archived ? 'Habit archived — history kept' : 'Habit restored');
    },
    'del-habit': () => {
        if (!confirm('Delete this habit and all its history?')) return;
        const id = ui.draft.id;
        S.habits = S.habits.filter((h) => h.id !== id);
        for (const k of Object.keys(S.logs)) setLog(S, k, id, 0);
        S.routines.forEach((r) => { r.steps = r.steps.filter((st) => st.habitId !== id); });
        S.goals.forEach((g) => { g.habitIds = (g.habitIds || []).filter((x) => x !== id); });
        closeSheet(); commit(); toast('Habit deleted');
    },

    // habit detail
    'cal-nav': (el) => {
        const [y, m] = (ui.calMonth || todayKey().slice(0, 7)).split('-').map(Number);
        const d = new Date(y, m - 1 + +el.dataset.v, 1);
        ui.calMonth = keyOf(d).slice(0, 7);
        renderSheet();
    },
    'cal-tick': (el) => tick(ui.sheet.id, el.dataset.k),
    count: (el) => {
        const h = habitById(ui.sheet.id), k = ui.date;
        logCount(h, k, Math.max(0, Math.min(999, countOn(S, k, h.id) + +el.dataset.v)));
    },
    skip: () => {
        const id = ui.sheet.id, k = ui.date;
        setLog(S, k, id, isSkipped(S, k, id) ? 0 : 'skip');
        commit();
    },

    // routines
    play: (el) => startPlayer(el.dataset.id),
    'edit-routine': (el) => { const r = S.routines.find((x) => x.id === el.dataset.id); if (r) openSheet({ type: 'routineForm' }, JSON.parse(JSON.stringify(r))); },
    'step-add': (el) => {
        const h = habitById(el.dataset.id);
        ui.draft.steps.push({ habitId: h.id, minutes: (h.unit === 'min' && h.target) || 5 });
        renderSheet();
    },
    'step-del': (el) => { ui.draft.steps.splice(+el.dataset.i, 1); renderSheet(); },
    'step-up': (el) => {
        const i = +el.dataset.i, s = ui.draft.steps;
        if (i > 0) [s[i - 1], s[i]] = [s[i], s[i - 1]];
        renderSheet();
    },
    'save-routine': () => {
        const d = ui.draft;
        d.name = d.name.trim();
        if (!d.name) { toast('Name your routine'); document.getElementById('r-name')?.focus(); return; }
        if (!d.steps.length) { toast('Add at least one habit'); return; }
        const i = S.routines.findIndex((r) => r.id === d.id);
        if (i >= 0) S.routines[i] = d; else S.routines.push(d);
        closeSheet(); commit(); toast('Routine saved');
    },
    'del-routine': () => {
        if (!confirm('Delete this routine? Its habits are kept.')) return;
        S.routines = S.routines.filter((r) => r.id !== ui.draft.id);
        closeSheet(); commit();
    },
    'player-toggle': () => {
        const pl = ui.player;
        if (pl.remaining <= 0) pl.remaining = 60;
        pl.running = !pl.running;
        clearInterval(pl.tick);
        if (pl.running) pl.tick = setInterval(tickPlayer, 1000);
        renderPlayer();
    },
    'player-done': () => advancePlayer(true),
    'player-skip': () => advancePlayer(false),
    'player-close': () => { if (ui.player) clearInterval(ui.player.tick); ui.player = null; render(); },

    // goals
    goal: (el) => openSheet({ type: 'goalDetail', id: el.dataset.id }),
    'edit-goal': (el) => { const g = S.goals.find((x) => x.id === el.dataset.id); if (g) openSheet({ type: 'goalForm' }, JSON.parse(JSON.stringify(g))); },
    'ms-add': () => {
        const inp = document.getElementById('ms-new'), text = inp.value.trim();
        if (!text) return;
        ui.draft.milestones.push({ id: uid(), text, done: false });
        renderSheet();
        document.getElementById('ms-new')?.focus();
    },
    'ms-del': (el) => { ui.draft.milestones.splice(+el.dataset.i, 1); renderSheet(); },
    'ms-toggle': (el) => { const m = ui.draft.milestones[+el.dataset.i]; m.done = !m.done; renderSheet(); },
    'g-habit': (el) => {
        const id = el.dataset.id, ids = ui.draft.habitIds;
        ui.draft.habitIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
        renderSheet();
    },
    'save-goal': () => {
        const d = ui.draft;
        d.title = d.title.trim();
        if (!d.title) { toast('Name your goal'); document.getElementById('g-title')?.focus(); return; }
        d.current = Number(d.current) || 0;
        d.target = Number(d.target) || 0;
        if (d.type === 'number' && d.target <= 0) { toast('Set a target above 0'); return; }
        const i = S.goals.findIndex((g) => g.id === d.id);
        if (i >= 0) S.goals[i] = d; else S.goals.push(d);
        closeSheet(); commit(); toast('Goal saved');
    },
    'del-goal': () => {
        if (!confirm('Delete this goal?')) return;
        S.goals = S.goals.filter((g) => g.id !== ui.draft.id);
        closeSheet(); commit();
    },
    'g-inc': (el) => {
        const g = S.goals.find((x) => x.id === ui.sheet.id);
        const was = goalProgress(g);
        g.current = Math.max(0, Math.round(((Number(g.current) || 0) + +el.dataset.v) * 100) / 100);
        commit();
        if (was < 1 && goalProgress(g) >= 1) { confetti(); toast('Target reached! 🏆'); }
    },
    'g-ms': (el) => {
        const g = S.goals.find((x) => x.id === ui.sheet.id), m = g.milestones[+el.dataset.i];
        m.done = !m.done;
        commit();
        if (m.done && goalProgress(g) >= 1) { confetti(); toast('All milestones done! 🏆'); }
    },
    'g-done': () => {
        const g = S.goals.find((x) => x.id === ui.sheet.id);
        g.done = !g.done;
        commit();
        if (g.done) { confetti(); toast('Goal achieved 🏆'); }
    },

    // data
    export: () => {
        const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `life-backup-${todayKey()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    import: () => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'application/json,.json';
        inp.onchange = async () => {
            try {
                const data = normalize(JSON.parse(await inp.files[0].text()));
                if (!confirm(`Replace your data with this backup (${data.habits.length} habits, ${data.goals.length} goals)?`)) return;
                S = data; closeSheet(); commit(); toast('Backup restored');
            } catch (e) { toast('That file isn’t a valid backup'); }
        };
        inp.click();
    },
    reset: () => {
        if (!confirm('Erase all habits, routines, goals and history? This can’t be undone.')) return;
        const theme = S.settings.theme;
        S = emptyState(); S.settings.theme = theme;
        closeSheet(); commit(); toast('All data erased');
    }
};

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) fn(el, e);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (ui.player) A['player-close'](); else if (ui.sheet) closeSheet(); return; }
    if (e.key === 'Enter') {
        const t = e.target;
        if (t.dataset && t.dataset.enter) { e.preventDefault(); A[t.dataset.enter](t); }
        else if (t.matches && t.matches('.habit[data-a]')) A.habit(t);
    }
});

document.addEventListener('input', (e) => {
    const t = e.target;
    if (!ui.draft) return;
    if (t.dataset.bind) ui.draft[t.dataset.bind] = t.value;
    if (t.dataset.step != null) { ui.draft.steps[+t.dataset.step].minutes = Math.max(0, Math.min(240, Number(t.value) || 0)); }
});

// Roll over to the new day when the app is reopened after midnight.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !ui.ready) return;
    const t = todayKey();
    if (t !== ui.lastToday) {
        if (ui.date === ui.lastToday) ui.date = t;
        ui.lastToday = t;
        render();
    }
});
