import { state, commit, replace, erase, onChange } from './store.js';
import * as C from './content.js';
import { cloud, configure, boot, signIn, signOut } from './cloud.js';

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d || 1); };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); const day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x; };
const diffDays = (a, b) => Math.round((a - b) / DAY);
const fmt = (d, o = { day: 'numeric', month: 'short' }) => d.toLocaleDateString('en-MY', o);
const fmtLong = (d) => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });
const clock = (ms) => new Date(ms).toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const dur = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? `${h}h ${pad(m)}m` : m ? `${m}m ${pad(s)}s` : `${s}s`;
};
const ago = (ms) => {
    const m = Math.floor((Date.now() - ms) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ${pad(m % 60)}m ago` : `${plural(Math.floor(h / 24), 'day')} ago`;
};
const dayLabel = (ms) => { const n = diffDays(today(), new Date(new Date(ms).setHours(0, 0, 0, 0))); return n === 0 ? 'Today' : n === 1 ? 'Yesterday' : fmt(new Date(ms)); };

const ICON = {
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    track: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="M9 18l6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    down: '<path d="M6 9l6 6 6-6"/>'
};
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

// ---------- derived data ----------
function cycle() {
    const ps = state.periods.map(parse);
    if (!ps.length) return null;
    const gaps = [];
    for (let i = 1; i < ps.length; i++) { const g = diffDays(ps[i], ps[i - 1]); if (g >= 15 && g <= 60) gaps.push(g); }
    const recent = gaps.slice(-6);
    const len = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 28;
    const irregular = (recent.length >= 2 && Math.max(...recent) - Math.min(...recent) > 8) || len < 21 || len > 35;
    const last = ps[ps.length - 1], t = today();
    const next = addDays(last, len), ov = addDays(next, -14);
    return { last, len, irregular, known: recent.length, next, ov, fs: addDays(ov, -5), late: diffDays(t, next), day: diffDays(t, last) + 1 };
}

function cycleMarks() {
    const m = {}, c = cycle();
    if (!c) return m;
    const fert = (ov) => { for (let j = -5; j <= 0; j++) { const k = iso(addDays(ov, j)); if (!m[k]) m[k] = j === 0 ? 'ov' : 'fertile'; } };
    const ps = state.periods.map(parse);
    ps.forEach((p, i) => {
        for (let k = 0; k < 5; k++) m[iso(addDays(p, k))] = 'period';
        const nx = ps[i + 1];
        if (nx) { const g = diffDays(nx, p); if (g >= 15 && g <= 60) fert(addDays(nx, -14)); }
    });
    let start = c.last;
    for (let k = 0; k < 8; k++) {
        const nx = addDays(start, c.len);
        fert(addDays(nx, -14));
        for (let j = 0; j < 5; j++) { const key = iso(addDays(nx, j)); if (!m[key]) m[key] = 'pperiod'; }
        start = nx;
    }
    return m;
}

function preg() {
    if (!state.profile.dueDate) return null;
    const due = parse(state.profile.dueDate), left = diffDays(due, today());
    const elapsed = Math.max(0, 280 - left);
    const w = Math.floor(elapsed / 7), d = elapsed % 7;
    return { due, left, w, d, tri: w < 14 ? 1 : w < 28 ? 2 : 3, pct: Math.min(1, elapsed / 280) };
}

function baby() {
    if (!state.profile.babyDob) return null;
    const dob = parse(state.profile.babyDob), t = today(), days = diffDays(t, dob);
    let months = (t.getFullYear() - dob.getFullYear()) * 12 + t.getMonth() - dob.getMonth();
    if (t.getDate() < dob.getDate()) months--;
    const rem = diffDays(t, addMonths(dob, months));
    const age = days < 14 ? plural(days, 'day') : days < 84 ? plural(Math.floor(days / 7), 'week') : `${plural(months, 'month')}${rem >= 7 ? `, ${plural(Math.floor(rem / 7), 'week')}` : ''}`;
    return { dob, days, months, age, name: state.profile.babyName || 'Baby' };
}

const pickByWeek = (table, w) => { let out = table[0][1]; for (const [from, v] of table) if (w >= from) out = v; return out; };
const monthsTrying = () => {
    if (!state.profile.ttcSince) return null;
    const s = parse(state.profile.ttcSince + '-01'), t = today();
    return Math.max(0, (t.getFullYear() - s.getFullYear()) * 12 + t.getMonth() - s.getMonth());
};
const tasksFor = (stage) => stage === 'plan' ? C.PLAN_TASKS : stage === 'preg' ? C.PREG_TASKS : C.POST_TASKS;
const doneCount = (list) => list.filter(x => state.checks[x.id]).length;

// ---------- ui state & routing ----------
const ui = { obStage: null, tool: {}, gstage: null, cal: null, deferredInstall: null };
const TABS = [['today', 'Today', 'home'], ['track', 'Track', 'track'], ['guides', 'Guides', 'book'], ['me', 'Me', 'user']];
const TOOLS = {
    plan: [['cycle', 'Cycle'], ['history', 'History']],
    preg: [['kicks', 'Kicks'], ['con', 'Contractions'], ['bp', 'Blood pressure'], ['weight', 'Weight'], ['bag', 'Hospital bag']],
    post: [['baby', 'Baby log'], ['vax', 'Vaccines'], ['miles', 'Milestones'], ['mama', 'Mama']]
};

function route() {
    const [tab = 'today', id] = location.hash.replace(/^#\/?/, '').split('/');
    const known = ['today', 'track', 'guides', 'me', 'guide', 'checklist'];
    return { tab: known.includes(tab) ? tab : 'today', id };
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

// ---------- shared pieces ----------
const callout = (kind, text) => `<div class="callout ${kind}">${text}</div>`;
const callsBlock = () => `<div class="calls">${C.HELPLINES.map(h => `<a class="call" href="tel:${h.tel}"><span><b>${esc(h.label)}</b><small>${esc(h.note)}</small></span><strong>${esc(h.show || h.tel)}</strong></a>`).join('')}</div>`;
const progress = (done, total) => `<div class="bar" role="progressbar" aria-valuenow="${done}" aria-valuemax="${total}"><i style="width:${total ? Math.round(done / total * 100) : 0}%"></i></div>`;

function taskRow(t, extra = '') {
    const on = !!state.checks[t.id];
    return `<div class="task${on ? ' done' : ''}">
        <label><input type="checkbox" data-check="${t.id}"${on ? ' checked' : ''}><span><b>${esc(t.t)}${t.must ? ' <em class="pill pill-accent">Must</em>' : ''}</b>${extra}${t.d ? `<small>${esc(t.d)}</small>` : ''}</span></label>
        ${t.g ? `<a class="task-link" href="#/guide/${t.g}" aria-label="Open guide">${svg('next')}</a>` : ''}
    </div>`;
}

function dueTag(t) {
    const b = baby();
    if (!b || state.checks[t.id]) return '';
    const left = t.by - b.days;
    if (left < 0) return t.hard ? ` <em class="pill pill-warn">Overdue</em>` : '';
    return ` <em class="pill">${left === 0 ? 'Today' : 'by ' + fmt(addDays(b.dob, t.by))}</em>`;
}

function nextTasks(stage, n = 4) {
    const all = tasksFor(stage).filter(t => !state.checks[t.id]);
    if (stage === 'preg') {
        const p = preg();
        const now = all.filter(t => p.w >= t.w[0] - 1 && p.w <= t.w[1]);
        const late = all.filter(t => p.w > t.w[1]);
        const soon = all.filter(t => p.w < t.w[0] - 1);
        return [...late, ...now, ...soon].slice(0, n);
    }
    if (stage === 'post') return [...all].sort((a, b) => a.by - b.by).slice(0, n);
    return all.slice(0, n);
}

const pastTasks = () => { const p = preg(); return C.PREG_TASKS.filter(t => !state.checks[t.id] && p.w > t.w[1] + 2); };

function checklistCard(stage) {
    const list = tasksFor(stage), done = doneCount(list), next = nextTasks(stage);
    const title = { plan: 'Before pregnancy', preg: 'To do now', post: 'To do now' }[stage];
    const past = stage === 'preg' ? pastTasks() : [];
    return `<section class="card">
        <div class="card-head"><h2>${title}</h2><a class="link" href="#/checklist">${done}/${list.length} · See all</a></div>
        ${progress(done, list.length)}
        ${next.length ? next.map(t => taskRow(t, stage === 'post' ? dueTag(t) : '')).join('') : `<p class="muted pad-t">All done. Well done, Mama.</p>`}
        ${past.length >= 3 ? `<button class="btn soft" data-act="catch-up">Already did the earlier steps? Tick ${past.length} off</button>` : ''}
    </section>`;
}

function apptCard() {
    const now = Date.now() - 6 * 3600e3;
    const list = state.appts.filter(a => new Date(a.when).getTime() >= now).sort((a, b) => a.when.localeCompare(b.when));
    return `<section class="card">
        <div class="card-head"><h2>Appointments</h2><button class="icon-btn accent" data-act="appt-new" aria-label="Add appointment">${svg('plus')}</button></div>
        ${list.length ? list.map(a => {
        const d = new Date(a.when), n = diffDays(new Date(new Date(a.when).setHours(0, 0, 0, 0)), today());
        return `<div class="row"><div class="date-chip"><b>${d.getDate()}</b><small>${fmt(d, { month: 'short' })}</small></div>
                <div class="grow"><b>${esc(a.title)}</b><small>${fmt(d, { weekday: 'short' })} ${clock(d.getTime())} · ${n <= 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'}</small></div>
                <button class="icon-btn" data-act="appt-del" data-id="${esc(a.id)}" aria-label="Delete">${svg('x')}</button></div>`;
    }).join('') : `<p class="muted">Nothing booked. Add your next clinic visit so you do not miss it.</p>`}
    </section>`;
}

const guideLink = (id, label) => { const g = C.GUIDES.find(x => x.id === id); return `<a class="guide-row" href="#/guide/${id}"><span class="g-ico">${g.icon}</span><span class="grow"><b>${esc(label || g.title)}</b><small>${esc(g.sum)}</small></span>${svg('next')}</a>`; };

// ---------- onboarding ----------
function planFields(p = {}) {
    return `<fieldset class="seg"><legend>What are you planning?</legend>
        <label><input type="radio" name="goal" value="ttc" ${p.goal !== 'space' ? 'checked' : ''}><span>Trying for a baby</span></label>
        <label><input type="radio" name="goal" value="space" ${p.goal === 'space' ? 'checked' : ''}><span>Not yet / spacing</span></label></fieldset>
        <label class="field">First day of your last period <small>Optional</small><input type="date" name="lastPeriod" max="${iso(today())}"></label>
        <label class="field">Trying since <small>Optional, if you are trying</small><input type="month" name="ttcSince" value="${esc(p.ttcSince || '')}" max="${iso(today()).slice(0, 7)}"></label>
        <label class="check"><input type="checkbox" name="over35" ${p.over35 ? 'checked' : ''}><span>I am 35 or older</span></label>`;
}
function pregFields(p = {}, lmpGuess = '') {
    return `<fieldset class="seg"><legend>Which date do you know?</legend>
        <label><input type="radio" name="mode" value="due" ${lmpGuess ? '' : 'checked'}><span>Due date</span></label>
        <label><input type="radio" name="mode" value="lmp" ${lmpGuess ? 'checked' : ''}><span>Last period</span></label></fieldset>
        <label class="field">Date<input type="date" name="date" required value="${esc(lmpGuess || p.dueDate || '')}"></label>
        <p class="hint">Not sure? Use the first day of your last period. The clinic's dating scan will confirm it.</p>`;
}
function babyFields(p = {}) {
    return `<label class="field">Baby's date of birth<input type="date" name="babyDob" required max="${iso(today())}" value="${esc(p.babyDob || '')}"></label>
        <label class="field">Baby's name <small>Optional</small><input type="text" name="babyName" maxlength="30" autocomplete="off" value="${esc(p.babyName || '')}"></label>`;
}
const commonFields = (p = {}) => `<label class="field">Your name <small>Optional</small><input type="text" name="name" maxlength="30" autocomplete="given-name" value="${esc(p.name || '')}"></label>
    <label class="field">Division in Sarawak <small>Optional, for local pointers</small><select name="division"><option value="">Choose…</option>${Object.keys(C.DIVISIONS).map(d => `<option${p.division === d ? ' selected' : ''}>${d}</option>`).join('')}</select></label>`;

function viewOnboard() {
    const st = ui.obStage;
    if (!st) return `<div class="ob-wrap">
        <img class="ob-logo" src="assets/img/mark.png" alt="" width="96" height="96">
        <h1>MamaJourney</h1><p class="ob-tag">Sarawak edition</p>
        <p class="ob-lead">From planning a family to baby's first year, with guidance that fits life in Sarawak.</p>
        <h2 class="ob-q">Where are you now?</h2>
        ${Object.entries(C.STAGES).map(([k, s]) => `<button class="stage-card" data-stage="${k}" data-act="ob-stage"><span class="s-ico">${s.icon}</span><span class="grow"><b>${s.name}</b><small>${s.blurb}</small></span>${svg('next')}</button>`).join('')}
        <button class="btn ghost" data-act="cloud-in">Restore from Google backup</button>
        <p class="fine">Your information stays on this phone unless you choose to back it up.</p>
    </div>`;
    return `<div class="ob-wrap left">
        <button class="btn ghost back" data-act="ob-back">${svg('back')} Back</button>
        <h1 class="ob-h">${C.STAGES[st].icon} ${C.STAGES[st].name}</h1>
        <p class="ob-lead">A few details so the app can show the right things. You can change them any time.</p>
        <form data-form="setup" data-stage="${st}" class="stack">
            ${st === 'plan' ? planFields() : st === 'preg' ? pregFields() : babyFields()}
            ${commonFields()}
            <button class="btn primary" type="submit">Start</button>
        </form>
    </div>`;
}

// ---------- Today ----------
function heroPlan() {
    const c = cycle(), ttc = state.profile.goal !== 'space';
    if (!c) return `<section class="hero"><p class="eyebrow">${ttc ? 'Trying for a baby' : 'Family planning'}</p>
        <h1>Let's start with your cycle</h1><p class="hero-sub">Log the first day of your last period and the app will estimate your ${ttc ? 'fertile days' : 'next period'}.</p>
        <button class="btn light" data-act="period-new">Log last period</button></section>`;
    const t = today(), inWin = t >= c.fs && t <= c.ov, toWin = diffDays(c.fs, t);
    let head, sub;
    if (c.late > 0) { head = `Period ${plural(c.late, 'day')} late`; sub = c.late > 60 ? 'Log your latest period to refresh the estimates.' : 'A home pregnancy test is reliable from the first missed day.'; }
    else if (inWin) { head = ttc ? 'Fertile window now' : 'Fertile days now'; sub = ttc ? (diffDays(c.ov, t) === 0 ? 'Estimated ovulation day. Your best chance this cycle.' : `Best days to try. Ovulation is expected around ${fmt(c.ov)}.`) : 'Pregnancy is most likely on these days. Use protection.'; }
    else if (toWin > 0) { head = `Fertile window in ${plural(toWin, 'day')}`; sub = `${fmt(c.fs)} to ${fmt(c.ov)}`; }
    else { head = `Next period in ${plural(-c.late, 'day')}`; sub = `Expected around ${fmt(c.next)}`; }
    return `<section class="hero"><p class="eyebrow">Cycle day ${c.day}${ttc ? '' : ' · spacing'}</p>
        <h1>${head}</h1><p class="hero-sub">${sub}</p>
        <div class="stats"><div><small>Cycle</small><b>${c.len} days</b></div><div><small>Fertile days</small><b>${fmt(c.fs)} – ${fmt(c.ov)}</b></div><div><small>Next period</small><b>${fmt(c.next)}</b></div></div>
        ${c.irregular ? `<p class="hero-note">Your cycles vary, so treat these dates as rough estimates.</p>` : c.known ? '' : `<p class="hero-note">Based on a 28-day cycle. Log more periods for better estimates.</p>`}
    </section>`;
}

function todayPlan() {
    const p = state.profile, c = cycle(), ttc = p.goal !== 'space', mt = monthsTrying(), limit = p.over35 ? 6 : 12;
    let out = heroPlan();
    if (c && c.late > 0 && c.late <= 60) out += `<section class="card tint"><h2>Could you be pregnant?</h2><p>Take a home test with your first urine of the morning. If it is positive, book a visit at your Klinik Kesihatan.</p><button class="btn primary" data-act="to-preg">I'm pregnant</button></section>`;
    if (ttc) {
        if (mt === null) out += `<section class="card"><h2>How long have you been trying?</h2><p class="muted">Tell the app and it will let you know when it is worth seeing a doctor.</p><button class="btn soft" data-act="plan-edit">Set start month</button></section>`;
        else if (mt >= limit) out += `<section class="card tint"><p class="eyebrow">Trying for ${plural(mt, 'month')}</p><h2>Time to get checked, together</h2><p>After ${limit} months of trying${p.over35 ? ' at 35 or older' : ''}, doctors recommend tests for both partners. It is a normal next step, and help is available in Sarawak.</p>${guideLink('hard-path')}${guideLink('hard-tests')}</section>`;
        else out += `<section class="card"><p class="eyebrow">Trying for ${plural(mt, 'month')}</p><h2>You are on track</h2><p class="muted">Most couples conceive within a year. See a doctor after ${limit} months, or sooner if your periods are irregular.</p>${progress(mt, limit)}${guideLink('hard-when', 'When to get help')}</section>`;
        if (c && c.irregular) out += `<section class="card">${callout('tip', 'Irregular cycles are a reason to see a doctor sooner. You do not need to wait a full year.')}${guideLink('hard-when')}</section>`;
    } else {
        out += `<section class="card"><h2>Staying protected</h2>${callout('warn', 'Counting days is not reliable contraception. Use a proper method if you want to avoid pregnancy.')}${guideLink('plan-contra')}</section>`;
    }
    out += checklistCard('plan') + apptCard();
    if (ttc && !(c && c.late > 0 && c.late <= 60)) out += `<button class="btn soft wide" data-act="to-preg">Positive test? Switch to pregnancy</button>`;
    return out;
}

function ring(pct) {
    const r = 34, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="ring-bg"/><circle cx="40" cy="40" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle">${Math.round(pct * 100)}%</text></svg>`;
}

function todayPreg() {
    const p = preg();
    const left = p.left > 0 ? `${plural(p.left, 'day')} to go` : p.left === 0 ? 'Due today' : `${plural(-p.left, 'day')} past due date`;
    let out = `<section class="hero"><div class="hero-row"><div><p class="eyebrow">Trimester ${p.tri} · ${left}</p>
        <h1>Week ${p.w}${p.d ? `<span class="h-sm"> + ${plural(p.d, 'day')}</span>` : ''}</h1>
        <p class="hero-sub">Baby is about the size of ${pickByWeek(C.SIZES, p.w)}.</p></div>${ring(p.pct)}</div>
        <div class="stats"><div><small>Due date</small><b>${fmtLong(p.due)}</b></div><div><small>Checklist</small><b>${doneCount(C.PREG_TASKS)}/${C.PREG_TASKS.length} done</b></div></div></section>
        <a class="alert-strip" href="#/guide/preg-danger"><span>🚨</span><span class="grow"><b>Warning signs</b><small>When to go to hospital now</small></span>${svg('next')}</a>
        <section class="card"><p class="eyebrow">This week</p><p class="lead">${pickByWeek(C.WEEK_NOTES, p.w)}</p>
        <div class="quick">${(p.w >= 28 ? [['kicks', '👣', 'Count kicks'], ['con', '⏱️', 'Time contractions'], ['bp', '🩺', 'Log BP']] : [['bp', '🩺', 'Log BP'], ['weight', '⚖️', 'Log weight'], ['bag', '👜', 'Hospital bag']]).map(([t, i, l]) => `<button data-act="tool" data-tool="${t}"><span>${i}</span>${l}</button>`).join('')}</div></section>`;
    if (p.left < -7) out += `<section class="card tint"><h2>More than a week past your due date</h2><p>Contact your clinic today if you have not been seen this week.</p></section>`;
    out += checklistCard('preg') + apptCard();
    if (p.w >= 24) out += `<button class="btn soft wide" data-act="to-post">Baby has arrived 🎉</button>`;
    return out;
}

const FEED = { left: ['🤱', 'Left'], right: ['🤱', 'Right'], bottle: ['🍼', 'Bottle'], wet: ['💧', 'Wet'], dirty: ['💩', 'Dirty'] };
const isFeed = (t) => t === 'left' || t === 'right' || t === 'bottle';
const quickLog = () => `<div class="quick five">${Object.entries(FEED).map(([k, [i, l]]) => `<button data-act="baby-log" data-type="${k}"><span>${i}</span>${l}</button>`).join('')}</div>`;
const nextVax = () => { const b = baby(); return C.VACCINES.filter(v => !state.checks[v.id]).map(v => ({ ...v, due: addMonths(b.dob, v.m) }))[0]; };

function todayPost() {
    const b = baby(), nv = nextVax(), lastFeed = [...state.logs.baby].reverse().find(l => isFeed(l.type));
    let out = `<section class="hero"><p class="eyebrow">${b.days <= 44 ? `Mama: day ${b.days + 1} of recovery` : 'After birth'}</p>
        <h1>${esc(b.name)} is ${b.age} old</h1>
        <div class="stats"><div><small>Last feed</small><b id="feed-ago" data-t="${lastFeed ? lastFeed.t : ''}">${lastFeed ? ago(lastFeed.t) : 'Not logged'}</b></div>
        <div><small>Next vaccine</small><b>${nv ? fmt(nv.due) : 'All done'}</b></div></div></section>
        <div class="two"><a class="alert-strip" href="#/guide/post-firstweek"><span>👶</span><span class="grow"><b>Baby</b><small>Warning signs</small></span></a>
        <a class="alert-strip" href="#/guide/post-mama"><span>💗</span><span class="grow"><b>Mama</b><small>Warning signs</small></span></a></div>
        <section class="card"><div class="card-head"><h2>Quick log</h2><button class="link" data-act="tool" data-tool="baby">Today's log</button></div>${quickLog()}</section>`;
    if (nv) {
        const n = diffDays(nv.due, today());
        out += `<section class="card"><div class="card-head"><h2>Next vaccine</h2><button class="link" data-act="tool" data-tool="vax">Schedule</button></div>
            <div class="row"><div class="date-chip"><b>${nv.due.getDate()}</b><small>${fmt(nv.due, { month: 'short' })}</small></div><div class="grow"><b>${esc(nv.t)}</b><small>${nv.m === 0 ? 'Usually given before leaving hospital. Tick it off once you see it in the record book' : n < -14 ? 'Overdue. Go as soon as you can' : n <= 0 ? 'Due now' : 'in ' + plural(n, 'day')}${nv.swk ? ' · Sarawak schedule' : ''}</small></div></div></section>`;
    }
    return out + checklistCard('post') + apptCard();
}

// ---------- Track ----------
function calendar() {
    const base = ui.cal ? parse(ui.cal + '-01') : new Date(today().getFullYear(), today().getMonth(), 1);
    const marks = cycleMarks(), tIso = iso(today()), first = (base.getDay() + 6) % 7;
    const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    let cells = '<i></i>'.repeat(first);
    for (let d = 1; d <= dim; d++) {
        const k = iso(new Date(base.getFullYear(), base.getMonth(), d));
        cells += `<button class="${marks[k] || ''}${k === tIso ? ' today' : ''}" data-act="cal-day" data-d="${k}"${k > tIso ? ' disabled' : ''}>${d}</button>`;
    }
    return `<div class="cal"><div class="cal-head"><button class="icon-btn" data-act="cal-move" data-n="-1" aria-label="Previous month">${svg('back')}</button><b>${fmt(base, { month: 'long', year: 'numeric' })}</b><button class="icon-btn" data-act="cal-move" data-n="1" aria-label="Next month">${svg('next')}</button></div>
        <div class="cal-grid dow">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span>${d}</span>`).join('')}</div><div class="cal-grid">${cells}</div>
        <div class="legend"><span><i class="period"></i>Period</span><span><i class="pperiod"></i>Expected</span><span><i class="fertile"></i>Fertile</span><span><i class="ov"></i>Ovulation</span></div></div>`;
}

const toolCycle = () => `<section class="card">${calendar()}<button class="btn primary" data-act="period-new">Log period start</button><p class="hint">Tap a past day on the calendar to add or remove a period.</p></section>
    ${state.profile.goal === 'space' ? `<section class="card">${callout('warn', 'These dates are estimates and are not safe to use as contraception.')}${guideLink('plan-contra')}</section>` : `<section class="card">${guideLink('plan-window')}</section>`}`;

function toolHistory() {
    const ps = state.periods, c = cycle();
    return `<section class="card"><div class="card-head"><h2>Period history</h2>${c ? `<span class="pill">Average ${c.len} days</span>` : ''}</div>
        ${ps.length ? [...ps].reverse().map((d, i) => { const idx = ps.length - 1 - i, g = idx > 0 ? diffDays(parse(d), parse(ps[idx - 1])) : null; return `<div class="row"><div class="grow"><b>${fmtLong(parse(d))}</b><small>${g ? `${g}-day cycle before this` : 'First logged period'}</small></div><button class="icon-btn" data-act="period-del" data-d="${d}" aria-label="Remove">${svg('x')}</button></div>`; }).join('') : `<p class="muted">No periods logged yet.</p>`}
        ${c && c.irregular ? callout('tip', 'Cycles shorter than 21 days, longer than 35, or that vary a lot are worth mentioning to a doctor.') : ''}</section>
        <section class="card"><div class="card-head"><h2>Plan settings</h2><button class="link" data-act="plan-edit">Edit</button></div>
        <div class="row"><div class="grow"><b>${state.profile.goal === 'space' ? 'Not yet / spacing' : 'Trying for a baby'}</b><small>${monthsTrying() !== null && state.profile.goal !== 'space' ? `Trying for ${plural(monthsTrying(), 'month')}` : 'Tap edit to change'}${state.profile.over35 ? ' · 35 or older' : ''}</small></div></div></section>`;
}

function toolKicks() {
    const k = state.kick, p = preg(), hist = [...state.logs.kicks].reverse().slice(0, 7);
    const over = k && Date.now() - k.start > 12 * 3600e3;
    return `<section class="card center">
        ${p && p.w < 28 ? callout('tip', `Kick counting starts at 28 weeks. You are at week ${p.w}.`) : ''}
        <p class="eyebrow">Goal: 10 movements within 12 hours</p>
        <button class="big-btn" data-act="kick" aria-label="Record a movement"><span>👣</span><b>${k ? k.n : 0}<small>/10</small></b></button>
        <p class="timer" id="kick-el" data-t="${k ? k.start : ''}">${k ? dur((Date.now() - k.start) / 1000) : 'Tap each time baby moves'}</p>
        ${k ? `<div class="btn-row"><button class="btn soft" data-act="kick-undo">Undo</button><button class="btn soft" data-act="kick-reset">Reset</button></div>` : ''}
        ${over ? callout('warn', 'More than 12 hours and fewer than 10 movements. Go to your clinic or hospital now.') : ''}
    </section>
    <section class="card"><h2>Recent sessions</h2>${hist.length ? hist.map(h => `<div class="row"><div class="grow"><b>${dayLabel(h.t)}</b><small>Started ${clock(h.t)}</small></div><span class="pill ${h.dur > 12 * 3600 ? 'pill-warn' : ''}">10 in ${dur(h.dur)}</span></div>`).join('') : `<p class="muted">Your finished sessions will appear here.</p>`}
    ${guideLink('preg-kicks')}</section>`;
}

function conStats() {
    const list = state.logs.con.filter(c => Date.now() - c.t < 2 * 3600e3);
    if (list.length < 3) return null;
    const last = list.slice(-6), gaps = [];
    for (let i = 1; i < last.length; i++) gaps.push((last[i].t - last[i - 1].t) / 1000);
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    return { gap: avg(gaps), len: avg(last.map(c => c.dur)), n: list.length, span: (list[list.length - 1].t - list[0].t) / 60000 };
}

function toolCon() {
    const on = state.conStart, st = conStats(), list = [...state.logs.con].reverse().slice(0, 10), all = state.logs.con;
    const go = st && st.gap <= 330 && st.len >= 45 && st.span >= 45;
    return `<section class="card center">
        <p class="eyebrow">${on ? 'Contraction in progress' : 'Tap when a contraction starts'}</p>
        <button class="big-btn${on ? ' live' : ''}" data-act="con-toggle"><b>${on ? 'Stop' : 'Start'}</b></button>
        <p class="timer" id="con-el" data-t="${on || ''}">${on ? dur((Date.now() - on) / 1000) : '&nbsp;'}</p>
        ${st ? `<div class="stats flat"><div><small>Average gap</small><b>${dur(st.gap)}</b></div><div><small>Average length</small><b>${dur(st.len)}</b></div></div>` : ''}
        ${go ? callout('warn', 'Contractions are about 5 minutes apart and lasting close to a minute. Time to go to the hospital. Bring your Buku Pink.') : callout('tip', 'First baby: go when contractions are 5 minutes apart, 1 minute long, for 1 hour. Go sooner if you live far away, your waters break, you bleed, or baby moves less.')}
    </section>
    <section class="card"><div class="card-head"><h2>Recent</h2>${all.length ? `<button class="link" data-act="con-clear">Clear</button>` : ''}</div>
    ${list.length ? list.map((c) => { const i = all.indexOf(c), prev = all[i - 1], gap = prev && c.t - prev.t < 3600e3 ? dur((c.t - prev.t) / 1000) + ' since last' : dayLabel(c.t); return `<div class="row"><div class="grow"><b>${clock(c.t)}</b><small>${gap}</small></div><span class="pill">${dur(c.dur)}</span></div>`; }).join('') : `<p class="muted">Nothing timed yet.</p>`}
    ${guideLink('preg-labour')}</section>`;
}

const bpClass = (b) => b.s >= 160 || b.d >= 110 ? ['pill-warn', 'Very high'] : b.s >= 140 || b.d >= 90 ? ['pill-warn', 'High'] : ['', 'Normal'];
function toolBp() {
    const list = [...state.logs.bp].reverse().slice(0, 12), last = list[0];
    const lc = last && bpClass(last);
    return `<section class="card"><h2>Blood pressure</h2>
        <form data-form="bp" class="inline"><input type="number" name="s" inputmode="numeric" placeholder="Upper" min="60" max="260" required aria-label="Systolic"><span>/</span><input type="number" name="d" inputmode="numeric" placeholder="Lower" min="30" max="180" required aria-label="Diastolic"><button class="btn primary" type="submit">Save</button></form>
        ${last ? (lc[1] === 'Very high' ? callout('warn', 'This reading is very high. Rest for 5 minutes and measure again. If it is still 160/110 or more, go to hospital now.') : lc[1] === 'High' ? callout('warn', 'A reading of 140/90 or more needs to be checked. Contact your clinic today, and go straight in if you also have a headache, blurred vision or upper tummy pain.') : callout('tip', 'Your last reading is in the normal range, below 140/90.')) : ''}
    </section>
    <section class="card"><h2>History</h2>${list.length ? list.map(b => `<div class="row"><div class="grow"><b>${b.s}/${b.d}</b><small>${dayLabel(b.t)}, ${clock(b.t)}</small></div><span class="pill ${bpClass(b)[0]}">${bpClass(b)[1]}</span><button class="icon-btn" data-act="log-del" data-log="bp" data-t="${b.t}" aria-label="Delete">${svg('x')}</button></div>`).join('') : `<p class="muted">No readings yet. Many clinics and pharmacies will measure it for you.</p>`}</section>`;
}

function toolWeight() {
    const all = state.logs.weight, list = [...all].reverse().slice(0, 12);
    const change = all.length > 1 ? (all[all.length - 1].kg - all[0].kg) : null;
    return `<section class="card"><div class="card-head"><h2>Weight</h2>${change !== null ? `<span class="pill">${change >= 0 ? '+' : ''}${change.toFixed(1)} kg since first entry</span>` : ''}</div>
        <form data-form="weight" class="inline"><input type="number" name="kg" inputmode="decimal" step="0.1" min="30" max="200" placeholder="kg" required aria-label="Weight in kilograms"><button class="btn primary" type="submit">Save</button></form>
        <p class="hint">Healthy gain depends on your starting weight. Your nurse plots it in the Buku Pink.</p></section>
    <section class="card"><h2>History</h2>${list.length ? list.map(w => `<div class="row"><div class="grow"><b>${w.kg} kg</b><small>${dayLabel(w.t)}</small></div><button class="icon-btn" data-act="log-del" data-log="weight" data-t="${w.t}" aria-label="Delete">${svg('x')}</button></div>`).join('') : `<p class="muted">No entries yet.</p>`}</section>`;
}

function toolBag() {
    const cats = [...new Set(C.BAG.map(b => b.c))];
    return `<section class="card"><div class="card-head"><h2>Hospital bag</h2><span class="pill">${doneCount(C.BAG)}/${C.BAG.length} packed</span></div>${progress(doneCount(C.BAG), C.BAG.length)}<p class="hint">Aim to have it by the door at 36 weeks.</p></section>
    ${cats.map(c => `<section class="card"><h2>${c}</h2>${C.BAG.filter(b => b.c === c).map(b => taskRow(b)).join('')}</section>`).join('')}`;
}

function toolBaby() {
    const start = today().getTime(), todays = state.logs.baby.filter(l => l.t >= start);
    const n = (f) => todays.filter(f).length;
    const lastFeed = [...state.logs.baby].reverse().find(l => isFeed(l.type));
    const tip = lastFeed && lastFeed.type !== 'bottle' ? ` Start with the ${lastFeed.type === 'left' ? 'right' : 'left'} side next.` : '';
    const list = [...state.logs.baby].reverse().slice(0, 15);
    return `<section class="card"><h2>Log now</h2>${quickLog()}
        <div class="stats flat"><div><small>Feeds today</small><b>${n(l => isFeed(l.type))}</b></div><div><small>Wet</small><b>${n(l => l.type === 'wet')}</b></div><div><small>Dirty</small><b>${n(l => l.type === 'dirty')}</b></div></div>
        ${lastFeed ? callout('tip', `Last feed: ${FEED[lastFeed.type][1].toLowerCase()}, <span id="feed-ago" data-t="${lastFeed.t}">${ago(lastFeed.t)}</span>.${tip}`) : ''}
        <p class="hint">After day 5, expect 8 to 12 feeds and at least 6 wet diapers in 24 hours.</p></section>
    <section class="card"><h2>Recent</h2>${list.length ? list.map(l => `<div class="row"><span class="g-ico">${FEED[l.type][0]}</span><div class="grow"><b>${FEED[l.type][1]}${isFeed(l.type) && l.type !== 'bottle' ? ' breast' : l.type === 'bottle' ? '' : ' diaper'}</b><small>${dayLabel(l.t)}, ${clock(l.t)}</small></div><button class="icon-btn" data-act="log-del" data-log="baby" data-t="${l.t}" aria-label="Delete">${svg('x')}</button></div>`).join('') : `<p class="muted">Tap a button above to log a feed or diaper.</p>`}</section>`;
}

function toolVax() {
    const b = baby(), t = today();
    return `<section class="card"><div class="card-head"><h2>Vaccines</h2><span class="pill">${doneCount(C.VACCINES)}/${C.VACCINES.length} given</span></div>
        <p class="hint">Free at government clinics. Dates are worked out from ${esc(b.name)}'s birthday; always follow the date written in the health record book.</p>
        ${C.VACCINES.map(v => { const due = addMonths(b.dob, v.m), n = diffDays(due, t), on = state.checks[v.id]; const tag = on ? '' : v.m === 0 ? ' <em class="pill">Tick once confirmed</em>' : n < -14 ? ' <em class="pill pill-warn">Overdue</em>' : n <= 7 ? ' <em class="pill pill-accent">Due now</em>' : ''; return taskRow({ id: v.id, t: v.t, d: `${v.m === 0 ? 'At birth' : v.m + ' months'} · ${fmtLong(due)}${v.swk ? ' · Sarawak only' : ''}` }, tag); }).join('')}
        ${guideLink('post-vax')}</section>`;
}

const toolMiles = () => `<section class="card"><h2>Milestones</h2><p class="hint">Typical ages only. Babies vary, and early babies take a little longer. Mention any worry at your clinic visit.</p>
    ${C.MILESTONES.map(m => taskRow({ id: m.id, t: m.t, d: `Around ${m.m} months` })).join('')}</section>`;

function toolMama() {
    const b = baby(), last = state.logs.mood[state.logs.mood.length - 1];
    return `<section class="card"><p class="eyebrow">${b.days <= 44 ? `Day ${b.days + 1} of recovery` : `${b.age} after birth`}</p><h2>How are you, Mama?</h2>
        <p class="muted">Two short questions used by nurses to spot low mood early. Only you see the answers.</p>
        <button class="btn primary" data-act="mood">Do a mood check-in</button>
        ${last ? (last.score > 0 ? callout('warn', `Your check-in on ${fmt(new Date(last.t))} suggests you may be struggling. Please talk to your nurse or doctor this week. This is common and it is treatable.`) : callout('tip', `Check-in on ${fmt(new Date(last.t))}: no signs of low mood. Check again whenever things feel heavy.`)) : ''}
    </section>
    <section class="card"><h2>Need to talk?</h2>${callsBlock()}</section>
    <section class="card">${guideLink('post-mama')}${guideLink('post-mood')}${guideLink('post-pantang')}${guideLink('post-fp')}</section>`;
}

const TOOL_VIEW = { cycle: toolCycle, history: toolHistory, kicks: toolKicks, con: toolCon, bp: toolBp, weight: toolWeight, bag: toolBag, baby: toolBaby, vax: toolVax, miles: toolMiles, mama: toolMama };

function viewTrack() {
    const st = state.profile.stage, tools = TOOLS[st];
    const cur = tools.some(t => t[0] === ui.tool[st]) ? ui.tool[st] : tools[0][0];
    return `<div class="chips sticky" role="tablist">${tools.map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'on' : ''}" data-act="tool" data-tool="${k}">${l}</button>`).join('')}</div>${TOOL_VIEW[cur]()}`;
}

