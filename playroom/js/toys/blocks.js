/* =========================================================
   Toy 1 - Wobbly Blocks
   Blocks with faces that stack, topple and change expression.
   Tap empty space for a new block, drag blocks around.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEY = 'blocks';
  const COLORS = ['pink', 'peach', 'butter', 'mint', 'sky', 'lilac', 'coral', 'teal'];
  const SHAPES = ['square', 'wide', 'tall', 'tri', 'ball', 'long', 'square', 'ball'];
  const MAX = 26;
  const H_STEP = 1 / 120;

  let root, canvas, ctx, world, raf = 0, W = 0, H = 0, U = 40, floorY = 0;
  let walls = [];
  let bg = null;
  let last = 0, acc = 0;
  const grabs = new Map();
  let saveDeb = null;
  let onResize = null;

  // ---------- Block creation ----------
  function makeBlock(shape, color, x, y, angle) {
    const P = PR.physics;
    const o = { angle: angle || 0, restitution: 0.12, friction: 0.7, density: 0.001 };
    let b;
    switch (shape) {
      case 'wide': b = P.box(x, y, U * 2, U, o); b.data.w = U * 2; b.data.h = U; break;
      case 'tall': b = P.box(x, y, U, U * 1.7, o); b.data.w = U; b.data.h = U * 1.7; break;
      case 'long': b = P.box(x, y, U * 3, U * 0.55, o); b.data.w = U * 3; b.data.h = U * 0.55; break;
      case 'tri': {
        const w = U * 1.5, h = U * 1.25;
        b = P.poly(x, y, [[0, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], o);
        b.data.w = w; b.data.h = h;
        break;
      }
      case 'ball': b = P.circle(x, y, U * 0.6, Object.assign(o, { restitution: 0.3, friction: 0.5 })); b.data.w = b.data.h = U * 1.2; break;
      default: b = P.box(x, y, U, U, o); b.data.w = b.data.h = U; shape = 'square';
    }
    Object.assign(b.data, {
      kind: 'block', shape, color,
      born: performance.now(),
      blink: performance.now() + 1500 + Math.random() * 3000,
      oof: 0, squash: 0, lastSound: 0, lastTouch: performance.now(),
      seed: Math.floor(Math.random() * 1000)
    });
    return world.add(b);
  }

  function blocks() { return world.bodies.filter(b => b.data.kind === 'block'); }

  // ---------- Walls ----------
  function buildWalls() {
    walls.forEach(w => world.remove(w));
    const P = PR.physics, T = 400;
    walls = [
      P.box(W / 2, floorY + T / 2, W * 3, T, { isStatic: true, friction: 0.9, restitution: 0.05 }),
      P.box(-T / 2, H / 2 - H, T, H * 4, { isStatic: true }),
      P.box(W + T / 2, H / 2 - H, T, H * 4, { isStatic: true })
    ];
    walls.forEach(w => { w.data.kind = 'wall'; world.add(w); });
  }

  // ---------- Background ----------
  function paintBackground() {
    bg = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    bg.width = canvas.width; bg.height = canvas.height;
    const g = bg.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grad = g.createLinearGradient(0, 0, 0, floorY);
    grad.addColorStop(0, PR.color('cream'));
    grad.addColorStop(1, PR.color('pink'));
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    // soft wall dots
    const r = PR.art.rng(9);
    g.fillStyle = 'rgba(255,255,255,.45)';
    for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * W, r() * floorY, 3 + r() * 6, 0, 7); g.fill(); }
    // wooden floor with a wobbly edge
    g.fillStyle = PR.color('wood');
    g.strokeStyle = PR.color('ink');
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-10, H + 10);
    g.lineTo(-10, floorY);
    for (let x = 0; x <= W + 20; x += 40) g.lineTo(x, floorY + Math.sin(x * 0.05) * 1.5);
    g.lineTo(W + 10, H + 10);
    g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = PR.color('wood-d');
    g.lineWidth = 3;
    for (let x = 60; x < W; x += 140) {
      g.beginPath(); g.moveTo(x, floorY + 14); g.lineTo(x + 10, H); g.stroke();
    }
  }

  // ---------- Resize ----------
  function resize() {
    const oldW = W, oldH = H;
    const fit = PR.util.fitCanvas(canvas);
    ctx = fit.ctx;
    W = fit.w; H = fit.h;
    U = Math.max(34, Math.min(W, H) / 7.5);
    floorY = H - Math.max(40, H * 0.1);
    buildWalls();
    paintBackground();
    if (oldW && (oldW !== W || oldH !== H)) {
      blocks().forEach(b => {
        b.x = PR.util.clamp(b.x * W / oldW, U, W - U);
        b.y = Math.min(b.y * H / oldH, floorY - U);
        b.wake();
      });
    }
  }

  // ---------- State ----------
  function save() {
    if (!world) return;
    const list = blocks().map(b => ({
      s: b.data.shape, c: b.data.color,
      x: +(b.x / W).toFixed(4), y: +(b.y / H).toFixed(4), a: +b.a.toFixed(3)
    }));
    PR.store.set(KEY, { v: 1, blocks: list });
  }

  function restore() {
    const st = PR.store.get(KEY, null);
    if (st && Array.isArray(st.blocks) && st.blocks.length) {
      st.blocks.slice(-MAX).forEach(o => {
        if (!SHAPES.includes(o.s) || !COLORS.includes(o.c)) return;
        const x = PR.util.clamp((+o.x || 0.5) * W, U, W - U);
        const y = Math.min((+o.y || 0.5) * H, floorY - U * 0.6);
        makeBlock(o.s, o.c, x, y, +o.a || 0).data.born = 0;
      });
      return;
    }
    // A friendly starter stack
    const cx = W * 0.5;
    makeBlock('wide', 'butter', cx, floorY - U * 0.5).data.born = 0;
    makeBlock('square', 'mint', cx - U * 0.3, floorY - U * 1.5).data.born = 0;
    makeBlock('tri', 'sky', cx - U * 0.3, floorY - U * 2.7).data.born = 0;
    makeBlock('ball', 'pink', W * 0.25, floorY - U).data.born = 0;
    makeBlock('tall', 'lilac', W * 0.75, floorY - U).data.born = 0;
  }

  // ---------- Input ----------
  function onDown(e) {
    e.preventDefault();
    const p = PR.util.local(e, canvas);
    const b = world.queryPoint(p.x, p.y, 8, x => x.data.kind === 'block');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (b) {
      const l = b.toLocal(p.x, p.y);
      grabs.set(e.pointerId, { b, lx: l.x, ly: l.y, tx: p.x, ty: p.y });
      b.held++;
      b.wake();
      world.wakeNear(b);
      b.data.squash = 1;
      b.data.lastTouch = performance.now();
      PR.audio.up();
    } else {
      // new block appears where the finger is
      const all = blocks();
      if (all.length >= MAX) {
        const old = all.find(x => !x.held);
        if (old) { world.remove(old); world.wakeAll(); }
      }
      const y = Math.min(p.y, floorY - U);
      makeBlock(PR.util.pick(SHAPES), PR.util.pick(COLORS), PR.util.clamp(p.x, U, W - U), y, PR.util.rand(-0.3, 0.3));
      PR.audio.pop(0.8 + Math.random() * 0.6);
      PR.fx.ripple(root, p.x, p.y, PR.color('butter'));
      saveDeb();
    }
  }

  function onMove(e) {
    const g = grabs.get(e.pointerId);
    if (!g) return;
    const p = PR.util.local(e, canvas);
    g.tx = p.x; g.ty = p.y;
  }

  function onUp(e) {
    const g = grabs.get(e.pointerId);
    if (!g) return;
    grabs.delete(e.pointerId);
    g.b.held = Math.max(0, g.b.held - 1);
    PR.audio.soft(1.2);
    saveDeb();
  }

  function applyGrabs() {
    grabs.forEach(g => {
      const b = g.b;
      if (!world.bodies.includes(b)) return;
      const tx = PR.util.clamp(g.tx, 0, W), ty = PR.util.clamp(g.ty, -H, floorY - 2);
      const p = b.toWorld(g.lx, g.ly);
      const rx = p.x - b.x, ry = p.y - b.y;
      const pvx = b.vx - b.w * ry, pvy = b.vy + b.w * rx;
      const dvx = (tx - p.x) * 14 - pvx, dvy = (ty - p.y) * 14 - pvy;
      const k = 1 / (b.im + b.iI * (rx * rx + ry * ry));
      b.impulse(dvx * k * 0.25, dvy * k * 0.25, rx, ry);
      b.vy -= world.gy * H_STEP * 0.9; // mostly cancel gravity while carried
      b.w *= 0.96;
    });
  }

  // ---------- Drawing ----------
  function roundedPoly(c, verts, r) {
    const n = verts.length;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = verts[(i - 1 + n) % n], p1 = verts[i], p2 = verts[(i + 1) % n];
      const d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y), d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const rr = Math.min(r, d1 / 2.2, d2 / 2.2);
      const ax = p1.x + (p0.x - p1.x) / d1 * rr, ay = p1.y + (p0.y - p1.y) / d1 * rr;
      const bx = p1.x + (p2.x - p1.x) / d2 * rr, by = p1.y + (p2.y - p1.y) / d2 * rr;
      if (i === 0) c.moveTo(ax, ay); else c.lineTo(ax, ay);
      c.quadraticCurveTo(p1.x, p1.y, bx, by);
    }
    c.closePath();
  }

  function drawFace(c, b, now, s) {
    const d = b.data;
    const ink = PR.color('ink');
    const speed = Math.hypot(b.vx, b.vy);
    let mood = 'happy';
    if (b.held) mood = 'giggle';
    else if (d.oof > now) mood = 'oof';
    else if (speed > 420 || Math.abs(b.w) > 5) mood = 'wow';
    else if (b.sleeping && now - d.lastTouch > 9000) mood = 'sleepy';

    // eyes look toward motion (in body space)
    const ca = Math.cos(-b.a), sa = Math.sin(-b.a);
    let lx = 0, ly = 0;
    if (speed > 30) { lx = (ca * b.vx - sa * b.vy) / speed; ly = (sa * b.vx + ca * b.vy) / speed; }
    const ex = s * 0.32, ey = -s * 0.12, er = s * 0.11;
    const blinking = now > d.blink && now < d.blink + 140;
    if (now > d.blink + 140) d.blink = now + 2000 + Math.random() * 4000;

    c.fillStyle = ink; c.strokeStyle = ink;
    c.lineCap = 'round'; c.lineWidth = Math.max(2.5, s * 0.08);
    if (mood === 'sleepy' || blinking) {
      [-1, 1].forEach(k => { c.beginPath(); c.arc(k * ex, ey, er * 1.2, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); });
    } else if (mood === 'oof') {
      [-1, 1].forEach(k => {
        c.beginPath();
        c.moveTo(k * ex - er, ey - er); c.lineTo(k * ex + er * 0.6 * k, ey); c.lineTo(k * ex - er, ey + er);
        c.stroke();
      });
    } else if (mood === 'giggle') {
      [-1, 1].forEach(k => { c.beginPath(); c.arc(k * ex, ey + er * 0.6, er * 1.2, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); });
    } else {
      const big = mood === 'wow' ? 1.5 : 1;
      [-1, 1].forEach(k => {
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(k * ex, ey, er * 1.9 * big, 0, 7); c.fill(); c.stroke();
        c.fillStyle = ink;
        c.beginPath(); c.arc(k * ex + lx * er * 0.8, ey + ly * er * 0.8, er * big, 0, 7); c.fill();
      });
    }
    // mouth
    const my = s * 0.22;
    c.beginPath();
    if (mood === 'wow' || mood === 'oof') {
      c.ellipse(0, my, s * 0.1, s * 0.13, 0, 0, 7); c.fill();
    } else if (mood === 'giggle') {
      c.moveTo(-s * 0.2, my - s * 0.04); c.quadraticCurveTo(0, my + s * 0.36, s * 0.2, my - s * 0.04); c.closePath();
      c.fill();
    } else {
      c.moveTo(-s * 0.18, my); c.quadraticCurveTo(0, my + s * 0.2, s * 0.18, my); c.stroke();
    }
    // cheeks
    c.fillStyle = 'rgba(233,138,160,.45)';
    c.beginPath(); c.arc(-s * 0.5, my - s * 0.02, s * 0.1, 0, 7); c.arc(s * 0.5, my - s * 0.02, s * 0.1, 0, 7); c.fill();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    if (bg) ctx.drawImage(bg, 0, 0, W, H);
    const ink = PR.color('ink');
    // soft shadows on the floor
    ctx.fillStyle = 'rgba(107,88,83,.10)';
    blocks().forEach(b => {
      const h = Math.max(0, floorY - b.maxY);
      const k = Math.max(0.2, 1 - h / (H * 0.8));
      ctx.beginPath();
      ctx.ellipse(b.x, floorY + 6, (b.maxX - b.minX) * 0.5 * k, 6 * k, 0, 0, 7);
      ctx.fill();
    });

    blocks().forEach(b => {
      const d = b.data;
      const age = d.born ? Math.min(1, (now - d.born) / 260) : 1;
      const pop = age < 1 ? (1 - Math.pow(1 - age, 3)) * (1 + Math.sin(age * Math.PI) * 0.15) : 1;
      d.squash *= 0.9;
      const sq = d.squash * 0.1;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a);
      ctx.scale(pop * (1 + sq), pop * (1 - sq));
      ctx.fillStyle = PR.color(d.color);
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(3, U * 0.07);
      ctx.lineJoin = 'round';
      if (b.shape.type === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, b.shape.r, 0, 7);
      } else {
        roundedPoly(ctx, b.shape.verts, U * 0.18);
      }
      ctx.fill();
      ctx.stroke();
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath();
      ctx.ellipse(-d.w * 0.22, -d.h * 0.25, U * 0.14, U * 0.07, -0.5, 0, 7);
      ctx.fill();
      // face (triangle faces sit a bit lower)
      if (d.shape === 'tri') ctx.translate(0, d.h * 0.12);
      drawFace(ctx, b, now, Math.min(d.w, d.h) * (d.shape === 'tri' ? 0.5 : 0.62));
      ctx.restore();
    });
  }

  // ---------- Loop ----------
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    acc += dt;
    let n = 0;
    while (acc >= H_STEP && n < 8) {
      applyGrabs();
      world.step(H_STEP);
      acc -= H_STEP;
      n++;
    }
    if (n >= 8) acc = 0;
    // anything that falls off-screen comes back from the top
    blocks().forEach(b => {
      if (b.y > H + 200 || b.x < -200 || b.x > W + 200) { b.x = W / 2; b.y = -U; b.vx = b.vy = 0; b.wake(); }
    });
    draw(t);
  }

  function onCollide(A, B, speed) {
    const now = performance.now();
    [A, B].forEach(b => {
      const d = b.data;
      if (d.kind !== 'block') return;
      d.lastTouch = now;
      if (speed > 200) d.squash = Math.min(1, speed / 900);
      if (speed > 650) d.oof = now + 700;
      if (speed > 140 && now - d.lastSound > 120) {
        d.lastSound = now;
        const size = (d.w * d.h) / (U * U);
        PR.audio.knock(1.6 / Math.sqrt(size));
        if (speed > 500) PR.audio.boop(Math.floor(Math.random() * 5) + 2);
      }
    });
  }

  PR.toys.blocks = {
    init(container) {
      root = container;
      canvas = document.createElement('canvas');
      canvas.className = 'toy-canvas';
      root.appendChild(canvas);
      world = new PR.physics.World({ gravity: 1500, iterations: 10 });
      world.onCollide = onCollide;
      resize();
      restore();
      saveDeb = PR.util.debounce(save, 1500);
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      onResize = () => { if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize(); };
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
      grabs.clear();
      walls = [];
      world = null;
      if (canvas) canvas.remove();
      canvas = ctx = bg = root = null;
      W = H = 0;
    }
  };
})();
