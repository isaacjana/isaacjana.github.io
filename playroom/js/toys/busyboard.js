/* =========================================================
   Toy 5 - Busy Board
   Switches, knobs, sliders, push buttons, a spinner, a little
   door and sliding beads. Every control moves, lights up and
   sings, and everything can be undone.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEY = 'busy';
  const KNOB_STEPS = 8, SLIDER_STEPS = 6, BEADS = 5;
  const BEAD_COLORS = ['coral', 'butter', 'mint', 'sky', 'lilac'];

  let root, wrap, board, raf = 0, last = 0;
  let state = null;
  let saveDeb = null, onResize = null;
  const cleanups = [];
  let spinner = null, beadsCtl = null;

  const C = n => PR.color(n);
  const ink = () => C('ink');

  function defaults() {
    return { sw: [false, false, false], kn: [0, 0], sl: [0, 0], door: false, spin: 0, beads: [0, 0.06, 0.12, 0.18, 0.24] };
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }

  function capture(node, e) { try { node.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }

  function panel(cls) {
    const p = el('div', 'bb-panel' + (cls ? ' ' + cls : ''));
    board.appendChild(p);
    return p;
  }

  // ---------- Switches + bulbs ----------
  function switches(p) {
    const cols = ['coral', 'butter', 'mint'];
    cols.forEach((c, i) => {
      const s = el('div', 'bb-switch', `<div class="bb-bulb"></div><div class="bb-plate"><div class="bb-lever"></div></div>`);
      s.style.setProperty('--c', C(c));
      const set = (v, sound) => {
        state.sw[i] = v;
        s.classList.toggle('on', v);
        if (sound) {
          PR.audio.click();
          if (v) PR.audio.note(5 + i * 2, { type: 'triangle', dur: 0.35 }); else PR.audio.note(i * 2, { dur: 0.25, vol: 0.1 });
        }
      };
      set(!!state.sw[i], false);
      on(s, 'pointerdown', e => { e.preventDefault(); set(!state.sw[i], true); saveDeb(); });
      p.appendChild(s);
    });
  }

  // ---------- Knobs ----------
  function knobs(p) {
    const cols = ['sky', 'pink'];
    cols.forEach((c, i) => {
      const w = el('div', 'bb-knob-wrap');
      let dots = '';
      for (let k = 0; k < KNOB_STEPS; k++) {
        const a = (-135 + k * (270 / (KNOB_STEPS - 1))) * Math.PI / 180;
        dots += `<circle class="kdot" cx="${50 + Math.sin(a) * 46}" cy="${50 - Math.cos(a) * 46}" r="4.5" fill="${C('cream-2')}" stroke="${ink()}" stroke-width="2"/>`;
      }
      let ridges = '';
      for (let k = 0; k < 12; k++) ridges += `<path d="M50 20 v5" transform="rotate(${k * 30} 50 50)" stroke="${ink()}" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>`;
      w.innerHTML = `<svg viewBox="0 0 100 100">${dots}<g class="bb-knob"><circle cx="50" cy="50" r="31" fill="${C(c)}" stroke="${ink()}" stroke-width="4"/>${ridges}
        <circle cx="50" cy="50" r="19" fill="${C('paper')}" stroke="${ink()}" stroke-width="3"/><path d="M50 22 V40" stroke="${ink()}" stroke-width="6" stroke-linecap="round"/></g></svg>`;
      const knob = w.querySelector('.bb-knob');
      const dotEls = w.querySelectorAll('.kdot');
      const set = (lvl, sound) => {
        lvl = PR.util.clamp(lvl, 0, KNOB_STEPS - 1);
        const changed = lvl !== state.kn[i];
        state.kn[i] = lvl;
        knob.style.transform = `rotate(${-135 + lvl * (270 / (KNOB_STEPS - 1))}deg)`;
        dotEls.forEach((d, k) => d.setAttribute('fill', k <= lvl ? C(c + '-d') : C('cream-2')));
        if (sound && changed) { PR.audio.click(1.2); PR.audio.note(lvl + i * 2, { type: 'sine', dur: 0.3, vol: 0.14 }); }
      };
      set(state.kn[i] || 0, false);
      let drag = null;
      const angleOf = e => {
        const r = w.getBoundingClientRect();
        return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      };
      on(w, 'pointerdown', e => {
        e.preventDefault(); capture(w, e);
        drag = { a0: angleOf(e), lvl0: state.kn[i], moved: false, prev: angleOf(e), acc: 0 };
      });
      on(w, 'pointermove', e => {
        if (!drag) return;
        const a = angleOf(e);
        let d = a - drag.prev;
        if (d > 180) d -= 360; if (d < -180) d += 360;
        drag.prev = a;
        drag.acc += d;
        if (Math.abs(drag.acc) > 8) drag.moved = true;
        set(drag.lvl0 + Math.round(drag.acc / (270 / (KNOB_STEPS - 1))), true);
      });
      const up = () => {
        if (!drag) return;
        if (!drag.moved) set(state.kn[i] >= KNOB_STEPS - 1 ? 0 : state.kn[i] + 1, true);
        drag = null;
        saveDeb();
      };
      on(w, 'pointerup', up);
      on(w, 'pointercancel', up);
      p.appendChild(w);
    });
  }

  // ---------- Sliders ----------
  function sliders(p) {
    const cols = ['lilac', 'peach'];
    cols.forEach((c, i) => {
      const s = el('div', 'bb-slider', `<div class="bb-slot"><div class="bb-fill"></div></div><div class="bb-handle"></div>`);
      s.style.setProperty('--c', C(c));
      const fill = s.querySelector('.bb-fill'), handle = s.querySelector('.bb-handle'), slot = s.querySelector('.bb-slot');
      const set = (v, sound) => {
        v = PR.util.clamp(v, 0, SLIDER_STEPS - 1);
        const changed = v !== state.sl[i];
        state.sl[i] = v;
        const f = v / (SLIDER_STEPS - 1);
        fill.style.height = (f * 100) + '%';
        handle.style.top = `calc(${slot.offsetTop + slot.offsetHeight}px - ${f} * ${slot.offsetHeight}px)`;
        if (sound && changed) PR.audio.note(v + (i ? 2 : 0), { type: i ? 'triangle' : 'sine', dur: 0.28, vol: 0.14 });
      };
      s._set = set;
      const fromEvent = e => {
        const r = slot.getBoundingClientRect();
        const f = 1 - (e.clientY - r.top) / r.height;
        return Math.round(PR.util.clamp(f, 0, 1) * (SLIDER_STEPS - 1));
      };
      let dragging = false;
      on(s, 'pointerdown', e => { e.preventDefault(); capture(s, e); dragging = true; PR.audio.tap(); set(fromEvent(e), true); });
      on(s, 'pointermove', e => { if (dragging) set(fromEvent(e), true); });
      const up = () => { if (dragging) { dragging = false; saveDeb(); } };
      on(s, 'pointerup', up);
      on(s, 'pointercancel', up);
      p.appendChild(s);
      requestAnimationFrame(() => set(state.sl[i] || 0, false));
    });
  }

  // ---------- Door with a friend behind it ----------
  function door(p) {
    const w = el('div', 'bb-door-wrap');
    const friends = [
      { skin: 'skin-5', hair: 'hair-1' }, { skin: 'skin-2', hair: 'hair-3' },
      { skin: 'skin-3', hair: 'hair-1' }, { skin: 'skin-1', hair: 'hair-5' }, { skin: 'skin-4', hair: 'hair-2' }
    ];
    let fi = Math.floor(Math.random() * friends.length);
    const friendSvg = f => `<svg viewBox="0 0 100 130"><rect x="4" y="4" width="92" height="122" rx="16" fill="#7C625B"/>
      <g class="bb-friend"><circle cx="50" cy="40" r="28" fill="${C(f.hair)}"/><circle cx="50" cy="62" r="30" fill="${C(f.skin)}" stroke="${ink()}" stroke-width="3.5"/>
      <path d="M22 54 Q24 26 50 28 Q76 26 78 54 Q64 40 50 42 Q36 40 22 54Z" fill="${C(f.hair)}"/>
      ${PR.art.faceSvg(50, 64, 22)}</g></svg>`;
    const back = el('div', '', friendSvg(friends[fi]));
    const d = el('div', 'bb-door', `<svg viewBox="0 0 100 130"><path d="${PR.art.wrect(4, 4, 92, 122, 16, 3)}" fill="${C('sky')}" stroke="${ink()}" stroke-width="5"/>
      <path d="${PR.art.wrect(18, 18, 64, 40, 10, 5)}" fill="none" stroke="${ink()}" stroke-width="3" opacity=".5"/><path d="${PR.art.wrect(18, 70, 64, 40, 10, 6)}" fill="none" stroke="${ink()}" stroke-width="3" opacity=".5"/>
      <circle cx="82" cy="66" r="7" fill="${C('butter')}" stroke="${ink()}" stroke-width="3"/></svg>`);
    w.append(back, d);
    const set = (open, sound) => {
      state.door = open;
      d.classList.toggle('open', open);
      w.classList.toggle('open', open);
      if (sound) {
        PR.audio.creak(open);
        if (open) setTimeout(() => PR.audio.sparkle(), 300);
        else setTimeout(() => {
          // a different friend next time
          fi = (fi + 1) % friends.length;
          back.innerHTML = friendSvg(friends[fi]);
        }, 700);
      }
    };
    set(!!state.door, false);
    on(w, 'pointerdown', e => { e.preventDefault(); set(!state.door, true); saveDeb(); });
    p.appendChild(w);
  }

  // ---------- Push buttons ----------
  function pushButtons(p) {
    const cols = ['pink', 'mint', 'sky'];
    cols.forEach((c, i) => {
      const b = el('button', 'bb-push');
      b.style.setProperty('--c', C(c));
      const down = e => {
        e.preventDefault();
        b.classList.add('down');
        PR.audio.note([0, 2, 4][i], { type: 'triangle', dur: 0.5, vol: 0.18 });
        PR.audio.note([0, 2, 4][i] + 5, { type: 'sine', dur: 0.4, vol: 0.06 });
        const r = b.getBoundingClientRect(), rr = root.getBoundingClientRect();
        PR.fx.ripple(root, r.left + r.width / 2 - rr.left, r.top + r.height / 2 - rr.top, C(c));
      };
      const up = () => b.classList.remove('down');
      on(b, 'pointerdown', down);
      on(b, 'pointerup', up);
      on(b, 'pointerleave', up);
      on(b, 'pointercancel', up);
      p.appendChild(b);
    });
  }

  // ---------- Spinner ----------
  function spinnerCtl(p) {
    const w = el('div', 'bb-spinner');
    const cols = ['pink', 'butter', 'mint', 'sky', 'lilac', 'peach'];
    let segs = '';
    cols.forEach((c, i) => {
      const a0 = (i * 60 - 90) * Math.PI / 180, a1 = ((i + 1) * 60 - 90) * Math.PI / 180;
      segs += `<path d="M50 50 L${50 + Math.cos(a0) * 42} ${50 + Math.sin(a0) * 42} A42 42 0 0 1 ${50 + Math.cos(a1) * 42} ${50 + Math.sin(a1) * 42}Z" fill="${C(c)}" stroke="${ink()}" stroke-width="3" stroke-linejoin="round"/>`;
    });
    w.innerHTML = `<svg viewBox="0 0 100 100"><g class="wheel">${segs}<circle cx="50" cy="50" r="12" fill="${C('paper')}" stroke="${ink()}" stroke-width="3.5"/>${PR.art.faceSvg(50, 51, 6)}</g>
      <path d="M50 12 L43 0 H57Z" fill="${C('coral')}" stroke="${ink()}" stroke-width="3" stroke-linejoin="round"/></svg>`;
    const wheel = w.querySelector('.wheel');
    const sp = { angle: state.spin || 0, vel: 0, drag: null, lastSeg: 0 };
    const angleOf = e => {
      const r = w.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    };
    const render = () => {
      wheel.setAttribute('transform', `rotate(${sp.angle.toFixed(1)} 50 50)`);
      const seg = Math.floor((((sp.angle % 360) + 360) % 360) / 60);
      if (seg !== sp.lastSeg) {
        sp.lastSeg = seg;
        PR.audio.tick(1 + seg * 0.08);
      }
    };
    sp.lastSeg = Math.floor((((sp.angle % 360) + 360) % 360) / 60);
    render();
    on(w, 'pointerdown', e => {
      e.preventDefault(); capture(w, e);
      sp.drag = { prev: angleOf(e), t: e.timeStamp, moved: 0 };
      sp.vel = 0;
    });
    on(w, 'pointermove', e => {
      if (!sp.drag) return;
      const a = angleOf(e);
      let d = a - sp.drag.prev;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      const dt = Math.max(8, e.timeStamp - sp.drag.t);
      sp.vel = sp.vel * 0.5 + (d / dt * 1000) * 0.5;
      sp.drag.prev = a; sp.drag.t = e.timeStamp;
      sp.drag.moved += Math.abs(d);
      sp.angle += d;
      render();
    });
    const up = () => {
      if (!sp.drag) return;
      if (sp.drag.moved < 6) { sp.vel = 540 + Math.random() * 300; PR.audio.whoosh(); }
      sp.drag = null;
    };
    on(w, 'pointerup', up);
    on(w, 'pointercancel', up);
    sp.step = dt => {
      if (sp.drag || Math.abs(sp.vel) < 2) {
        if (!sp.drag && sp.vel !== 0) { sp.vel = 0; state.spin = sp.angle % 360; saveDeb(); }
        return;
      }
      sp.angle += sp.vel * dt;
      sp.vel *= Math.pow(0.45, dt);
      sp.vel = PR.util.clamp(sp.vel, -1800, 1800);
      render();
    };
    p.appendChild(w);
    return sp;
  }

  // ---------- Beads ----------
  function beads(p) {
    const w = el('div', 'bb-beads', '<div class="bb-rod"></div>');
    const els = BEAD_COLORS.map(c => {
      const b = el('div', 'bb-bead');
      b.style.setProperty('--c', C(c));
      w.appendChild(b);
      return b;
    });
    const ctl = { pos: [], touching: [] };
    const geom = () => {
      const W = w.clientWidth, bw = els[0].offsetWidth || 40;
      return { left: W * 0.04, right: W * 0.96, bw };
    };
    const layout = () => {
      const g = geom();
      const span = g.right - g.left - BEADS * g.bw;
      ctl.pos = state.beads.map(f => g.left + f * span);
      fix(-1, g);
      render(g);
    };
    const fix = (i, g) => {
      for (let j = 0; j < BEADS; j++) ctl.pos[j] = PR.util.clamp(ctl.pos[j], g.left + j * g.bw, g.right - (BEADS - j) * g.bw);
      for (let j = Math.max(1, i + 1); j < BEADS; j++) ctl.pos[j] = Math.max(ctl.pos[j], ctl.pos[j - 1] + g.bw);
      for (let j = (i < 0 ? BEADS - 2 : i - 1); j >= 0; j--) ctl.pos[j] = Math.min(ctl.pos[j], ctl.pos[j + 1] - g.bw);
    };
    const render = g => {
      els.forEach((b, j) => { b.style.left = ctl.pos[j] + 'px'; });
      const span = Math.max(1, g.right - g.left - BEADS * g.bw);
      state.beads = ctl.pos.map((x, j) => +((x - g.left - j * g.bw) / span).toFixed(4));
      // clack when beads meet (or reach the ends)
      for (let j = 0; j <= BEADS; j++) {
        const gap = j === 0 ? ctl.pos[0] - g.left : j === BEADS ? g.right - (ctl.pos[BEADS - 1] + g.bw) : ctl.pos[j] - (ctl.pos[j - 1] + g.bw);
        const t = gap < 1;
        if (t && ctl.touching[j] === false) PR.audio.clack(0.8 + j * 0.1);
        ctl.touching[j] = t;
      }
    };
    let drag = null;
    on(w, 'pointerdown', e => {
      const b = e.target.closest('.bb-bead');
      if (!b) return;
      e.preventDefault(); capture(w, e);
      const i = els.indexOf(b);
      drag = { i, off: e.clientX - b.getBoundingClientRect().left };
      b.style.transform = 'scale(1.08)';
      PR.audio.tap(1 + i * 0.1);
    });
    on(w, 'pointermove', e => {
      if (!drag) return;
      const g = geom();
      const r = w.getBoundingClientRect();
      ctl.pos[drag.i] = e.clientX - r.left - drag.off;
      fix(drag.i, g);
      render(g);
    });
    const up = () => {
      if (!drag) return;
      els[drag.i].style.transform = '';
      drag = null;
      saveDeb();
    };
    on(w, 'pointerup', up);
    on(w, 'pointercancel', up);
    p.appendChild(w);
    ctl.layout = layout;
    requestAnimationFrame(layout);
    return ctl;
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (spinner) spinner.step(dt);
  }

  function save() {
    if (!state) return;
    if (spinner) state.spin = +(spinner.angle % 360).toFixed(1);
    PR.store.set(KEY, state);
  }

  function loadState() {
    const d = defaults();
    const st = PR.store.get(KEY, null);
    if (!st || typeof st !== 'object') return d;
    const arr = (a, n, f) => Array.isArray(a) && a.length === n ? a.map(f) : null;
    return {
      sw: arr(st.sw, 3, v => !!v) || d.sw,
      kn: arr(st.kn, 2, v => PR.util.clamp(Math.round(+v || 0), 0, KNOB_STEPS - 1)) || d.kn,
      sl: arr(st.sl, 2, v => PR.util.clamp(Math.round(+v || 0), 0, SLIDER_STEPS - 1)) || d.sl,
      door: !!st.door,
      spin: +st.spin || 0,
      beads: arr(st.beads, BEADS, v => PR.util.clamp(+v || 0, 0, 1)) || d.beads
    };
  }

  PR.toys.busyboard = {
    init(container) {
      root = container;
      state = loadState();
      saveDeb = PR.util.debounce(save, 700);
      wrap = el('div', 'busy');
      board = el('div', 'busy-board');
      wrap.appendChild(board);
      root.appendChild(wrap);
      switches(panel());
      knobs(panel());
      sliders(panel());
      door(panel());
      pushButtons(panel());
      spinner = spinnerCtl(panel());
      beadsCtl = beads(panel('bb-wide'));
      onResize = () => {
        if (beadsCtl) beadsCtl.layout();
        board.querySelectorAll('.bb-slider').forEach((s, i) => s._set && s._set(state.sl[i], false));
      };
      window.addEventListener('resize', onResize);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    save,
    destroy() {
      cancelAnimationFrame(raf);
      if (saveDeb) saveDeb.cancel();
      save();
      window.removeEventListener('resize', onResize);
      cleanups.splice(0).forEach(fn => fn());
      if (wrap) wrap.remove();
      root = wrap = board = spinner = beadsCtl = null;
    }
  };
})();