// ---------- Guides ----------
function viewGuides() {
    const gs = ui.gstage || state.profile.stage;
    const list = C.GUIDES.filter(g => g.stage === gs), secs = [...new Set(list.map(g => g.sec))];
    return `<div class="chips sticky">${Object.entries(C.STAGES).map(([k, s]) => `<button class="${k === gs ? 'on' : ''}" data-act="gstage" data-stage="${k}">${s.icon} ${s.name}</button>`).join('')}</div>
        ${secs.map(sec => `<section class="card"><h2>${sec}</h2>${list.filter(g => g.sec === sec).map(g => guideLink(g.id)).join('')}</section>`).join('')}
        <p class="fine">General information for families in Sarawak. It does not replace advice from your doctor or nurse.</p>`;
}

function viewGuide(r) {
    const g = C.GUIDES.find(x => x.id === r.id);
    if (!g) return `<section class="card"><p>Guide not found.</p></section>`;
    const div = state.profile.division;
    const local = div && (g.id === 'hard-path' || g.id === 'preg-where') ? callout('tip', `From ${esc(div)} division, the specialist hospital is usually ${esc(C.DIVISIONS[div])}. Your clinic will confirm where to go.`) : '';
    const block = ([k, v]) => k === 'h' ? `<h3>${esc(v)}</h3>` : k === 'p' ? `<p>${esc(v)}</p>` : k === 'ul' ? `<ul>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : k === 'ol' ? `<ol>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : k === 'calls' ? callsBlock() : callout(k, esc(v));
    return `<article class="guide${g.urgent ? ' urgent' : ''}"><div class="guide-top"><span class="g-ico big">${g.icon}</span><h1>${esc(g.title)}</h1><p class="lead">${esc(g.sum)}</p></div>
        ${local}${g.body.map(block).join('')}
        <p class="fine">General information, not medical advice. Rules and services change, so confirm details with your clinic or the agency named. Reviewed November 2026.</p></article>`;
}

