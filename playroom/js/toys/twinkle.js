/* =========================================================
   Toy 8 - Twinkle (for babies)
   A dark, calm sky. Touch or swipe to leave glowing stars
   and soft notes. A lullaby chime plays now and then.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const GLOW = ['butter', 'pink', 'sky', 'mint', 'lilac'];
  const LULLABY = [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0];

  let canvas, ctx, W = 0, H = 0, raf = 0, last = 0;
  let stars = [], idle = [], lastNote = null, ci = 0, chimeT = 4, hue = 0;
  const cleanups = [];
  let pointers = {};

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }

  function burst(x, y, n, speed) {
    hue = (hue + 1) % GLOW.length;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = Math.random() * speed;
      stars.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: PR.util.rand(6, 16), life: PR.util.rand(1.4, 2.6), max: 2.6, c: GLOW[(hue + i) % GLOW.length], rot: Math.random() * 6.28 });
    }
  }

  function noteAt(x, y) {
    const step = Math.floor((1 - PR.util.clamp(y / H, 0, 0.999)) * 8);
    if (step === lastNote) return;
    lastNote = step;
    PR.audio.note(step, { type: 'sine', dur: 0.7, vol: 0.12 });
  }

  function down(e) {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = PR.util.local(e, canvas);
    pointers[e.pointerId] = p;
    lastNote = null;
    noteAt(p.x, p.y);
    burst(p.x, p.y, 10, 120);
  }
  function move(e) {
    const q = pointers[e.pointerId];
    if (!q) return;
    const p = PR.util.local(e, canvas);
    if (Math.hypot(p.x - q.x, p.y - q.y) > 26) {
      burst(p.x, p.y, 2, 40);
      noteAt(p.x, p.y);
      pointers[e.pointerId] = p;
    }
  }
  function up(e) { delete pointers[e.pointerId]; }

  function star(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = rot + (i / 10) * 6.28;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function resize() {
    const f = PR.util.fitCanvas(canvas);
    ctx = f.ctx; W = f.w; H = f.h;
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    chimeT -= dt;
    if (chimeT <= 0) {
      const s = LULLABY[ci++ % LULLABY.length];
      PR.audio.chime(s);
      burst(PR.util.rand(W * 0.1, W * 0.9), PR.util.rand(H * 0.15, H * 0.8), 4, 20);
      chimeT = ci % LULLABY.length === 0 ? 7 : 1.6;
    }
    ctx.fillStyle = '#262B52';
    ctx.fillRect(0, 0, W, H);
    idle.forEach(s => {
      s.ph += dt;
      s.x += s.vx * dt; if (s.x > W + 10) s.x = -10;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(s.ph * 1.5);
      ctx.fillStyle = '#FFF4C9';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    });
    ctx.globalAlpha = 1;
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.life -= dt;
      if (s.life <= 0) { stars.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.vx *= 0.985; s.vy *= 0.985;
      s.rot += dt * 0.6;
      const a = Math.min(1, s.life / 1.2);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = PR.color(s.c);
      star(s.x, s.y, s.r * (0.6 + 0.4 * a), s.rot);
      ctx.fill();
      ctx.globalAlpha = a * 0.12;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.2, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  PR.toys.twinkle = {
    init(container) {
      canvas = document.createElement('canvas');
      canvas.className = 'toy-canvas';
      container.appendChild(canvas);
      resize();
      stars = []; pointers = {}; ci = 0; chimeT = 2;
      idle = [];
      for (let i = 0; i < 40; i++) idle.push({ x: Math.random() * W, y: Math.random() * H, r: PR.util.rand(1.5, 4), vx: PR.reduced ? 0 : PR.util.rand(2, 10), ph: Math.random() * 6 });
      on(canvas, 'pointerdown', down);
      on(canvas, 'pointermove', move);
      on(canvas, 'pointerup', up);
      on(canvas, 'pointercancel', up);
      on(window, 'resize', resize);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    save() {},
    destroy() {
      cancelAnimationFrame(raf);
      cleanups.splice(0).forEach(f => f());
      if (canvas) canvas.remove();
      stars = []; idle = [];
    }
  };
})();
