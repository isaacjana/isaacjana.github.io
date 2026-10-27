// Data model, date helpers and habit statistics. Pure functions, no DOM.

export const COLORS = ['#c8ff3d', '#ff6b4a', '#ffb547', '#4ade80', '#38bdf8', '#818cf8', '#f472b6', '#a78bfa', '#2dd4bf', '#f5f5f4'];
export const EMOJIS = ['💧', '📖', '🧘', '🏃', '💪', '🥗', '😴', '✍️', '🧠', '🚶', '🍎', '☀️', '🌙', '🎯', '🎸', '🧹', '💊', '🙏', '📵', '🚭', '🦷', '🛏️', '💻', '🌱', '💰', '🫁', '❤️', '🎨', '🗣️', '☕'];
export const TIMES = [
    { id: 'morning', label: 'Morning', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { id: 'evening', label: 'Evening', icon: '🌙' },
    { id: 'anytime', label: 'Anytime', icon: '✨' }
];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TEMPLATES = [
    { name: 'Drink water', emoji: '💧', color: '#38bdf8', target: 8, unit: 'glasses', timeOfDay: 'anytime' },
    { name: 'Read', emoji: '📖', color: '#ffb547', target: 20, unit: 'min', timeOfDay: 'evening' },
    { name: 'Meditate', emoji: '🧘', color: '#a78bfa', target: 1, unit: '', timeOfDay: 'morning' },
    { name: 'Workout', emoji: '💪', color: '#ff6b4a', target: 1, unit: '', timeOfDay: 'morning', freq: { type: 'weekly', days: [], times: 3 } },
    { name: 'Walk 10k steps', emoji: '🚶', color: '#4ade80', target: 1, unit: '', timeOfDay: 'anytime' },
    { name: 'Journal', emoji: '✍️', color: '#f472b6', target: 1, unit: '', timeOfDay: 'evening' },
    { name: 'No phone in bed', emoji: '📵', color: '#818cf8', target: 1, unit: '', timeOfDay: 'evening' },
    { name: 'Make the bed', emoji: '🛏️', color: '#2dd4bf', target: 1, unit: '', timeOfDay: 'morning' },
    { name: 'Eat vegetables', emoji: '🥗', color: '#c8ff3d', target: 1, unit: '', timeOfDay: 'afternoon' },
    { name: 'Sleep by 11pm', emoji: '😴', color: '#818cf8', target: 1, unit: '', timeOfDay: 'evening' }
];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------- Dates (local time, 'YYYY-MM-DD' keys) ----------
export const pad = (n) => String(n).padStart(2, '0');
export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayKey = () => keyOf(new Date());
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
export const dowOf = (k) => parseKey(k).getDay();
export const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
// Weeks start on Monday.
export const weekStart = (k) => addDays(k, -((dowOf(k) + 6) % 7));

export function emptyState() {
    return { v: 1, habits: [], routines: [], goals: [], logs: {}, settings: { theme: 'system' }, updatedAt: 0 };
}

export function normalize(s) {
    const base = emptyState();
    if (!s || typeof s !== 'object') return base;
    return {
        ...base, ...s,
        habits: Array.isArray(s.habits) ? s.habits : [],
        routines: Array.isArray(s.routines) ? s.routines : [],
        goals: Array.isArray(s.goals) ? s.goals : [],
        logs: s.logs && typeof s.logs === 'object' ? s.logs : {},
        settings: { ...base.settings, ...(s.settings || {}) }
    };
}

export function newHabit(partial = {}) {
    return {
        id: uid(), name: '', emoji: '🎯', color: COLORS[0], timeOfDay: 'anytime',
        freq: { type: 'daily', days: [1, 2, 3, 4, 5], times: 3 },
        target: 1, unit: '', createdAt: todayKey(), archived: false, ...partial
    };
}

export function seedState() {
    const s = emptyState();
    const picks = [TEMPLATES[0], TEMPLATES[2], TEMPLATES[3], TEMPLATES[1], TEMPLATES[5]];
    s.habits = picks.map((t) => newHabit({ ...t, freq: t.freq || { type: 'daily', days: [1, 2, 3, 4, 5], times: 3 } }));
    s.routines = [{
        id: uid(), name: 'Morning routine', emoji: '🌅', timeOfDay: 'morning',
        steps: [{ habitId: s.habits[1].id, minutes: 10 }, { habitId: s.habits[2].id, minutes: 30 }, { habitId: s.habits[0].id, minutes: 0 }]
    }];
    s.goals = [{
        id: uid(), title: 'Read 12 books this year', emoji: '📚', color: '#ffb547', type: 'number',
        current: 0, target: 12, unit: 'books', milestones: [], habitIds: [s.habits[3].id],
        deadline: `${new Date().getFullYear()}-12-31`, createdAt: todayKey(), done: false
    }];
    return s;
}

// ---------- Logs ----------
// logs[date][habitId] = count (number >= 0) or 'skip'
export const getLog = (s, k, id) => (s.logs[k] || {})[id];
export const countOn = (s, k, id) => { const v = getLog(s, k, id); return typeof v === 'number' ? v : 0; };
export const isSkipped = (s, k, id) => getLog(s, k, id) === 'skip';
export const isDone = (s, h, k) => countOn(s, k, h.id) >= (h.target || 1);

export function setLog(s, k, id, val) {
    if (!s.logs[k]) s.logs[k] = {};
    if (val === 0 || val == null) delete s.logs[k][id];
    else s.logs[k][id] = val;
    if (!Object.keys(s.logs[k]).length) delete s.logs[k];
}

export const activeHabits = (s) => s.habits.filter((h) => !h.archived);

// Days in the habit's week (up to and excluding k) where the habit was completed.
function weekDoneBefore(s, h, k) {
    let n = 0;
    for (let d = weekStart(k); d < k; d = addDays(d, 1)) if (isDone(s, h, d)) n++;
    return n;
}
export function weekDoneCount(s, h, k) {
    let n = 0;
    const ws = weekStart(k);
    for (let i = 0; i < 7; i++) if (isDone(s, h, addDays(ws, i))) n++;
    return n;
}

// Whether a habit is expected on a given day.
export function isDue(s, h, k) {
    if (h.createdAt && k < h.createdAt) return false;
    const f = h.freq || { type: 'daily' };
    if (f.type === 'days') return (f.days || []).includes(dowOf(k));
    if (f.type === 'weekly') return isDone(s, h, k) || weekDoneBefore(s, h, k) < (f.times || 1);
    return true;
}

export function freqLabel(h) {
    const f = h.freq || { type: 'daily' };
    if (f.type === 'days') {
        const d = [...(f.days || [])].sort();
        if (d.length === 7) return 'Every day';
        if (d.join() === '1,2,3,4,5') return 'Weekdays';
        if (d.join() === '0,6') return 'Weekends';
        return d.map((i) => DOW[i]).join(' · ');
    }
    if (f.type === 'weekly') return `${f.times}× a week`;
    return 'Every day';
}

// Day progress over due habits (skipped ones excluded).
export function dayProgress(s, k) {
    let due = 0, done = 0;
    for (const h of activeHabits(s)) {
        if (!isDue(s, h, k) || isSkipped(s, k, h.id)) continue;
        due++;
        if (isDone(s, h, k)) done++;
    }
    return { due, done, ratio: due ? done / due : 0 };
}

// ---------- Streaks & rates ----------
export function currentStreak(s, h, today = todayKey()) {
    const f = h.freq || { type: 'daily' };
    if (f.type === 'weekly') {
        let n = 0, ws = weekStart(today);
        if (weekDoneCount(s, h, ws) >= f.times) n++;
        ws = addDays(ws, -7);
        while (h.createdAt ? addDays(ws, 6) >= h.createdAt : n < 520) {
            if (weekDoneCount(s, h, ws) >= f.times) n++; else break;
            ws = addDays(ws, -7);
        }
        return n;
    }
    let n = 0;
    for (let k = today, i = 0; i < 3650; k = addDays(k, -1), i++) {
        if (h.createdAt && k < h.createdAt) break;
        if (!isDue(s, h, k) || isSkipped(s, k, h.id)) continue;
        if (isDone(s, h, k)) n++;
        else if (k !== today) break;
    }
    return n;
}

export function bestStreak(s, h, today = todayKey()) {
    const f = h.freq || { type: 'daily' };
    const start = h.createdAt || firstLogKey(s, h) || today;
    let best = 0, run = 0;
    if (f.type === 'weekly') {
        for (let ws = weekStart(start); ws <= today; ws = addDays(ws, 7)) {
            if (weekDoneCount(s, h, ws) >= f.times) { run++; best = Math.max(best, run); }
            else if (ws !== weekStart(today)) run = 0;
        }
        return best;
    }
    for (let k = start; k <= today; k = addDays(k, 1)) {
        if (!isDue(s, h, k) || isSkipped(s, k, h.id)) continue;
        if (isDone(s, h, k)) { run++; best = Math.max(best, run); }
        else if (k !== today) run = 0;
    }
    return best;
}

function firstLogKey(s, h) {
    return Object.keys(s.logs).sort().find((k) => s.logs[k][h.id] != null);
}

export function completionRate(s, h, days = 30, today = todayKey()) {
    const f = h.freq || { type: 'daily' };
    if (f.type === 'weekly') {
        let met = 0, total = 0;
        const weeks = Math.ceil(days / 7);
        for (let i = 0; i < weeks; i++) {
            const ws = addDays(weekStart(today), -7 * i);
            if (h.createdAt && addDays(ws, 6) < h.createdAt) break;
            const ok = weekDoneCount(s, h, ws) >= f.times;
            if (i === 0 && !ok) continue; // current week still in progress
            total++; if (ok) met++;
        }
        return total ? met / total : 0;
    }
    let due = 0, done = 0;
    for (let i = 0; i < days; i++) {
        const k = addDays(today, -i);
        if (h.createdAt && k < h.createdAt) break;
        if (!isDue(s, h, k) || isSkipped(s, k, h.id)) continue;
        const ok = isDone(s, h, k);
        if (k === today && !ok) continue;
        due++; if (ok) done++;
    }
    return due ? done / due : 0;
}

export function totalCompletions(s, h) {
    let n = 0;
    for (const k in s.logs) if (isDone(s, h, k)) n++;
    return n;
}

// Perfect days in a row (every due habit done), counting back from today.
export function perfectDayStreak(s, today = todayKey()) {
    let n = 0;
    for (let k = today, i = 0; i < 3650; k = addDays(k, -1), i++) {
        const p = dayProgress(s, k);
        if (!p.due) { if (i > 400) break; continue; }
        if (p.done === p.due) n++;
        else if (k !== today) break;
    }
    return n;
}

// ---------- Goals ----------
export function goalProgress(g) {
    if (g.type === 'milestones') {
        const m = g.milestones || [];
        return m.length ? m.filter((x) => x.done).length / m.length : (g.done ? 1 : 0);
    }
    return g.target ? Math.min(1, (g.current || 0) / g.target) : 0;
}