function viewChecklist() {
    const st = state.profile.stage, list = tasksFor(st);
    const groups = st === 'preg' ? [1, 2, 3].map(n => [`Trimester ${n}`, list.filter(t => t.tri === n)])
        : st === 'post' ? [['First two weeks', list.filter(t => t.by <= 14)], ['First two months', list.filter(t => t.by > 14 && t.by <= 60)], ['Later', list.filter(t => t.by > 60)]]
            : [['Before pregnancy', list]];
    return `<section class="card"><div class="card-head"><h2>${doneCount(list)} of ${list.length} done</h2></div>${progress(doneCount(list), list.length)}</section>
        ${groups.map(([h, items]) => `<section class="card"><h2>${h}</h2>${items.map(t => taskRow(t, st === 'post' ? dueTag(t) : '')).join('')}</section>`).join('')}`;
}

// ---------- Me ----------
function viewMe() {
    const p = state.profile, st = C.STAGES[p.stage], pr = preg(), b = baby();
    const detail = p.stage === 'preg' ? `Due ${fmtLong(pr.due)}` : p.stage === 'post' ? `${esc(b.name)}, born ${fmtLong(b.dob)}` : p.goal === 'space' ? 'Not yet / spacing' : 'Trying for a baby';
    const cs = cloud.status;
    return `<section class="card"><div class="row"><span class="avatar">${esc((p.name || 'M')[0].toUpperCase())}</span><div class="grow"><b class="lg">${esc(p.name || 'Mama')}</b><small>${st.icon} ${st.name} · ${detail}</small></div></div>
        <div class="btn-row"><button class="btn soft" data-act="details-edit">Edit details</button><button class="btn soft" data-act="stage-sheet">Change stage</button></div></section>
    <section class="card"><h2>Backup</h2>
        ${cloud.user ? `<p class="muted">Backed up to ${esc(cloud.user.email || 'your Google account')}. ${cs === 'syncing' ? 'Saving…' : cs === 'error' ? esc(cloud.error) : 'Up to date.'}</p><button class="btn soft" data-act="cloud-out">Sign out</button>`
            : `<p class="muted">Your data is stored on this phone only. Sign in to keep a private backup and use it on another device.</p>${cloud.error ? callout('warn', esc(cloud.error)) : ''}<button class="btn soft" data-act="cloud-in"${cs === 'loading' ? ' disabled' : ''}>${cs === 'loading' ? 'Connecting…' : 'Back up with Google'}</button>`}
    </section>
    ${ui.deferredInstall ? `<section class="card"><h2>Install the app</h2><p class="muted">Add MamaJourney to your home screen. It opens faster and works without internet.</p><button class="btn soft" data-act="install">Add to home screen</button></section>` : ''}
    <section class="card"><h2>Emergency and helplines</h2>${callsBlock()}</section>
    <section class="card"><h2>Your data</h2><div class="btn-row"><button class="btn soft" data-act="export">Download a copy</button><button class="btn soft danger" data-act="erase">Erase everything</button></div></section>
    <p class="fine">MamaJourney Sarawak gives general information based on Ministry of Health, JPN and Sarawak Government guidance. It does not replace your doctor or nurse. In an emergency call 999.</p>`;
}

