/* =========================================================
   Toy 11 - Spin Wheel
   A big wheel of animal friends. Tap anywhere for a spin, or
   grab the wheel and fling it. The pointer clicks over the pegs,
   the wheel slows down, and the animal it stops on pops out and
   says hello. Every spin is a win.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const TAU = Math.PI * 2;
  // Wedge color + the animal that lives on it
  const WEDGES = [
    { bg: 'pink',   animal: 'cow' },
    { bg: 'mint',   animal: 'pig' },
    { bg: 'butter', animal: 'cat' },
    { bg: 'sky',    animal: 'dog' },
    { bg: 'peach',  animal: 'sheep' },
    { bg: 'lilac',  animal: 'duck' },
    { bg: 'teal',   animal: 'bird' },
    { bg: 'coral',  animal: 'frog' }
  ];
  const SEG = TAU / WEDGES.length;
  const PEGS = WEDGES.length * 2;
  const SOUNDS = { cow: 'moo', pig: 'oink', cat: 'meow', dog: 'woof', sheep: 'baa', duck: 'quack', bird: 'tweet', frog: 'boing' };

  let canvas, ctx, W = 0, H = 0, cx = 0, cy = 0, R = 100, raf = 0, last = 0;
  let angle = 0, omega = 0, spinning = false;
  let flap = 0, lastPeg = 0, tickBudget = 0;
  let drag = null, win = null, bits = [];
  const cleanups = [];

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }
  const C = n => PR.color(n);

  // ---------- Drawing helpers ----------
  function circle(x, y, r, fill, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C('ink'); ctx.stroke(); }
  }
  function ellipse(x, y, rx, ry, fill, lw, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C('ink'); ctx.stroke(); }
  }
  function tri(pts, fill, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.lineTo(pts[4], pts[5]); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (lw) { ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = C('ink'); ctx.stroke(); }
  }
  function eyes(s, y, happy) {
    const k = C('ink');
    if (happy) {
      ctx.lineWidth = s * 0.1; ctx.lineCap = 'round'; ctx.strokeStyle = k;
      ctx.beginPath();
      ctx.arc(-s * 0.35, y + s * 0.04, s * 0.13, Math.PI * 1.1, Math.PI * 1.9);
      ctx.moveTo(s * 0.35 + s * 0.13 * Math.cos(Math.PI * 1.1), y + s * 0.04 + s * 0.13 * Math.sin(Math.PI * 1.1));
      ctx.arc(s * 0.35, y + s * 0.04, s * 0.13, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      circle(-s * 0.35, y, s * 0.11, k); circle(s * 0.35, y, s * 0.11, k);
      circle(-s * 0.31, y - s * 0.04, s * 0.035, '#fff'); circle(s * 0.39, y - s * 0.04, s * 0.035, '#fff');
    }
  }
  function cheeks(s, y) {
    ctx.globalAlpha = 0.45;
    circle(-s * 0.58, y, s * 0.13, C('pink-d')); circle(s * 0.58, y, s * 0.13, C('pink-d'));
    ctx.globalAlpha = 1;
  }
  function smile(s, y, w) {
    ctx.lineWidth = s * 0.08; ctx.lineCap = 'round'; ctx.strokeStyle = C('ink');
    ctx.beginPath(); ctx.moveTo(-s * w, y); ctx.quadraticCurveTo(0, y + s * w * 0.9, s * w, y); ctx.stroke();
  }

  // One animal face, centered on 0,0, about 2*s wide
  function face(kind, s, happy) {
    const lw = Math.max(2, s * 0.08);
    switch (kind) {
      case 'cow':
        tri([-s * 0.55, -s * 0.75, -s * 0.75, -s * 1.15, -s * 0.3, -s * 0.85], C('butter'), lw);
        tri([s * 0.55, -s * 0.75, s * 0.75, -s * 1.15, s * 0.3, -s * 0.85], C('butter'), lw);
        ellipse(-s * 1.0, -s * 0.35, s * 0.36, s * 0.18, C('paper'), lw, -0.4);
        ellipse(s * 1.0, -s * 0.35, s * 0.36, s * 0.18, C('paper'), lw, 0.4);
        circle(0, 0, s * 0.9, C('paper'), lw);
        ellipse(-s * 0.42, -s * 0.45, s * 0.25, s * 0.18, C('ink-soft'), 0, 0.3);
        eyes(s, -s * 0.15, happy);
        ellipse(0, s * 0.45, s * 0.58, s * 0.32, C('pink'), lw);
        circle(-s * 0.2, s * 0.45, s * 0.07, C('ink')); circle(s * 0.2, s * 0.45, s * 0.07, C('ink'));
        break;
      case 'pig':
        tri([-s * 0.75, -s * 0.45, -s * 0.85, -s * 1.05, -s * 0.25, -s * 0.8], C('pink-d'), lw);
        tri([s * 0.75, -s * 0.45, s * 0.85, -s * 1.05, s * 0.25, -s * 0.8], C('pink-d'), lw);
        circle(0, 0, s * 0.92, C('pink'), lw);
        eyes(s, -s * 0.22, happy); cheeks(s, s * 0.2);
        ellipse(0, s * 0.28, s * 0.36, s * 0.25, C('pink-d'), lw);
        circle(-s * 0.13, s * 0.28, s * 0.07, C('ink')); circle(s * 0.13, s * 0.28, s * 0.07, C('ink'));
        break;
      case 'cat':
        tri([-s * 0.8, -s * 0.3, -s * 0.75, -s * 1.15, -s * 0.2, -s * 0.8], C('peach-d'), lw);
        tri([s * 0.8, -s * 0.3, s * 0.75, -s * 1.15, s * 0.2, -s * 0.8], C('peach-d'), lw);
        circle(0, 0, s * 0.9, C('peach'), lw);
        eyes(s, -s * 0.15, happy); cheeks(s, s * 0.22);
        tri([-s * 0.12, s * 0.12, s * 0.12, s * 0.12, 0, s * 0.28], C('pink-d'), 0);
        ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.strokeStyle = C('ink'); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, s * 0.3); ctx.lineTo(-s * 1.05, s * 0.2);
        ctx.moveTo(-s * 0.35, s * 0.4); ctx.lineTo(-s * 1.0, s * 0.5);
        ctx.moveTo(s * 0.35, s * 0.3); ctx.lineTo(s * 1.05, s * 0.2);
        ctx.moveTo(s * 0.35, s * 0.4); ctx.lineTo(s * 1.0, s * 0.5);
        ctx.stroke();
        smile(s, s * 0.4, 0.18);
        break;
      case 'dog':
        circle(0, 0, s * 0.88, C('wood'), lw);
        ellipse(-s * 0.85, s * 0.05, s * 0.28, s * 0.58, C('wood-d'), lw, 0.25);
        ellipse(s * 0.85, s * 0.05, s * 0.28, s * 0.58, C('wood-d'), lw, -0.25);
        ellipse(s * 0.38, -s * 0.2, s * 0.24, s * 0.2, C('paper'), 0);
        eyes(s, -s * 0.18, happy);
        ellipse(0, s * 0.25, s * 0.18, s * 0.13, C('ink'), 0);
        smile(s, s * 0.45, 0.22);
        if (happy) ellipse(0, s * 0.62, s * 0.12, s * 0.16, C('pink-d'), Math.max(1.5, lw * 0.6));
        break;
      case 'sheep':
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU;
          circle(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72, s * 0.36, C('paper'), lw);
        }
        circle(0, 0, s * 0.75, C('paper'));
        ellipse(0, s * 0.08, s * 0.5, s * 0.6, C('cream-2'), lw);
        eyes(s * 0.8, -s * 0.02, happy);
        smile(s, s * 0.35, 0.16);
        break;
      case 'duck':
        circle(0, 0, s * 0.9, C('butter'), lw);
        ctx.fillStyle = C('butter-d');
        ellipse(0, -s * 0.95, s * 0.1, s * 0.2, C('butter-d'), Math.max(1.5, lw * 0.6));
        eyes(s, -s * 0.22, happy); cheeks(s, s * 0.12);
        ellipse(0, s * 0.35, s * 0.5, s * 0.2, C('peach-d'), lw);
        ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.36); ctx.lineTo(s * 0.42, s * 0.36); ctx.stroke();
        break;
      case 'bird':
        tri([-s * 0.1, -s * 0.85, 0, -s * 1.2, s * 0.15, -s * 0.85], C('sky-d'), lw);
        circle(0, 0, s * 0.9, C('sky'), lw);
        ellipse(0, s * 0.35, s * 0.55, s * 0.45, C('paper'), 0);
        eyes(s, -s * 0.2, happy); cheeks(s, s * 0.1);
        tri([-s * 0.18, s * 0.08, s * 0.18, s * 0.08, 0, s * 0.35], C('butter-d'), lw);
        break;
      case 'frog':
        circle(-s * 0.48, -s * 0.62, s * 0.34, C('mint'), lw);
        circle(s * 0.48, -s * 0.62, s * 0.34, C('mint'), lw);
        ellipse(0, s * 0.05, s * 1.0, s * 0.78, C('mint'), lw);
        circle(-s * 0.48, -s * 0.62, s * 0.2, '#fff'); circle(s * 0.48, -s * 0.62, s * 0.2, '#fff');
        ctx.save(); ctx.translate(0, -s * 0.55); eyes(s * 1.35, 0, happy); ctx.restore();
        cheeks(s, s * 0.18);
        smile(s, s * 0.22, 0.5);
        break;
    }
  }

  // ---------- Layout ----------
  function resize() {
    const f = PR.util.fitCanvas(canvas);
    ctx = f.ctx; W = f.w; H = f.h;
    R = Math.max(60, Math.min(W * 0.42, H * 0.4));
    cx = W / 2;
    cy = H * 0.54;
  }

  // ---------- Spinning ----------
  function kick(speed) {
    win = null;
    omega = speed;
    if (!spinning) PR.audio.whoosh();
    spinning = true;
  }

  function wedgeAtPointer() {
    // Pointer sits at the top (-90deg); find which wedge is under it
    let a = (-Math.PI / 2 - angle) % TAU;
    if (a < 0) a += TAU;
    return Math.floor(a / SEG) % WEDGES.length;
  }

  function land() {
    spinning = false;
    omega = 0;
    const i = wedgeAtPointer();
    const w = WEDGES[i];
    win = { i, kind: w.animal, t: 0 };
    const snd = PR.audio[SOUNDS[w.animal]];
    if (snd) snd.call(PR.audio);
    setTimeout(() => { if (win && win.i === i) PR.audio.chime(i % 5); }, 450);
    const n = PR.reduced ? 10 : 34;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, v = PR.util.rand(140, 420) * (R / 260);
      bits.push({
        x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120,
        life: PR.util.rand(0.9, 1.5), r: PR.util.rand(4, 9) * (R / 260) + 2,
        c: PR.util.pick(WEDGES).bg + '-d', spin: Math.random() * TAU
      });
    }
  }

  function pointerAngle(e) {
    const p = PR.util.local(e, canvas);
    return Math.atan2(p.y - cy, p.x - cx);
  }

  function down(e) {
    e.preventDefault();
    PR.audio.unlock();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = PR.util.local(e, canvas);
    const d = Math.hypot(p.x - cx, p.y - cy);
    drag = { id: e.pointerId, onWheel: d < R * 1.1 && d > R * 0.12, a: pointerAngle(e), x: p.x, y: p.y, moved: 0, samples: [], t: performance.now() };
    if (drag.onWheel) { omega = 0; spinning = false; win = null; }
    PR.fx.ripple(canvas.parentNode, e.clientX, e.clientY, C('butter-d'));
  }

  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = PR.util.local(e, canvas);
    drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.x, p.y - drag.y));
    if (!drag.onWheel) return;
    const a = pointerAngle(e);
    let da = a - drag.a;
    if (da > Math.PI) da -= TAU;
    if (da < -Math.PI) da += TAU;
    drag.a = a;
    angle += da;
    const now = performance.now();
    drag.samples.push({ da, t: now });
    while (drag.samples.length && now - drag.samples[0].t > 120) drag.samples.shift();
  }

  function up(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.moved < 12) {
      // A tap: always a lovely big spin (a tap while spinning adds a push)
      kick(Math.min(26, Math.abs(omega) + PR.util.rand(9, 15)) * (omega < 0 ? -1 : 1));
      return;
    }
    if (!d.onWheel) { kick(PR.util.rand(9, 15)); return; }
    const sum = d.samples.reduce((s, x) => s + x.da, 0);
    const span = d.samples.length > 1 ? (d.samples[d.samples.length - 1].t - d.samples[0].t) / 1000 : 0;
    let v = span > 0.01 ? sum / span : 0;
    v = PR.util.clamp(v, -28, 28);
    if (Math.abs(v) < 2.5) v = (v < 0 ? -1 : 1) * PR.util.rand(6, 10); // gentle pushes still spin
    kick(v);
  }

  // ---------- Frame ----------
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;

    if (spinning) {
      angle += omega * dt;
      // Smooth slow-down: proportional drag plus a little constant friction
      const s = Math.sign(omega);
      omega *= Math.exp(-0.55 * dt);
      omega -= s * 0.9 * dt;
      if (Math.sign(omega) !== s || Math.abs(omega) < 0.08) land();
    }

    // Pegs passing the pointer: tick + flap
    const peg = Math.floor(angle / (TAU / PEGS));
    tickBudget = Math.min(1, tickBudget + dt * 28);
    if (peg !== lastPeg) {
      flap = PR.util.clamp((peg > lastPeg ? -1 : 1) * 0.5, -0.5, 0.5);
      if (tickBudget >= 1) { PR.audio.click(PR.util.rand(0.85, 1.1)); tickBudget = 0; }
      lastPeg = peg;
    }
    flap *= Math.exp(-14 * dt);

    draw(dt);
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    const lw = Math.max(3, R * 0.018);

    // Soft shadow
    ctx.globalAlpha = 0.12;
    circle(cx, cy + R * 0.06, R * 1.08, C('ink'));
    ctx.globalAlpha = 1;

    // Rim
    circle(cx, cy, R * 1.08, C('paper'), lw);

    // Wedges
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    WEDGES.forEach((w, i) => {
      const a0 = i * SEG, a1 = a0 + SEG;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath();
      ctx.fillStyle = C(w.bg); ctx.fill();
      ctx.lineWidth = lw; ctx.strokeStyle = C('ink'); ctx.lineJoin = 'round'; ctx.stroke();
      if (win && win.i === i) {
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(win.t * 8);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.globalAlpha = 1;
      }
      const mid = a0 + SEG / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.translate(R * 0.64, 0);
      ctx.rotate(-(angle + mid)); // animals stay upright, like a Ferris wheel
      face(w.animal, R * 0.15, win && win.i === i);
      ctx.restore();
    });
    // Pegs on the rim
    for (let i = 0; i < PEGS; i++) {
      const a = (i / PEGS) * TAU;
      circle(Math.cos(a) * R * 1.04, Math.sin(a) * R * 1.04, R * 0.028, C(i % 2 ? 'butter-d' : 'paper'), Math.max(1.5, lw * 0.6));
    }
    ctx.restore();

    // Hub
    circle(cx, cy, R * 0.15, C('butter'), lw);
    circle(cx - R * 0.04, cy - R * 0.05, R * 0.04, 'rgba(255,255,255,.8)');

    // Pointer (a little flapper at the top)
    ctx.save();
    ctx.translate(cx, cy - R * 1.2);
    ctx.rotate(flap);
    const pw = R * 0.11, ph = R * 0.24;
    ctx.beginPath();
    ctx.moveTo(-pw, 0);
    ctx.quadraticCurveTo(0, -pw * 1.3, pw, 0);
    ctx.lineTo(0, ph);
    ctx.closePath();
    ctx.fillStyle = C('coral'); ctx.fill();
    ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = C('ink'); ctx.stroke();
    circle(0, 0, R * 0.03, C('paper'));
    ctx.restore();

    // Winner pops out big in the middle
    if (win) {
      win.t += dt;
      const k = Math.min(1, win.t / 0.35);
      const bounce = PR.reduced ? 1 : 1 + Math.sin(k * Math.PI) * 0.25;
      const fade = win.t > 3.5 ? Math.max(0, 1 - (win.t - 3.5) / 0.6) : 1;
      if (fade > 0) {
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(cx, cy);
        const s = R * 0.34 * k * bounce;
        circle(0, 0, s * 1.55, C('paper'), lw);
        ctx.rotate(Math.sin(win.t * 6) * 0.08 * (PR.reduced ? 0 : 1));
        face(win.kind, s, true);
        ctx.restore();
      }
    }

    // Confetti
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.life -= dt;
      if (p.life <= 0) { bits.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt; p.vx *= Math.exp(-1.2 * dt);
      p.spin += dt * 6;
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ellipse(p.x, p.y, p.r, p.r * 0.6, C(p.c), 0, p.spin);
    }
    ctx.globalAlpha = 1;
  }

  PR.toys.wheel = {
    init(container) {
      canvas = document.createElement('canvas');
      canvas.className = 'toy-canvas';
      container.appendChild(canvas);
      resize();
      angle = PR.store.get('wheel.angle', Math.random() * TAU) || 0;
      omega = 0; spinning = false; win = null; bits = []; drag = null; flap = 0;
      lastPeg = Math.floor(angle / (TAU / PEGS));
      on(canvas, 'pointerdown', down);
      on(canvas, 'pointermove', move);
      on(canvas, 'pointerup', up);
      on(canvas, 'pointercancel', up);
      on(window, 'resize', resize);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    save() { PR.store.set('wheel.angle', angle % TAU); },
    destroy() {
      cancelAnimationFrame(raf);
      cleanups.splice(0).forEach(f => f());
      if (canvas) canvas.remove();
      bits = []; drag = null; win = null;
    }
  };
})();
