/* =========================================================
   Cozy Tales - app.js
   Storage, bookshelf, reader (page turns, tappable art,
   read-aloud), grown-up area and PWA registration.
   ========================================================= */
(function () {
  'use strict';
  const SB = window.SB = window.SB || {};
  const A = SB.art;

  // ---------- Storage (every call is wrapped) ----------
  const PREFIX = 'cozytales.';
  SB.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    clearProgress() {
      try {
        ['done', 'pos'].forEach(k => localStorage.removeItem(PREFIX + k));
      } catch (e) { /* ignore */ }
    }
  };

  const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let home, booksEl, stage, pagesEl, dotsEl, homeBtn, voiceBtn, prevBtn, nextBtn, grownBtn, grown;
  let story = null;      // open story
  let idx = 0;           // page index (story.pages.length = the end page)
  let sheet = null;      // current page element
  let busy = false;
  let turnLock = 0;
  let swipeUntil = 0;
  let current = null;    // { story, bookEl }

  // ---------- Read-aloud ----------
  const tts = (() => {
    const ok = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    let rate = 0.95;
    let runId = 0;
    let timer = 0;
    let fallback = 0;
    let voice = null;

    function pickVoice() {
      if (!ok) return null;
      const vs = speechSynthesis.getVoices() || [];
      if (!vs.length) return null;
      const en = vs.filter(v => /^en/i.test(v.lang));
      const pref = en.find(v => /(samantha|karen|serena|moira|google (uk|us) english|aria|jenny|natural|female)/i.test(v.name));
      return pref || en[0] || null;
    }

    function stop() {
      runId++;
      clearTimeout(timer); clearInterval(fallback);
      document.querySelectorAll('.w.on').forEach(w => w.classList.remove('on'));
      if (ok) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    }

    // words: [{el, start, end}] positions inside `text`
    function speak(text, words, delay) {
      if (!ok) return;
      stop();
      const id = runId;
      timer = setTimeout(() => {
        if (id !== runId) return;
        try {
          const u = new SpeechSynthesisUtterance(text);
          voice = voice || pickVoice();
          if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
          u.rate = rate;
          u.pitch = 1.1;
          let got = false;
          const light = i => {
            document.querySelectorAll('.w.on').forEach(w => w.classList.remove('on'));
            if (words[i]) words[i].el.classList.add('on');
          };
          u.onboundary = e => {
            if (id !== runId || (e.name && e.name !== 'word')) return;
            got = true;
            clearInterval(fallback);
            let i = 0;
            for (let k = 0; k < words.length; k++) if (words[k].start <= e.charIndex) i = k;
            light(i);
          };
          u.onend = u.onerror = () => {
            if (id !== runId) return;
            clearInterval(fallback);
            document.querySelectorAll('.w.on').forEach(w => w.classList.remove('on'));
          };
          speechSynthesis.speak(u);
          // Some voices never report word boundaries: highlight on a timer instead.
          if (words.length > 1) {
            fallback = setTimeout(() => {
              if (id !== runId || got) return;
              let i = 0;
              light(0);
              const per = 60000 / (165 * rate);
              fallback = setInterval(() => {
                if (id !== runId || got) { clearInterval(fallback); return; }
                i++;
                if (i >= words.length) { clearInterval(fallback); return; }
                light(i);
              }, per);
            }, 900);
          }
        } catch (e) { /* ignore */ }
      }, delay == null ? 60 : delay);
    }

    if (ok && speechSynthesis.addEventListener) {
      speechSynthesis.addEventListener('voiceschanged', () => { voice = pickVoice(); });
    }
    return { ok, speak, stop, setRate(r) { rate = r; }, getRate: () => rate };
  })();

  let autoRead = false;

  // ---------- The shelf ----------
  const ROT = [-3, 2, -2, 3, -2];
  const BOB = [5.2, 6.1, 5.6, 6.4, 5.0];

  function buildFloor() {
    const w = 1600, h = 900, r = A.rng(42);
    const col = n => SB.color(n);
    let g = `<path d="${A.blob(w * 0.5, h * 0.56, w * 0.42, h * 0.36, 7, 0.05, 12)}" fill="${col('cream-2')}"/>`;
    const cols = ['pink', 'mint', 'sky', 'butter', 'lilac'];
    for (let i = 0; i < 26; i++) g += `<circle cx="${r() * w}" cy="${r() * h}" r="${3 + r() * 5}" fill="${col(cols[i % 5])}" opacity=".5"/>`;
    $('floorArt').innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${g}</svg>`;

    // logo: a little open book with a smile
    const k = col('ink');
    $('logo').innerHTML = `<svg viewBox="0 0 120 120">` +
      `<path d="${A.wrect(10, 38, 48, 58, 10, 3)}" fill="${col('pink')}" stroke="${k}" stroke-width="5"/>` +
      `<path d="${A.wrect(62, 38, 48, 58, 10, 4)}" fill="${col('mint')}" stroke="${k}" stroke-width="5"/>` +
      A.face(34, 66, 12, 'happy').replace(/<g class="eyes">/, '<g>') +
      `<path d="M84 58 q8 -8 16 0 M84 70 q8 -8 16 0 M84 82 q8 -8 16 0" fill="none" stroke="${col('mint-d')}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M60 24 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1Z" fill="${col('butter')}" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `</svg>`;
  }

  function buildShelf() {
    booksEl.innerHTML = '';
    const done = SB.store.get('done', {}) || {};
    SB.stories.forEach((s, i) => {
      const cell = document.createElement('div');
      cell.className = 'book-cell';
      const b = document.createElement('button');
      b.className = 'book';
      b.setAttribute('aria-label', s.title);
      b.style.setProperty('--rot', ROT[i % ROT.length] + 'deg');
      b.style.setProperty('--bob', BOB[i % BOB.length] + 's');
      b.style.setProperty('--delay', (-i * 0.9) + 's');
      const inner = document.createElement('div');
      inner.className = 'book-inner';
      inner.innerHTML = A.book(SB.color(s.color), SB.color(s.dark), SB.color(s.win === 'night' ? 'night' : s.win === 'sunny' ? 'day' : s.win), s.cover(), !!done[s.id]);
      const title = document.createElement('span');
      title.className = 'book-title';
      title.textContent = s.title;
      b.append(inner, title);
      b.addEventListener('pointerdown', () => { b.classList.add('press'); SB.audio.play('tap'); });
      const unpress = () => b.classList.remove('press');
      b.addEventListener('pointerup', unpress);
      b.addEventListener('pointerleave', unpress);
      b.addEventListener('pointercancel', unpress);
      b.addEventListener('click', () => open(s, b));
      cell.appendChild(b);
      booksEl.appendChild(cell);
    });
  }

  // ---------- Opening and closing a book ----------
  function bookTransform(el) {
    const r = el.getBoundingClientRect();
    return `translate(${r.left}px, ${r.top}px) scale(${r.width / window.innerWidth}, ${r.height / window.innerHeight})`;
  }

  function fullscreen(on) {
    try {
      const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
      if (standalone) return;
      if (on) {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
          const p = req.call(el, { navigationUI: 'hide' });
          if (p && p.catch) p.catch(() => {});
        }
      } else {
        const ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) {
          const p = ex.call(document);
          if (p && p.catch) p.catch(() => {});
        }
      }
    } catch (e) { /* ignore */ }
  }

  function open(s, bookEl) {
    if (current || busy) return;
    busy = true;
    SB.audio.unlock();
    SB.audio.play('sparkle');
    fullscreen(true);

    story = s;
    const pos = SB.store.get('pos', {}) || {};
    idx = clamp(pos[s.id] || 0, 0, s.pages.length - 1);
    stage.style.setProperty('--page-bg', SB.color(s.theme));
    pagesEl.innerHTML = '';
    sheet = null;
    homeBtn.hidden = voiceBtn.hidden = prevBtn.hidden = nextBtn.hidden = true;
    dotsEl.style.opacity = '0';

    stage.classList.remove('anim');
    stage.style.transform = bookTransform(bookEl);
    stage.style.borderRadius = '45%';
    stage.style.pointerEvents = 'none';
    stage.hidden = false;
    render(0, true);
    current = { story: s, bookEl };

    void stage.offsetWidth;
    stage.classList.add('anim');
    stage.style.transform = 'none';
    stage.style.borderRadius = '0';
    home.classList.add('dim');
    document.body.classList.add('in-book');

    setTimeout(() => {
      stage.style.pointerEvents = '';
      stage.classList.remove('anim');
      homeBtn.hidden = false;
      voiceBtn.hidden = !tts.ok;
      prevBtn.hidden = nextBtn.hidden = false;
      dotsEl.style.opacity = '1';
      busy = false;
      if (autoRead) readPage(300);
    }, reduced ? 30 : 540);
  }

  function close() {
    if (!current || busy) return;
    busy = true;
    tts.stop();
    SB.audio.play('down');
    fullscreen(false);
    homeBtn.hidden = voiceBtn.hidden = prevBtn.hidden = nextBtn.hidden = true;
    dotsEl.style.opacity = '0';
    stage.style.pointerEvents = 'none';
    buildShelf();                       // refresh the "finished" stars
    const bookEl = booksEl.children[SB.stories.indexOf(current.story)].firstChild;
    stage.classList.add('anim');
    stage.style.transform = bookTransform(bookEl);
    stage.style.borderRadius = '45%';
    home.classList.remove('dim');
    document.body.classList.remove('in-book');

    setTimeout(() => {
      pagesEl.innerHTML = '';
      sheet = null;
      stage.hidden = true;
      stage.classList.remove('anim');
      current = null;
      story = null;
      busy = false;
    }, reduced ? 30 : 540);
  }

  // ---------- Building pages ----------
  const svgWrap = inner => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Picture for this page">${inner}</svg>`;

  // "Hello *big* world" -> word spans + the plain text to speak
  function buildWords(text, p) {
    const words = [];
    let plain = '';
    let em = false;
    text.split(/\s+/).forEach((tok, i) => {
      if (tok.charAt(0) === '*') em = true;
      const clean = tok.replace(/\*/g, '');
      const span = document.createElement('span');
      span.className = 'w' + (em ? ' em' : '');
      span.textContent = clean;
      const start = plain.length;
      plain += (i ? ' ' : '') + clean;
      words.push({ el: span, start: i ? start + 1 : 0, end: plain.length });
      if (i) p.appendChild(document.createTextNode(' '));
      p.appendChild(span);
      if (tok.charAt(tok.length - 1) === '*') em = false;
    });
    return { words, plain };
  }

  let spoken = { text: '', words: [] };

  function buildSheet(i) {
    const el = document.createElement('div');
    el.className = 'sheet';
    const art = document.createElement('div');
    art.className = 'art';
    const text = document.createElement('div');
    text.className = 'text';

    if (i < story.pages.length) {
      const page = story.pages[i];
      art.innerHTML = svgWrap(page.art());
      const p = document.createElement('p');
      const built = buildWords(page.text, p);
      text.appendChild(p);
      el._spoken = built.plain ? { text: built.plain, words: built.words } : null;
    } else {
      art.innerHTML = svgWrap(
        A.sky(story.win === 'sunny' ? 'sunny' : story.win === 'day' ? 'day' : story.win === 'night' ? 'night' : 'day') +
        `<g transform="translate(200 150) scale(1.6) translate(-110 -108)">${story.cover()}</g>` + A.confetti());
      text.classList.add('end-card');
      text.innerHTML = '<h2>The End</h2><div class="end-row"></div>';
      const row = text.querySelector('.end-row');
      const mk = (cls, icon, label, fn) => {
        const b = document.createElement('button');
        b.className = 'round ' + cls;
        b.setAttribute('aria-label', label);
        b.innerHTML = icon;
        b.addEventListener('click', e => { e.stopPropagation(); fn(); });
        row.appendChild(b);
      };
      mk('mint', A.icons.replay(), 'Read again', () => { SB.audio.play('page'); goTo(0, -1); });
      mk('sky', A.icons.shelf(), 'Back to the bookshelf', close);
      const nextStory = SB.stories[(SB.stories.indexOf(story) + 1) % SB.stories.length];
      if (nextStory !== story) {
        mk('pink', A.icons.nextBook(), 'Next story: ' + nextStory.title, () => {
          tts.stop();
          story = nextStory;
          stage.style.setProperty('--page-bg', SB.color(story.theme));
          current.story = story;
          goTo(0, 1, true);
        });
      }
      el._spoken = null;
    }
    el.append(art, text);
    return el;
  }

  function renderDots() {
    const total = story.pages.length + 1;
    let h = '';
    for (let i = 0; i < total; i++) h += `<i class="${i === idx ? 'on' : i < idx ? 'done' : ''}"></i>`;
    dotsEl.innerHTML = h;
  }

  function render(dir, instant) {
    const next = buildSheet(idx);
    pagesEl.appendChild(next);
    const old = sheet;
    sheet = next;
    spoken = next._spoken || { text: '', words: [] };
    renderDots();
    prevBtn.disabled = idx === 0;
    voiceBtn.classList.toggle('on', autoRead);
    voiceBtn.setAttribute('aria-pressed', autoRead ? 'true' : 'false');
    voiceBtn.innerHTML = A.icons.voice(autoRead);
    if (old) {
      if (!dir || instant || reduced) {
        old.remove();
      } else {
        const w = pagesEl.clientWidth || 360;
        old.style.pointerEvents = 'none';
        old.animate(
          [{ transform: 'translateX(0) rotate(0deg)', opacity: 1 }, { transform: `translateX(${-dir * w * 0.7}px) rotate(${-dir * 5}deg)`, opacity: 0 }],
          { duration: 360, easing: 'cubic-bezier(.5, 0, .8, .5)', fill: 'forwards' }
        ).onfinish = () => old.remove();
        next.animate(
          [{ transform: `translateX(${dir * w * 0.7}px) rotate(${dir * 5}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(.2, .9, .3, 1)' }
        );
      }
    }
    save();
  }

  function save() {
    const pos = SB.store.get('pos', {}) || {};
    const atEnd = idx >= story.pages.length;
    pos[story.id] = atEnd ? 0 : idx;
    SB.store.set('pos', pos);
    if (atEnd) {
      const done = SB.store.get('done', {}) || {};
      done[story.id] = true;
      SB.store.set('done', done);
    }
  }

  function goTo(i, dir, force) {
    if (!story) return;
    const max = story.pages.length;
    i = clamp(i, 0, max);
    if (i === idx && !force) { if (dir) SB.audio.play('thud'); return; }
    const now = performance.now();
    if (now < turnLock) return;
    turnLock = now + 260;
    tts.stop();
    idx = i;
    SB.audio.play('page');
    render(dir || (i > idx ? 1 : -1));
    if (idx === max) SB.audio.play('fanfare');
    else if (autoRead) readPage(520);
  }

  const go = d => goTo(idx + d, d);

  function readPage(delay) {
    if (spoken.text) tts.speak(spoken.text, spoken.words, delay);
  }

  // ---------- Tapping the picture and the words ----------
  function react(el, x, y, art) {
    const a = el.dataset.a || 'wiggle';
    const cls = 'go-' + a;
    el.classList.remove('go-hop', 'go-wiggle', 'go-spin', 'go-pop', 'go-shake', 'go-float', 'go-splash');
    void el.getBoundingClientRect();
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 950);
    SB.audio.play(el.dataset.s || 'pop');
    if (art) {
      const r = document.createElement('div');
      r.className = 'ripple';
      const b = art.getBoundingClientRect();
      r.style.left = (x - b.left) + 'px';
      r.style.top = (y - b.top) + 'px';
      art.appendChild(r);
      setTimeout(() => r.remove(), 700);
    }
  }

  function onPagesClick(e) {
    if (performance.now() < swipeUntil) return;
    const tp = e.target.closest && e.target.closest('.tp');
    if (tp) { react(tp, e.clientX, e.clientY, tp.closest('.art')); return; }
    const art = e.target.closest && e.target.closest('.art');
    if (art) {
      // a tap on an empty bit of picture still answers with a soft sparkle
      SB.audio.play('tap');
      const r = document.createElement('div');
      r.className = 'ripple';
      const b = art.getBoundingClientRect();
      r.style.left = (e.clientX - b.left) + 'px';
      r.style.top = (e.clientY - b.top) + 'px';
      art.appendChild(r);
      setTimeout(() => r.remove(), 700);
      return;
    }
    const w = e.target.closest && e.target.closest('.w');
    if (w && tts.ok) {
      const i = spoken.words.findIndex(x => x.el === w);
      if (i >= 0) tts.speak(w.textContent.replace(/[^\w’'-]/g, '') || w.textContent, [{ el: w, start: 0, end: w.textContent.length }], 0);
      w.classList.add('on');
    }
  }

  // ---------- Swipe + keys ----------
  function setupGestures() {
    const reader = $('reader');
    let sx = 0, sy = 0, st = 0, tracking = false;
    reader.addEventListener('pointerdown', e => {
      if (e.target.closest && e.target.closest('button')) { tracking = false; return; }
      tracking = true; sx = e.clientX; sy = e.clientY; st = performance.now();
    });
    const end = e => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - st < 900) {
        swipeUntil = performance.now() + 350;
        go(dx < 0 ? 1 : -1);
      }
    };
    reader.addEventListener('pointerup', end);
    reader.addEventListener('pointercancel', () => { tracking = false; });
    pagesEl.addEventListener('click', onPagesClick);
    document.addEventListener('keydown', e => {
      if (!grown.hidden) { if (e.key === 'Escape') grown.hidden = true; return; }
      if (!current) return;
      if (e.key === 'ArrowRight' || e.key === ' ') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') close();
    });
  }

  // ---------- Grown-up area ----------
  let holdTimer = 0;
  function setupGrown() {
    grownBtn.innerHTML = A.icons.grown();
    const start = e => {
      e.preventDefault();
      grownBtn.classList.add('holding');
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => { grownBtn.classList.remove('holding'); openGrown(); }, 3000);
    };
    const cancel = () => { clearTimeout(holdTimer); grownBtn.classList.remove('holding'); };
    grownBtn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => grownBtn.addEventListener(ev, cancel));

    $('grownClose').addEventListener('click', () => { grown.hidden = true; });
    grown.addEventListener('click', e => { if (e.target === grown) grown.hidden = true; });

    $('soundToggle').addEventListener('change', e => {
      SB.store.set('sound', e.target.checked);
      SB.audio.setMuted(!e.target.checked);
      if (e.target.checked) { SB.audio.unlock(); SB.audio.play('chime'); }
    });
    $('autoToggle').addEventListener('change', e => {
      autoRead = e.target.checked;
      SB.store.set('autoRead', autoRead);
    });
    $('speedSeg').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const r = parseFloat(b.dataset.rate);
      tts.setRate(r);
      SB.store.set('rate', r);
      markSpeed();
    });

    const clearBtn = $('clearData');
    let confirmT = 0;
    const reset = () => { clearBtn.classList.remove('confirm'); clearBtn.textContent = 'Reset reading progress'; };
    clearBtn.addEventListener('click', () => {
      if (!clearBtn.classList.contains('confirm')) {
        clearBtn.classList.add('confirm');
        clearBtn.textContent = 'Tap again to reset';
        confirmT = setTimeout(reset, 4000);
        return;
      }
      clearTimeout(confirmT);
      SB.store.clearProgress();
      reset();
      clearBtn.textContent = 'Progress reset ✓';
      setTimeout(reset, 1800);
      buildShelf();
      progressNote();
    });
  }

  function markSpeed() {
    const r = tts.getRate();
    document.querySelectorAll('#speedSeg button').forEach(b => b.classList.toggle('on', Math.abs(parseFloat(b.dataset.rate) - r) < 0.01));
  }
  function progressNote() {
    const done = SB.store.get('done', {}) || {};
    const n = SB.stories.filter(s => done[s.id]).length;
    $('progressNote').textContent = `${n} of ${SB.stories.length} stories finished.`;
  }
  function openGrown() {
    $('soundToggle').checked = !SB.audio.isMuted();
    $('autoToggle').checked = autoRead;
    $('noVoice').hidden = tts.ok;
    $('autoToggle').disabled = !tts.ok;
    markSpeed();
    progressNote();
    grown.hidden = false;
  }

  // ---------- Guard rails: no zoom, menus or selection ----------
  function guardRails() {
    const inGrown = e => e.target && e.target.closest && e.target.closest('.grown-card');
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    document.addEventListener('selectstart', e => { if (!inGrown(e)) e.preventDefault(); });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
      document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
    document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    // Sound needs a user gesture before it can start
    document.addEventListener('pointerdown', () => {
      const c = SB.audio.ctx;
      if (!c || c.state !== 'running') SB.audio.unlock();
    }, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) tts.stop(); });
    window.addEventListener('pagehide', () => tts.stop());
  }

  function boot() {
    home = $('home'); booksEl = $('books'); stage = $('stage'); pagesEl = $('pages'); dotsEl = $('dots');
    homeBtn = $('homeBtn'); voiceBtn = $('voiceBtn'); prevBtn = $('prevBtn'); nextBtn = $('nextBtn');
    grownBtn = $('grownBtn'); grown = $('grown');

    SB.audio.setMuted(!SB.store.get('sound', true));
    autoRead = !!SB.store.get('autoRead', false) && tts.ok;
    tts.setRate(SB.store.get('rate', 0.95));

    homeBtn.innerHTML = A.icons.home();
    prevBtn.innerHTML = A.icons.prev();
    nextBtn.innerHTML = A.icons.next();
    voiceBtn.innerHTML = A.icons.voice(false);
    homeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    voiceBtn.addEventListener('click', () => {
      autoRead = !autoRead;
      SB.store.set('autoRead', autoRead);
      voiceBtn.classList.toggle('on', autoRead);
      voiceBtn.setAttribute('aria-pressed', autoRead ? 'true' : 'false');
      voiceBtn.innerHTML = A.icons.voice(autoRead);
      SB.audio.play(autoRead ? 'up' : 'down');
      if (autoRead) readPage(100); else tts.stop();
    });

    buildFloor();
    buildShelf();
    setupGestures();
    setupGrown();
    guardRails();

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  SB.app = { open: id => { const i = SB.stories.findIndex(s => s.id === id); if (i >= 0) open(SB.stories[i], booksEl.children[i].firstChild); }, close, go, goTo };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