// ---------- shell ----------
function topBar(r) {
    const st = C.STAGES[state.profile.stage];
    if (r.tab === 'guide' || r.tab === 'checklist') return `<button class="icon-btn" data-act="back" aria-label="Back">${svg('back')}</button><b class="top-title">${r.tab === 'guide' ? 'Guide' : 'Checklist'}</b><span class="spacer"></span>`;
    return `<img src="assets/img/mark.png" alt="" width="34" height="34"><div class="brand"><b>MamaJourney</b><small>Sarawak</small></div>
        <button class="stage-chip" data-act="stage-sheet" aria-label="Change stage">${st.icon} ${st.name}${svg('down')}</button>`;
}
const navBar = (r) => { const cur = r.tab === 'guide' ? 'guides' : r.tab === 'checklist' ? 'today' : r.tab; return TABS.map(([k, l, i]) => `<a href="#/${k}" class="${k === cur ? 'on' : ''}"${k === cur ? ' aria-current="page"' : ''}>${svg(i)}<span>${l}</span></a>`).join(''); };
const VIEWS = { today: () => ({ plan: todayPlan, preg: todayPreg, post: todayPost }[state.profile.stage])(), track: viewTrack, guides: viewGuides, guide: viewGuide, checklist: viewChecklist, me: viewMe };

