/* =========================================================
   Playroom - app.js
   Core helpers, navigation (floor <-> toy), home button,
   state saving, grown-up area and PWA registration.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  // ---------- Storage (every call is wrapped) ----------
  const PREFIX = 'playroom.';
  PR.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    },
    clearAll() {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
      } catch (e) { /* ignore */ }
    }
  };

  // ---------- Small utilities ----------
  PR.reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

  PR.util = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    rand: (a, b) => a + Math.random() * (b - a),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    // Size a canvas to its CSS box at device resolution (max 2x)
    fitCanvas(canvas) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h, dpr, ctx };
    },
    // Pointer position relative to an element
    local(e, el) {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    },
    debounce(fn, ms) {
      let t = 0;
      const d = function () { clearTimeout(t); t = setTimeout(fn, ms); };
      d.flush = () => { clearTimeout(t); fn(); };
      d.cancel = () => clearTimeout(t);
      return d;
    },
    svg(markup) {
      const t = document.createElement('template');
      t.innerHTML = markup.trim();
      return t.content.firstChild;
    }
  };

  // Shared touch feedback: an expanding soft ring
  PR.fx = {
    ripple(container, x, y, color) {
      if (!container) return;
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      if (color) r.style.setProperty('--rc', color);
      container.appendChild(r);
      setTimeout(() => r.remove(), 700);
    }
  };

  // ---------- The toys on the floor ----------
  const TOYS = [
    { id: 'blocks',  bg: 'pink',  x: 14, y: 24, rot: -6, bob: 5.2 },
    { id: 'doodle',  bg: 'lilac', x: 38, y: 21, rot: 4,  bob: 6.1 },
    { id: 'blobs',   bg: 'mint',  x: 62, y: 25, rot: -3, bob: 5.6 },
    { id: 'bubbles', bg: 'sky',   x: 86, y: 22, rot: 5,  bob: 6.0 },
    { id: 'animals', bg: 'butter', x: 26, y: 50, rot: 3, bob: 5.4 },
    { id: 'town',    bg: 'sky',   x: 50, y: 52, rot: -4, bob: 6.4 },
    { id: 'busy',    bg: 'peach', x: 74, y: 49, rot: 5,  bob: 5.0, toy: 'busyboard' },
    { id: 'marbles', bg: 'teal',  x: 20, y: 78, rot: -3, bob: 5.8 },
    { id: 'twinkle', bg: 'night', x: 50, y: 80, rot: 4,  bob: 6.6 },
    { id: 'piano',   bg: 'coral', x: 80, y: 77, rot: -5, bob: 5.3 }
  ];

  const $ = id => document.getElementById(id);
  let home, tilesEl, stage, toyEl, homeBtn, grownBtn, grown;
  let current = null;
  let busy = false;

  function buildFloor() {
    $('floorArt').innerHTML = PR.art.floor(1600, 900);
    TOYS.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'tile';
      b.setAttribute('aria-label', t.id);
      b.style.left = t.x + '%';
      b.style.top = t.y + '%';
      b.style.setProperty('--rot', t.rot + 'deg');
      b.style.setProperty('--bob', t.bob + 's');
      b.style.setProperty('--delay', (-i * 0.9) + 's');
      b.style.setProperty('--tile', 'min(24vmin, 19vw)');
      const inner = document.createElement('div');
      inner.className = 'tile-inner';
      inner.innerHTML = PR.art.tiles[t.id]();
      b.appendChild(inner);
      b.addEventListener('pointerdown', () => {
        b.classList.add('press');
        PR.audio.tap(1 + i * 0.12);
      });
      const unpress = () => b.classList.remove('press');
      b.addEventListener('pointerup', unpress);
      b.addEventListener('pointerleave', unpress);
      b.addEventListener('pointercancel', unpress);
      b.addEventListener('click', () => open(t, b));
      tilesEl.appendChild(b);
    });
  }

  function goFullscreen() {
    try {
      const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
      if (standalone || document.fullscreenElement || document.webkitFullscreenElement) return lockLandscape();
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!req) return;
      const p = req.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(lockLandscape).catch(() => {});
    } catch (e) { /* ignore */ }
  }
  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) { /* ignore */ }
  }

  function tileTransform(tileEl) {
    const r = tileEl.getBoundingClientRect();
    const sx = r.width / window.innerWidth, sy = r.height / window.innerHeight;
    return `translate(${r.left}px, ${r.top}px) scale(${sx}, ${sy})`;
  }

  function open(t, tileEl) {
    if (current || busy) return;
    const toy = PR.toys[t.toy || t.id];
    if (!toy) return;
    busy = true;
    PR.audio.unlock();
    PR.audio.sparkle();
    goFullscreen();

    stage.style.setProperty('--toy-bg', PR.color(t.bg));
    stage.classList.remove('anim');
    stage.style.transform = tileTransform(tileEl);
    stage.style.borderRadius = '45%';
    stage.style.pointerEvents = 'none';
    stage.hidden = false;
    toyEl.style.transition = 'none';
    toyEl.style.opacity = '0';
    current = { t, toy, tileEl };
    try { toy.init(toyEl); } catch (e) { console.error(e); }

    void stage.offsetWidth; // reflow so the transition runs
    stage.classList.add('anim');
    stage.style.transform = 'none';
    stage.style.borderRadius = '0';
    toyEl.style.transition = 'opacity 300ms ease 200ms';
    toyEl.style.opacity = '1';
    home.classList.add('dim');
    document.body.classList.add('in-toy');

    setTimeout(() => {
      stage.style.pointerEvents = '';
      stage.classList.remove('anim');
      homeBtn.hidden = false;
      busy = false;
      // Toys may want a re-measure once the zoom has finished
      window.dispatchEvent(new Event('resize'));
    }, PR.reduced ? 30 : 540);
  }

  function saveCurrent() {
    if (current && current.toy.save) {
      try { current.toy.save(); } catch (e) { /* ignore */ }
    }
  }

  function close() {
    if (!current || busy) return;
    busy = true;
    PR.audio.down();
    saveCurrent();
    homeBtn.hidden = true;
    stage.style.pointerEvents = 'none';
    const c = current;
    stage.classList.add('anim');
    stage.style.transform = tileTransform(c.tileEl);
    stage.style.borderRadius = '45%';
    toyEl.style.transition = 'opacity 200ms ease';
    toyEl.style.opacity = '0';
    home.classList.remove('dim');
    document.body.classList.remove('in-toy');

    setTimeout(() => {
      try { c.toy.destroy(); } catch (e) { console.error(e); }
      toyEl.innerHTML = '';
      stage.hidden = true;
      stage.classList.remove('anim');
      current = null;
      busy = false;
    }, PR.reduced ? 30 : 540);
  }

  // ---------- Grown-up area ----------
  let holdTimer = 0;
  function setupGrown() {
    grownBtn.innerHTML = PR.art.icons.grown();
    const start = e => {
      e.preventDefault();
      grownBtn.classList.add('holding');
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        grownBtn.classList.remove('holding');
        openGrown();
      }, 3000);
    };
    const cancel = () => { clearTimeout(holdTimer); grownBtn.classList.remove('holding'); };
    grownBtn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => grownBtn.addEventListener(ev, cancel));

    $('grownClose').addEventListener('click', () => { grown.hidden = true; });
    grown.addEventListener('click', e => { if (e.target === grown) grown.hidden = true; });

    const toggle = $('soundToggle');
    toggle.addEventListener('change', () => {
      PR.store.set('muted', !toggle.checked);
      PR.audio.setMuted(!toggle.checked);
      if (toggle.checked) { PR.audio.unlock(); PR.audio.chime(2); }
    });

    const clearBtn = $('clearData');
    let confirmT = 0;
    clearBtn.addEventListener('click', () => {
      if (!clearBtn.classList.contains('confirm')) {
        clearBtn.classList.add('confirm');
        clearBtn.textContent = 'Tap again to erase everything';
        confirmT = setTimeout(resetClear, 4000);
        return;
      }
      clearTimeout(confirmT);
      const muted = PR.audio.isMuted();
      PR.store.clearAll();
      PR.store.set('muted', muted);
      resetClear();
      clearBtn.textContent = 'All cleared ✓';
      setTimeout(resetClear, 1800);
      renderGallery();
    });
    function resetClear() {
      clearBtn.classList.remove('confirm');
      clearBtn.textContent = 'Clear all toys & drawings';
    }
  }

  function openGrown() {
    $('soundToggle').checked = !PR.audio.isMuted();
    renderGallery();
    grown.hidden = false;
  }

  function renderGallery() {
    const wrap = $('gallery');
    const items = PR.store.get('doodle.gallery', []) || [];
    wrap.innerHTML = '';
    $('galleryEmpty').hidden = items.length > 0;
    items.slice().reverse().forEach(item => {
      const d = new Date(item.t || Date.now());
      const card = document.createElement('div');
      card.className = 'g-item';
      const img = document.createElement('img');
      img.src = item.png;
      img.alt = 'Drawing from ' + d.toLocaleString();
      const actions = document.createElement('div');
      actions.className = 'g-actions';
      const a = document.createElement('a');
      a.className = 'g-btn small';
      a.href = item.png;
      a.download = 'drawing-' + d.toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png';
      a.textContent = 'Download';
      const del = document.createElement('button');
      del.className = 'g-btn small g-danger';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        const list = (PR.store.get('doodle.gallery', []) || []).filter(x => x.id !== item.id);
        PR.store.set('doodle.gallery', list);
        renderGallery();
      });
      actions.append(a, del);
      card.append(img, actions);
      wrap.appendChild(card);
    });
  }

  // ---------- Guard rails: no zoom, scroll, menus or selection ----------
  function guardRails() {
    const inGrown = e => e.target && e.target.closest && e.target.closest('.grown-card');
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    document.addEventListener('selectstart', e => { if (!inGrown(e)) e.preventDefault(); });
    document.addEventListener('touchmove', e => { if (!inGrown(e)) e.preventDefault(); }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
      document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
    document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { if (!grown.hidden) grown.hidden = true; else close(); }
    });
    // Sound needs a user gesture before it can start
    document.addEventListener('pointerdown', () => {
      const c = PR.audio.ctx;
      if (!c || c.state !== 'running') PR.audio.unlock();
    }, true);
    // Save whenever the app is hidden or closed
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveCurrent(); });
    window.addEventListener('pagehide', saveCurrent);
  }

  function boot() {
    home = $('home'); tilesEl = $('tiles'); stage = $('stage'); toyEl = $('toy');
    homeBtn = $('homeBtn'); grownBtn = $('grownBtn'); grown = $('grown');

    PR.audio.setMuted(PR.store.get('muted', false));
    homeBtn.innerHTML = PR.art.icons.home();
    homeBtn.addEventListener('click', close);
    buildFloor();
    setupGrown();
    guardRails();

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  PR.app = { open: id => { const t = TOYS.find(x => x.id === id); const el = tilesEl.children[TOYS.indexOf(t)]; if (t) open(t, el); }, close };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
