/* =========================================================
   Toy 7 - Bubbles (for babies)
   Big soft bubbles drift upward. Touch anywhere to pop the
   nearest one. Nothing can go wrong and it never runs out.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const COLORS = ['pink', 'sky', 'mint', 'butter', 'lilac', 'peach'];
  const MAX = 11;

  let canvas, ctx, W = 0, H = 0, raf = 0, last = 0, spawnT = 0;
  let bubbles = [], bits = [];
  const cleanups = [];

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }

  function spawn(x, y) {
    const base = Math.min(W, H);
    const r = base * PR.util.rand(0.09, 0.17);
    bubbles.push({
      x: x == null ? PR.util.rand(r, W - r) : x,
      y: y == null ? H + r : y,
      r, vy: PR.util.rand(14, 30) * (base / 400),
      ph: Math.random() * 6.28, sway: PR.util.rand(8, 22),
      c: PR.util.pick(COLORS), age: 0
    });
  }

  function pop(b) {
    bubbles.splice(bubbles.indexOf(b), 1);
    PR.audio.pop(PR.util.clamp(1.6 - b.r / (Math.min(W, H) * 0.2), 0.6, 1.5));
    const n = PR.reduced ? 5 : 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28;
      bits.push({ x: b.x, y: b.y, vx: Math.cos(a) * PR.util.rand(60, 160), vy: Math.sin(a) * PR.util.rand(60, 160), life: 0.6, c: b.c });
    }
  }

  function down(e) {
    e.preventDefault();
    const p = PR.util.local(e, canvas);
    let best = null, bd = 1e9;
    bubbles.forEach(b => {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < b.r * 1.5 && d < bd) { bd = d; best = b; }
    });
    if (best) pop(best);
    else { spawn(p.x, p.y); PR.audio.soft(1.3); PR.fx.ripple(canvas.parentNode, e.clientX, e.clientY, PR.color('sky-d')); }
  }

  function resize() {
    const f = PR.util.fitCanvas(canvas);
    ctx = f.ctx; W = f.w; H = f.h;
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    spawnT -= dt;
    if (spawnT <= 0 && bubbles.length < MAX) { spawn(); spawnT = PR.util.rand(0.5, 1.1); }

    ctx.clearRect(0, 0, W, H);
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.age += dt;
      b.y -= b.vy * dt;
      b.x += Math.sin(b.age * 1.2 + b.ph) * b.sway * dt;
      if (b.y < -b.r) { bubbles.splice(i, 1); continue; }
      const grow = Math.min(1, b.age * 3);
      const r = b.r * (0.6 + 0.4 * grow);
      const g = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r);
      g.addColorStop(0, 'rgba(255,255,255,.9)');
      g.addColorStop(0.5, PR.color(b.c));
      g.addColorStop(1, PR.color(b.c + '-d'));
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4; ctx.strokeStyle = PR.color('ink');
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.ellipse(b.x - r * 0.38, b.y - r * 0.4, r * 0.18, r * 0.1, -0.7, 0, 6.28); ctx.fill();
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.life -= dt;
      if (p.life <= 0) { bits.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = PR.color(p.c + '-d');
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  PR.toys.bubbles = {
    init(container) {
      canvas = document.createElement('canvas');
      canvas.className = 'toy-canvas';
      container.appendChild(canvas);
      resize();
      bubbles = []; bits = []; spawnT = 0;
      for (let i = 0; i < 5; i++) { spawn(); bubbles[i].y = PR.util.rand(H * 0.2, H * 0.9); bubbles[i].age = 1; }
      on(canvas, 'pointerdown', down);
      on(window, 'resize', resize);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    save() {},
    destroy() {
      cancelAnimationFrame(raf);
      cleanups.splice(0).forEach(f => f());
      if (canvas) canvas.remove();
      bubbles = []; bits = [];
    }
  };
})();