let lastKey = '';
function render() {
    const p = state.profile, root = document.documentElement;
    root.dataset.stage = p.stage || ui.obStage || 'preg';
    const ready = p.stage && (p.stage !== 'preg' || p.dueDate) && (p.stage !== 'post' || p.babyDob);
    if (!ready) { if (p.stage && !ui.obStage) ui.obStage = p.stage; document.body.className = 'ob'; $('#view').innerHTML = viewOnboard(); return; }
    document.body.className = '';
    const r = route(), key = r.tab + '/' + (r.id || '');
    $('#top').innerHTML = topBar(r);
    $('#view').innerHTML = VIEWS[r.tab](r);
    $('#nav').innerHTML = navBar(r);
    if (key !== lastKey) { window.scrollTo(0, 0); lastKey = key; }
}

function tick() {
    for (const id of ['kick-el', 'con-el']) { const el = document.getElementById(id); if (el && el.dataset.t) el.textContent = dur((Date.now() - +el.dataset.t) / 1000); }
    document.querySelectorAll('#feed-ago').forEach(el => { if (el.dataset.t) el.textContent = ago(+el.dataset.t); });
}

// ---------- sheets & toast ----------
function openSheet(title, body) {
    $('#sheet').innerHTML = `<div class="scrim" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="sheet-close" aria-label="Close">${svg('x')}</button></div>${body}</div>`;
    $('#sheet').classList.add('open');
    $('#toast').classList.remove('show');
    const f = $('#sheet input:not([type=radio]):not([type=checkbox]), #sheet select');
    if (f && matchMedia('(pointer:fine)').matches) f.focus();
}
function closeSheet() { $('#sheet').classList.remove('open'); $('#sheet').innerHTML = ''; if (sheetResolve) { sheetResolve(false); sheetResolve = null; } }
let sheetResolve = null, toastTimer = null, toastUndo = null;
function toast(msg, undo) {
    const el = $('#toast');
    toastUndo = undo || null;
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-act="undo">Undo</button>' : ''}`;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), undo ? 5000 : 2600);
}

