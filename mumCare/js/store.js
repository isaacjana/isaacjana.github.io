// Local-first state. Everything lives in localStorage; cloud backup is optional (see cloud.js).
const KEY = 'mj.v2';
const CAP = 400;

export const blank = () => ({
    v: 2, updatedAt: 0,
    profile: {},          // name, stage, goal, ttcSince, age35, dueDate, babyName, babyDob, division
    periods: [],          // 'YYYY-MM-DD' period start dates
    checks: {},           // id -> true
    logs: { kicks: [], weight: [], bp: [], con: [], baby: [], mood: [] },
    appts: [],            // {id, title, when}
    kick: null,           // in-progress kick session {start, n}
    conStart: null        // in-progress contraction start (ms)
});

function normalize(s) {
    const b = blank();
    if (!s || typeof s !== 'object') return b;
    const out = { ...b, ...s, profile: { ...(s.profile || {}) }, checks: { ...(s.checks || {}) }, logs: { ...b.logs, ...(s.logs || {}) } };
    out.periods = Array.isArray(s.periods) ? [...new Set(s.periods)].sort() : [];
    out.appts = Array.isArray(s.appts) ? s.appts : [];
    for (const k in out.logs) out.logs[k] = (Array.isArray(out.logs[k]) ? out.logs[k] : []).slice(-CAP);
    return out;
}

function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch { return blank(); }
}

function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

export let state = load();

const subs = [];
export const onChange = (f) => subs.push(f);

// Mutate state, stamp it, save, and notify.
export function commit(fn) {
    if (fn) fn(state);
    state = normalize(state);
    state.updatedAt = Date.now();
    persist();
    subs.forEach(f => f('local'));
}

// Swap in a whole state (from a backup or import).
export function replace(next, source = 'cloud') {
    state = normalize(next);
    persist();
    subs.forEach(f => f(source));
}

export function erase() {
    state = blank();
    try { localStorage.removeItem(KEY); } catch { }
    subs.forEach(f => f('local'));
}
