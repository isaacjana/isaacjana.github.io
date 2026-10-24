// massView.js - Renders the Sunday Mass companion tab.
import { massSections, massParts, massPrayers, massFaq, postures } from './massData.js';
import { getSundayInfo, upcomingSunday, shiftSunday, colorStyles } from './massEngine.js';

const LANG_KEY = 'oratio_mass_lang';
const WHO_LABEL = { P: 'Priest', R: 'People', A: 'All' };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const multiline = s => esc(s).replace(/\n/g, '<br>');

export function initMassView({ ttsCompanion, journalEngine, showToast, updateJournalBadge }) {
    const root = document.getElementById('massRoot');
    if (!root) return;

    const today = new Date();
    const state = {
        sunday: upcomingSunday(today),
        lang: 'English',
        openAll: null
    };
    try { state.lang = localStorage.getItem(LANG_KEY) || 'English'; } catch { /* storage unavailable */ }

    const partText = (part, lang, lines) => (lines || part.lines || [])
        .map(l => (lang === 'Latin' && l.la ? l.la : l.en)).join('\n\n');

    function render() {
        const info = getSundayInfo(state.sunday);
        const isToday = state.sunday.toDateString() === today.toDateString();
        const isVigil = today.getDay() === 6 && shiftSunday(state.sunday, -1).toDateString() === today.toDateString();
        const color = colorStyles[info.color];
        const dateLabel = state.sunday.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        root.innerHTML = `
            ${renderHeader(info, color, dateLabel, isToday, isVigil)}
            ${renderToolbar()}
            ${renderPrep()}
            ${Object.keys(massSections).map(key => renderSection(key, info)).join('')}
            ${renderAfter()}
            ${renderFaq()}
        `;
        bind(info);
    }

    function renderHeader(info, color, dateLabel, isToday, isVigil) {
        const gloria = info.gloria ? 'Said' : 'Omitted';
        const accl = info.alleluia ? 'Alleluia' : 'Lenten acclamation';
        return `
        <div class="bg-white/90 dark:bg-night-card/90 backdrop-blur-md p-6 md:p-8 rounded-xl border border-gold/40 shadow-md">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <span class="text-xs font-sans font-bold uppercase text-gold tracking-widest">Sunday Mass Companion</span>
                    <h2 class="text-2xl font-display font-bold text-crimson dark:text-gold mt-1">${esc(info.name)}</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 font-sans mt-1">${esc(dateLabel)}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2 font-sans text-xs">
                    <span class="px-3 py-1.5 rounded-full border border-gold/40 bg-paper dark:bg-night-paper flex items-center gap-2">
                        <span class="inline-block w-3 h-3 rounded-full border border-gray-400/50" style="background:${color.hex}"></span>${color.label}
                    </span>
                    <span class="px-3 py-1.5 rounded-full border border-gold/40 bg-paper dark:bg-night-paper font-bold">Year ${info.cycle}</span>
                    <span class="px-3 py-1.5 rounded-full border border-gold/40 bg-paper dark:bg-night-paper">${esc(info.season)}</span>
                </div>
            </div>

            ${isToday ? `<p class="mt-4 text-sm font-sans text-crimson dark:text-gold font-semibold">✝ The Lord's Day is today — Mass is the heart of it.</p>` : ''}
            ${isVigil ? `<p class="mt-4 text-sm font-sans text-crimson dark:text-gold font-semibold">🌙 Tonight's Vigil Mass fulfills the Sunday obligation.</p>` : ''}
            ${info.note ? `<p class="mt-3 text-sm italic text-gray-700 dark:text-gray-300">${esc(info.note)}</p>` : ''}

            <div class="grid grid-cols-3 gap-2 my-5 font-sans text-center text-xs">
                <div class="p-3 rounded-lg bg-paper dark:bg-night-paper border border-gray-200 dark:border-night-border"><span class="block text-gray-500 dark:text-gray-400">Gloria</span><b class="text-sm">${gloria}</b></div>
                <div class="p-3 rounded-lg bg-paper dark:bg-night-paper border border-gray-200 dark:border-night-border"><span class="block text-gray-500 dark:text-gray-400">Before the Gospel</span><b class="text-sm">${accl}</b></div>
                <div class="p-3 rounded-lg bg-paper dark:bg-night-paper border border-gray-200 dark:border-night-border"><span class="block text-gray-500 dark:text-gray-400">Creed</span><b class="text-sm">Said</b></div>
            </div>

            <div class="flex flex-wrap gap-2 font-sans text-sm">
                <a href="${info.readingsUrl}" target="_blank" rel="noopener noreferrer"
                   class="px-4 py-2 rounded-lg bg-crimson text-white font-bold hover:bg-crimson-dark transition-all">📖 Sunday Readings (USCCB)</a>
                <a href="https://www.masstimes.org/" target="_blank" rel="noopener noreferrer"
                   class="px-4 py-2 rounded-lg border border-gold text-gold hover:bg-gold hover:text-white dark:hover:text-night-bg transition-all">⛪ Find a Mass</a>
            </div>

            <div class="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-gray-200 dark:border-night-border font-sans text-xs">
                <button data-shift="-1" class="mass-nav px-3 py-1.5 rounded border border-gray-300 dark:border-night-border hover:border-gold">‹ Previous Sunday</button>
                <button data-shift="0" class="mass-nav px-3 py-1.5 rounded border border-gold text-gold hover:bg-gold hover:text-white dark:hover:text-night-bg">This Sunday</button>
                <button data-shift="1" class="mass-nav px-3 py-1.5 rounded border border-gray-300 dark:border-night-border hover:border-gold">Next Sunday ›</button>
            </div>
        </div>`;
    }

    function renderToolbar() {
        const langBtn = (lang) => `<button data-lang="${lang}" class="mass-lang px-3 py-1.5 rounded-md ${state.lang === lang
            ? 'font-bold bg-crimson text-white dark:bg-gold dark:text-night-bg'
            : 'font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-night-card'}">${lang}</button>`;
        const jump = Object.keys(massSections).map(k =>
            `<button data-jump="${k}" class="mass-jump px-3 py-1.5 rounded-full border border-gold/40 hover:border-gold bg-paper dark:bg-night-paper">${massSections[k].icon} ${massSections[k].title}</button>`).join('');
        return `
        <div class="flex flex-col gap-2 font-sans text-xs">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1 bg-paper dark:bg-night-paper p-1 rounded-lg border border-gray-200 dark:border-night-border">
                    ${langBtn('English')}${langBtn('Latin')}${langBtn('Bilingual')}
                </div>
                <div class="flex gap-1">
                    <button id="massExpandAll" class="px-3 py-1.5 rounded border border-gray-300 dark:border-night-border hover:border-gold">Expand all</button>
                    <button id="massCollapseAll" class="px-3 py-1.5 rounded border border-gray-300 dark:border-night-border hover:border-gold">Collapse</button>
                </div>
            </div>
            <div class="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">${jump}</div>
        </div>`;
    }

    function prayerCard(id, p, extra = '') {
        return `
        <details class="mass-card bg-paper dark:bg-night-paper rounded-xl border border-gold/30 open:border-gold" data-id="${id}">
            <summary class="cursor-pointer list-none p-4 flex items-center justify-between gap-2">
                <span class="font-display font-bold text-crimson dark:text-gold">${esc(p.title)}</span>
                ${extra}
            </summary>
            <div class="px-4 pb-4">
                ${p.subtitle ? `<p class="text-xs font-sans text-gray-500 mb-2">${esc(p.subtitle)}</p>` : ''}
                <p class="prayer-text-dynamic italic text-gray-800 dark:text-gray-200 mb-3">${esc(p.text)}</p>
                <div class="flex gap-2 font-sans text-xs pt-3 border-t border-gray-200 dark:border-night-border">
                    <button data-act="copy-prayer" data-prayer="${id}" class="px-3 py-1.5 rounded border border-gray-300 dark:border-night-border hover:border-gold">📋 Copy</button>
                    <button data-act="listen-prayer" data-prayer="${id}" class="px-3 py-1.5 rounded border border-gold text-gold hover:bg-gold hover:text-white dark:hover:text-night-bg">🔊 Listen</button>
                    <button data-act="save-prayer" data-prayer="${id}" class="px-3 py-1.5 rounded border border-crimson text-crimson dark:text-crimson-light hover:bg-crimson hover:text-white ml-auto">💖 Save</button>
                </div>
            </div>
        </details>`;
    }

    function renderPrep() {
        return `
        <section class="space-y-3">
            <h3 class="font-display font-bold text-lg text-crimson dark:text-gold cross-divider">Before Mass</h3>
            <div class="bg-white/80 dark:bg-night-card/80 p-4 rounded-xl border border-gold/30 font-sans text-sm text-gray-700 dark:text-gray-300">
                <ul class="space-y-1.5 list-disc pl-5">
                    <li>Arrive a few minutes early; silence your phone.</li>
                    <li>Fast from food and drink (except water) for one hour before Communion.</li>
                    <li>If conscious of grave sin, go to Confession first.</li>
                    <li>Genuflect (or bow) toward the tabernacle as you enter your pew, then make the Sign of the Cross.</li>
                </ul>
            </div>
            ${prayerCard('before', massPrayers.before)}
        </section>`;
    }

    function renderLines(part, lines) {
        const rows = lines.map(l => {
            const isP = l.w === 'P';
            const label = WHO_LABEL[l.w];
            const chip = `<span class="shrink-0 sm:w-14 text-[10px] font-sans font-bold uppercase tracking-wider pt-1 ${isP ? 'text-gray-400' : 'text-gold'}">${label}</span>`;
            const textCls = isP ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-gray-100';
            let body;
            if (state.lang === 'Bilingual' && l.la) {
                body = `<div class="space-y-1.5">
                    <p class="prayer-text-dynamic ${textCls}">${multiline(l.en)}</p>
                    <p class="prayer-text-dynamic ${textCls} italic text-crimson dark:text-crimson-light border-l-2 border-crimson/40 pl-3">${multiline(l.la)}</p>
                </div>`;
            } else {
                const t = state.lang === 'Latin' && l.la ? l.la : l.en;
                body = `<p class="prayer-text-dynamic ${textCls} ${state.lang === 'Latin' ? 'italic' : ''}">${multiline(t)}</p>`;
            }
            return `<div class="flex flex-col sm:flex-row sm:gap-3 py-2">${chip}<div class="flex-1">${body}</div></div>`;
        }).join('');
        return `<div class="divide-y divide-gray-200/60 dark:divide-night-border/60">${rows}</div>`;
    }

    function renderPart(part, info) {
        let lines = part.lines;
        let note = part.note;
        let status = '';
        let latinTitle = part.latinTitle;
        if (part.rule === 'gloria' && !info.gloria) status = 'omitted';
        if (part.rule === 'alleluia' && !info.alleluia && part.alt) {
            lines = part.alt.lines;
            note = part.alt.note;
            latinTitle = part.alt.latinTitle || latinTitle;
        }
        const posture = postures[part.posture];
        const omitted = status === 'omitted';
        const title = latinTitle && latinTitle !== part.title
            ? `${esc(part.title)} <span class="text-xs italic font-sans font-normal text-gray-500">(${esc(latinTitle)})</span>`
            : esc(part.title);
        const badges = `
            ${part.optional ? '<span class="text-[10px] font-sans px-2 py-0.5 rounded-full bg-gray-200 dark:bg-night-card text-gray-600 dark:text-gray-400">Optional</span>' : ''}
            ${omitted ? '<span class="text-[10px] font-sans px-2 py-0.5 rounded-full bg-gray-200 dark:bg-night-card text-gray-600 dark:text-gray-400">Omitted today</span>' : ''}
            <span class="text-[10px] font-sans px-2 py-0.5 rounded-full border border-gold/50 text-gold whitespace-nowrap">${posture.icon} ${posture.label}</span>`;
        const hasText = lines && lines.length;
        return `
        <details class="mass-card ${omitted ? 'opacity-60' : ''} bg-paper dark:bg-night-paper rounded-xl border border-gold/30 open:border-gold" data-id="${part.id}">
            <summary class="cursor-pointer list-none p-4 flex items-center justify-between gap-2">
                <span class="font-display font-bold text-crimson dark:text-gold">${title}</span>
                <span class="flex items-center gap-1.5 flex-wrap justify-end">${badges}</span>
            </summary>
            <div class="px-4 pb-4">
                ${omitted ? `<p class="text-sm font-sans italic text-gray-600 dark:text-gray-400 mb-2">${info.season === 'Advent' || info.season === 'Lent' ? `The Gloria is not said during ${info.season}.` : 'The Gloria is not said at this Mass.'}</p>` : ''}
                ${note ? `<p class="text-sm font-sans text-gray-600 dark:text-gray-400 mb-3 p-3 rounded-lg bg-gold/10 border-l-2 border-gold">${esc(note)}</p>` : ''}
                ${hasText ? renderLines(part, lines) : ''}
                ${hasText ? `<div class="flex gap-2 font-sans text-xs pt-3 mt-2 border-t border-gray-200 dark:border-night-border">
                    <button data-act="copy" data-part="${part.id}" class="px-3 py-1.5 rounded border border-gray-300 dark:border-night-border hover:border-gold">📋 Copy</button>
                    <button data-act="listen" data-part="${part.id}" class="px-3 py-1.5 rounded border border-gold text-gold hover:bg-gold hover:text-white dark:hover:text-night-bg">🔊 Listen</button>
                    <button data-act="save" data-part="${part.id}" class="px-3 py-1.5 rounded border border-crimson text-crimson dark:text-crimson-light hover:bg-crimson hover:text-white ml-auto">💖 Save</button>
                </div>` : ''}
            </div>
        </details>`;
    }

    function renderSection(key, info) {
        const sec = massSections[key];
        const parts = massParts.filter(p => p.section === key);
        return `
        <section id="mass-sec-${key}" class="space-y-3 scroll-mt-32">
            <h3 class="font-display font-bold text-lg text-crimson dark:text-gold cross-divider whitespace-nowrap">${sec.icon} ${sec.title} <span class="text-xs italic font-sans font-normal text-gray-500">${sec.latin}</span></h3>
            ${parts.map(p => renderPart(p, info)).join('')}
        </section>`;
    }

    function renderAfter() {
        return `
        <section class="space-y-3">
            <h3 class="font-display font-bold text-lg text-crimson dark:text-gold cross-divider">After Communion</h3>
            ${prayerCard('spiritual', massPrayers.spiritual)}
            ${prayerCard('after', massPrayers.after)}
        </section>`;
    }

    function renderFaq() {
        return `
        <section class="space-y-3">
            <h3 class="font-display font-bold text-lg text-crimson dark:text-gold cross-divider">Good to Know</h3>
            ${massFaq.map(f => `
            <details class="bg-white/80 dark:bg-night-card/80 rounded-xl border border-gold/30 open:border-gold">
                <summary class="cursor-pointer list-none p-4 font-sans font-semibold text-sm text-gray-900 dark:text-gray-100">${esc(f.q)}</summary>
                <p class="px-4 pb-4 text-sm font-sans text-gray-700 dark:text-gray-300">${esc(f.a)}</p>
            </details>`).join('')}
            <p class="text-xs text-gray-400 font-sans text-center pt-2">Texts of the people's parts follow the Roman Missal, Third Edition. Daily Scripture readings are linked from the USCCB, which holds the Lectionary copyright.</p>
        </section>`;
    }

    function bind(info) {
        const findPart = id => massParts.find(p => p.id === id);
        const currentLines = part => (part.rule === 'alleluia' && !info.alleluia && part.alt) ? part.alt.lines : part.lines;

        root.querySelectorAll('.mass-nav').forEach(b => b.addEventListener('click', () => {
            const n = parseInt(b.dataset.shift, 10);
            state.sunday = n === 0 ? upcomingSunday(new Date()) : shiftSunday(state.sunday, n);
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }));

        root.querySelectorAll('.mass-lang').forEach(b => b.addEventListener('click', () => {
            state.lang = b.dataset.lang;
            try { localStorage.setItem(LANG_KEY, state.lang); } catch { /* ignore */ }
            const open = [...root.querySelectorAll('details.mass-card[open]')].map(d => d.dataset.id);
            const y = window.scrollY;
            render();
            open.forEach(id => { const d = root.querySelector(`details[data-id="${id}"]`); if (d) d.open = true; });
            window.scrollTo(0, y);
        }));

        root.querySelectorAll('.mass-jump').forEach(b => b.addEventListener('click', () => {
            const el = document.getElementById(`mass-sec-${b.dataset.jump}`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }));

        $setAll('#massExpandAll', true);
        $setAll('#massCollapseAll', false);
        function $setAll(sel, open) {
            const btn = root.querySelector(sel);
            btn.addEventListener('click', () => root.querySelectorAll('details.mass-card').forEach(d => { d.open = open; }));
        }

        root.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', e => {
            e.preventDefault();
            const act = btn.dataset.act;
            if (act.endsWith('-prayer')) {
                const p = massPrayers[btn.dataset.prayer];
                if (act === 'copy-prayer') navigator.clipboard.writeText(p.text).then(() => showToast(`Copied "${p.title}" ✓`));
                if (act === 'listen-prayer') { ttsCompanion.speak(p.text); showToast(`Reading "${p.title}" 🔊`); }
                if (act === 'save-prayer') {
                    journalEngine.save({ title: p.title, text: p.text, category: 'mass' });
                    showToast(`Saved "${p.title}" to Journal 💖`);
                    updateJournalBadge();
                }
                return;
            }
            const part = findPart(btn.dataset.part);
            const lines = currentLines(part);
            const en = partText(part, 'English', lines);
            const la = lines.some(l => l.la) ? partText(part, 'Latin', lines) : '';
            const shown = state.lang === 'Latin' && la ? la : en;
            if (act === 'copy') navigator.clipboard.writeText(shown).then(() => showToast(`Copied "${part.title}" ✓`));
            if (act === 'listen') { ttsCompanion.speak(shown); showToast(`Reading "${part.title}" 🔊`); }
            if (act === 'save') {
                journalEngine.save({ title: part.title, text: en, latinText: la, category: 'mass' });
                showToast(`Saved "${part.title}" to Journal 💖`);
                updateJournalBadge();
            }
        }));
    }

    render();
}