const stageSheet = () => openSheet('Where are you now?', Object.entries(C.STAGES).map(([k, s]) => `<button class="stage-card${k === state.profile.stage ? ' on' : ''}" data-act="stage-pick" data-stage="${k}"><span class="s-ico">${s.icon}</span><span class="grow"><b>${s.name}</b><small>${s.blurb}</small></span>${k === state.profile.stage ? '<em class="pill pill-accent">Current</em>' : svg('next')}</button>`).join('') + `<p class="fine">Switching stage keeps everything you have logged.</p>`);
const setupSheet = (stage, lmpGuess) => openSheet(stage === 'plan' ? 'Planning' : stage === 'preg' ? 'Your pregnancy' : 'Your baby',
    `<form data-form="setup" data-stage="${stage}" class="stack">${stage === 'plan' ? planFields(state.profile) : stage === 'preg' ? pregFields(state.profile, lmpGuess) : babyFields(state.profile)}<button class="btn primary" type="submit">Save</button></form>`);

// ---------- actions ----------
const delLog = (name, t) => { const item = state.logs[name].find(x => x.t === t); commit(s => { s.logs[name] = s.logs[name].filter(x => x.t !== t); }); toast('Deleted', () => commit(s => { s.logs[name].push(item); s.logs[name].sort((a, b) => a.t - b.t); })); };

const ACT = {
    'ob-stage': (el) => { ui.obStage = el.dataset.stage; render(); window.scrollTo(0, 0); },
    'ob-back': () => { ui.obStage = null; render(); },
    'back': () => { if (history.length > 1) history.back(); else go('#/today'); },
    'sheet-close': closeSheet,
    'undo': () => { if (toastUndo) toastUndo(); toastUndo = null; $('#toast').classList.remove('show'); },
    'tool': (el) => { ui.tool[state.profile.stage] = el.dataset.tool; go('#/track'); window.scrollTo(0, 0); },
    'gstage': (el) => { ui.gstage = el.dataset.stage; render(); },
    'stage-sheet': stageSheet,
    'stage-pick': (el) => {
        const st = el.dataset.stage, p = state.profile;
        if ((st === 'preg' && !p.dueDate) || (st === 'post' && !p.babyDob)) return setupSheet(st);
        closeSheet(); commit(s => { s.profile.stage = st; }); ui.gstage = null; go('#/today'); toast(`Switched to ${C.STAGES[st].name}`);
    },
    'to-preg': () => { const c = cycle(); setupSheet('preg', c && c.late > -7 ? iso(c.last) : ''); },
    'to-post': () => setupSheet('post'),
    'details-edit': () => openSheet('Your details', `<form data-form="profile" class="stack">${commonFields(state.profile)}<button class="btn soft" type="button" data-act="stage-details">${{ plan: 'Edit planning settings', preg: 'Change due date', post: "Edit baby's details" }[state.profile.stage]}</button><button class="btn primary" type="submit">Save</button></form>`),
    'stage-details': () => setupSheet(state.profile.stage),
    'plan-edit': () => setupSheet('plan'),
    'period-new': () => openSheet('Log a period', `<form data-form="period" class="stack"><label class="field">First day of period<input type="date" name="d" required max="${iso(today())}" value="${iso(today())}"></label><button class="btn primary" type="submit">Save</button></form>`),
    'period-del': (el) => { const d = el.dataset.d; commit(s => { s.periods = s.periods.filter(x => x !== d); }); closeSheet(); toast('Period removed', () => commit(s => { s.periods.push(d); })); },
    'period-add': (el) => { const d = el.dataset.d; commit(s => { s.periods.push(d); }); closeSheet(); toast('Period logged'); },
    'cal-move': (el) => { const base = ui.cal ? parse(ui.cal + '-01') : today(); ui.cal = iso(addMonths(new Date(base.getFullYear(), base.getMonth(), 1), +el.dataset.n)).slice(0, 7); render(); },
    'cal-day': (el) => {
        const d = el.dataset.d, logged = state.periods.includes(d);
        openSheet(fmtLong(parse(d)), logged ? `<p class="muted">A period is logged as starting on this day.</p><button class="btn soft danger" data-act="period-del" data-d="${d}">Remove this period</button>` : `<p class="muted">Did a period start on this day?</p><button class="btn primary" data-act="period-add" data-d="${d}">Yes, period started</button>`);
    },
    'appt-new': () => openSheet('Add appointment', `<form data-form="appt" class="stack"><label class="field">What is it for?<input type="text" name="title" required maxlength="60" placeholder="e.g. Klinik Kesihatan check-up" autocomplete="off"></label><label class="field">Date and time<input type="datetime-local" name="when" required></label><button class="btn primary" type="submit">Save</button></form>`),
    'appt-del': (el) => { const a = state.appts.find(x => x.id === el.dataset.id); commit(s => { s.appts = s.appts.filter(x => x.id !== a.id); }); toast('Appointment removed', () => commit(s => { s.appts.push(a); })); },
    'kick': () => {
        const k = state.kick || { start: Date.now(), n: 0 };
        k.n++;
        if (navigator.vibrate) navigator.vibrate(15);
        if (k.n >= 10) { const d = (Date.now() - k.start) / 1000; commit(s => { s.logs.kicks.push({ t: k.start, dur: Math.round(d), n: 10 }); s.kick = null; }); toast(`10 movements in ${dur(d)}. Well done.`); }
        else commit(s => { s.kick = k; });
    },
    'kick-undo': () => commit(s => { if (s.kick) { s.kick.n--; if (s.kick.n <= 0) s.kick = null; } }),
    'kick-reset': () => { const k = state.kick; commit(s => { s.kick = null; }); toast('Session reset', () => commit(s => { s.kick = k; })); },
    'con-toggle': () => {
        if (navigator.vibrate) navigator.vibrate(15);
        if (state.conStart) { const t = state.conStart, d = Math.round((Date.now() - t) / 1000); commit(s => { if (d >= 5) s.logs.con.push({ t, dur: d }); s.conStart = null; }); if (d < 5) toast('Too short to count'); }
        else commit(s => { s.conStart = Date.now(); });
    },
    'con-clear': () => { const old = state.logs.con; commit(s => { s.logs.con = []; }); toast('Contractions cleared', () => commit(s => { s.logs.con = old; })); },
    'catch-up': () => { const ids = pastTasks().map(t => t.id); commit(s => { ids.forEach(id => { s.checks[id] = true; }); }); toast(`${ids.length} earlier steps ticked off`, () => commit(s => { ids.forEach(id => { delete s.checks[id]; }); })); },
    'log-del': (el) => delLog(el.dataset.log, +el.dataset.t),
    'baby-log': (el) => { const type = el.dataset.type, t = Date.now(); if (navigator.vibrate) navigator.vibrate(15); commit(s => { s.logs.baby.push({ t, type }); }); toast(`${FEED[type][1]} logged at ${clock(t)}`, () => commit(s => { s.logs.baby = s.logs.baby.filter(x => x.t !== t); })); },
    'mood': () => openSheet('Mood check-in', `<form data-form="mood" class="stack"><p class="muted">Over the past month, have you often been bothered by:</p>
        ${[['a', 'Feeling down, depressed or hopeless?'], ['b', 'Having little interest or pleasure in doing things?']].map(([k, q]) => `<fieldset class="seg"><legend>${q}</legend><label><input type="radio" name="${k}" value="1" required><span>Yes</span></label><label><input type="radio" name="${k}" value="0"><span>No</span></label></fieldset>`).join('')}
        ${callout('warn', 'If you have thoughts of harming yourself or your baby, call 999 or Talian HEAL 15555 now.')}<button class="btn primary" type="submit">Save</button></form>`),
    'cloud-in': async () => { try { await signIn(); if (!$('#sheet').classList.contains('open')) toast('Signed in'); } catch { if (cloud.error) toast(cloud.error); } },
    'cloud-out': async () => { await signOut(); toast('Signed out. Data stays on this phone.'); },
    'install': async () => { const e = ui.deferredInstall; ui.deferredInstall = null; if (e) { e.prompt(); } render(); },
    'export': () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); a.download = `mamajourney-${iso(today())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); },
    'erase': () => openSheet('Erase everything?', `<p class="muted">This removes all your logs and settings from this phone${cloud.user ? ' and signs you out. Your online backup is kept' : ''}. It cannot be undone.</p><button class="btn primary danger-bg" data-act="erase-yes">Erase everything</button>`),
    'erase-yes': async () => { closeSheet(); if (cloud.user) await signOut(); ui.obStage = null; erase(); location.hash = '#/today'; },
    'conflict': (el) => { const r = sheetResolve; sheetResolve = null; closeSheet(); if (r) r(el.dataset.v === 'remote'); }
};

const FORMS = {
    setup: (d, form) => {
        const st = form.dataset.stage, t = today();
        if (st === 'preg') {
            const date = parse(d.date), due = d.mode === 'lmp' ? addDays(date, 280) : date, left = diffDays(due, t);
            if (!(left <= 290 && left >= -30)) return toast(d.mode === 'lmp' ? 'That last period date does not look right. Please check it.' : 'That due date does not look right. Please check it.');
            commit(s => { s.profile.dueDate = iso(due); });
        } else if (st === 'post') {
            if (!d.babyDob || parse(d.babyDob) > t) return toast("Please enter baby's date of birth.");
            commit(s => { s.profile.babyDob = d.babyDob; s.profile.babyName = (d.babyName || '').trim(); });
        } else {
            commit(s => { s.profile.goal = d.goal || 'ttc'; s.profile.ttcSince = d.ttcSince || ''; s.profile.over35 = !!d.over35; if (d.lastPeriod) s.periods.push(d.lastPeriod); });
        }
        commit(s => { s.profile.stage = st; if ('name' in d) s.profile.name = d.name.trim(); if ('division' in d) s.profile.division = d.division; });
        ui.gstage = null; closeSheet(); go('#/today'); window.scrollTo(0, 0);
    },
    profile: (d) => { commit(s => { s.profile.name = d.name.trim(); s.profile.division = d.division; }); closeSheet(); toast('Saved'); },
    period: (d) => { if (!d.d || d.d > iso(today())) return toast('Choose a date that is today or earlier.'); commit(s => { s.periods.push(d.d); }); closeSheet(); toast('Period logged'); },
    appt: (d) => { commit(s => { s.appts.push({ id: 'a' + Date.now(), title: d.title.trim(), when: d.when }); }); closeSheet(); toast('Appointment saved'); },
    bp: (d) => { commit(s => { s.logs.bp.push({ t: Date.now(), s: +d.s, d: +d.d }); }); toast('Reading saved'); },
    weight: (d) => { commit(s => { s.logs.weight.push({ t: Date.now(), kg: Math.round(+d.kg * 10) / 10 }); }); toast('Weight saved'); },
    mood: (d) => { const score = +d.a + +d.b; commit(s => { s.logs.mood.push({ t: Date.now(), score }); s.checks['pp.mood'] = true; }); closeSheet(); toast(score ? 'Saved. Please reach out to someone this week.' : 'Saved. Glad you are doing okay.'); }
};

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', (e) => {
    const id = e.target.dataset && e.target.dataset.check;
    if (!id) return;
    const on = e.target.checked;
    commit(s => { if (on) s.checks[id] = true; else delete s.checks[id]; });
});
document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    FORMS[form.dataset.form](Object.fromEntries(new FormData(form)), form);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#sheet').classList.contains('open')) closeSheet(); });
window.addEventListener('hashchange', () => { closeSheet(); render(); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ui.deferredInstall = e; if (route().tab === 'me') render(); });

onChange(render);
configure({
    status: () => {
        if (state.profile.stage && route().tab === 'me') render();
        else if (!state.profile.stage && cloud.status === 'synced') toast('Signed in. No backup found, so let us set you up.');
    },
    conflict: (remote) => new Promise((resolve) => {
        openSheet('Backup found', `<p class="muted">This Google account already has a backup from ${fmtLong(new Date(remote.updatedAt || Date.now()))}. Which one do you want to keep?</p>
            <button class="btn primary" data-act="conflict" data-v="remote">Use the backup</button><button class="btn soft" data-act="conflict" data-v="local">Keep what is on this phone</button>`);
        sheetResolve = resolve;
    })
});

render();
setInterval(tick, 1000);
boot();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('service-worker.js').catch(() => { });
