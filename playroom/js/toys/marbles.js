/* =========================================================
   Toy 6 - Marble Run
   Drag ramps, bells and bouncy pads out of the tray and place
   them anywhere. Tap empty space to drop a marble. Tap a ramp
   to turn it; drag a piece back to the tray to put it away.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEY = 'marbles';
  const TYPES = ['long', 'short', 'bell', 'pad'];
  const MARBLE_COLS = ['coral', 'butter', 'mint', 'sky', 'lilac', 'pink', 'peach', 'teal'];
  const MAX_MARBLES = 50, MAX_PIECES = 24;
  const H_STEP = 1 / 180;

  let root, canvas, ctx, tray, world, raf = 0, last = 0, acc = 0;
  let W = 0, H = 0, U = 30, playLeft = 0, floorY = 0;
  let pieces = [], marbles = [], walls = [];
  const drags = new Map();
  let saveDeb = null, onResize = null;

  const C = n => PR.color(n);

  // ---------- Pieces ----------
  function pieceSize(type) {
    switch (type) {
      case 'long': return { w: U * 3.4, h: U * 0.4 };
      case 'short': return { w: U * 2.1, h: U * 0.4 };
      case 'pad': return { w: U * 1.8, h: U * 0.45 };
      default: return { r: U * 0.55 };
    }
  }

  function makeBody(pc) {
    const P = PR.physics, s = pieceSize(pc.type);
    const b = pc.type === 'bell'
      ? P.circle(pc.x, pc.y, s.r, { isStatic: true, restitution: 0.5, friction: 0.3 })
      : P.box(pc.x, pc.y, s.w, s.h, { isStatic: true, angle: pc.a, restitution: pc.type === 'pad' ? 0.92 : 0.15, friction: pc.type === 'pad' ? 0.4 : 0.25 });
    b.data.kind = 'piece';
    b.data.piece = pc;
    return b;
  }

  function addPiece(type, x, y, a) {
    const pc = { type, x, y, a: a || 0, ring: 0, squish: 0, born: performance.now() };
    pc.body = world.add(makeBody(pc));
    pieces.push(pc);
    return pc;
  }

  function movePiece(pc, x, y, a) {
    pc.x = x; pc.y = y;
    if (a != null) pc.a = a;
    pc.body.x = x; pc.body.y = y; pc.body.a = pc.a;
    pc.body.update();
    world.wakeNear(pc.body, U * 2);
  }

  function removePiece(pc) {
    world.remove(pc.body);
    pieces = pieces.filter(p => p !== pc);
    world.wakeAll();
  }

  function pieceAt(x, y) {
    for (let i = pieces.length - 1; i >= 0; i--) {
      if (pieces[i].body.contains(x, y, U * 0.35)) return pieces[i];
    }
    return null;
  }

  // ---------- Marbles ----------
  function dropMarble(x, y) {
    if (marbles.length >= MAX_MARBLES) {
      const old = marbles.shift();
      world.remove(old);
      world.wakeAll();
    }
    const r = U * 0.32;
    const m = PR.physics.circle(PR.util.clamp(x, playLeft + r, W - r), Math.min(y, floorY - r * 2), r,
      { restitution: 0.35, friction: 0.3, density: 0.002 });
    m.vx = PR.util.rand(-20, 20);
    m.data = { kind: 'marble', col: PR.util.pick(MARBLE_COLS), idx: marbles.length % 5, lastSound: 0, born: performance.now() };
    world.add(m);
    marbles.push(m);
    PR.audio.pop(1.1 + Math.random() * 0.4);
  }

  // ---------- Layout ----------
  function trayRect() {
    // layout offsets (not getBoundingClientRect) so it is right even mid-zoom
    return { x: tray.offsetLeft, y: tray.offsetTop, w: tray.offsetWidth, h: tray.offsetHeight };
  }

  function inTray(x, y) {
    const t = trayRect();
    return x >= t.x - 6 && x <= t.x + t.w + 6 && y >= t.y && y <= t.y + t.h;
  }

  function trayItemAt(y) {
    const t = trayRect();
    return TYPES[PR.util.clamp(Math.floor((y - t.y) / t.h * TYPES.length), 0, TYPES.length - 1)];
  }

  function buildWalls() {
    walls.forEach(w => world.remove(w));
    const P = PR.physics, T = 300;
    walls = [
      P.box(W / 2, floorY + T / 2, W * 2, T, { isStatic: true, friction: 0.5, restitution: 0.2 }),
      P.box(playLeft - T / 2, 0, T, H * 4, { isStatic: true }),
      P.box(W + T / 2, 0, T, H * 4, { isStatic: true })
    ];
    walls.forEach(w => { w.data.kind = 'wall'; world.add(w); });
  }

  function resize() {
    const oldW = W, oldH = H;
    const fit = PR.util.fitCanvas(canvas);
    ctx = fit.ctx; W = fit.w; H = fit.h;
    U = Math.max(22, Math.min(W, H) / 12);
    const t = trayRect();
    playLeft = t.x + t.w + 8;
    floorY = H - Math.max(14, H * 0.035);
    buildWalls();
    if (oldW && (oldW !== W || oldH !== H)) {
      pieces.forEach(pc => {
        world.remove(pc.body);
        pc.x = PR.util.clamp(pc.x * W / oldW, playLeft + U, W - U);
        pc.y = PR.util.clamp(pc.y * H / oldH, U, floorY - U);
        pc.body = world.add(makeBody(pc));
      });
      marbles.forEach(m => { m.x = PR.util.clamp(m.x * W / oldW, playLeft, W); m.y = Math.min(m.y * H / oldH, floorY - 20); m.wake(); });
    }
  }

  // ---------- Input ----------
  function onDown(e) {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = PR.util.local(e, canvas);
    if (inTray(p.x, p.y)) {
      if (pieces.length >= MAX_PIECES) { PR.audio.soft(0.8); return; }
      const type = trayItemAt(p.y);
      const pc = addPiece(type, p.x + U * 2, p.y, type === 'long' || type === 'short' ? 0.2 : 0);
      drags.set(e.pointerId, { pc, ox: U * 2, oy: 0, sx: p.x, sy: p.y, moved: true, fresh: true });
      PR.audio.up();
      return;
    }
    const pc = pieceAt(p.x, p.y);
    if (pc) {
      drags.set(e.pointerId, { pc, ox: pc.x - p.x, oy: pc.y - p.y, sx: p.x, sy: p.y, moved: false });
      pc.lift = 1;
      PR.audio.tap(0.9);
      return;
    }
    if (p.x > playLeft) {
      dropMarble(p.x, p.y);
      PR.fx.ripple(root, p.x, p.y, C('paper'));
    }
  }

  function onMove(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    const p = PR.util.local(e, canvas);
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 10) d.moved = true;
    if (!d.moved) return;
    movePiece(d.pc, PR.util.clamp(p.x + d.ox, 0, W), PR.util.clamp(p.y + d.oy, U * 0.5, floorY - U * 0.4));
    d.pc.lift = 1;
    tray.classList.toggle('hot', inTray(p.x, p.y));
  }

  function onUp(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    const pc = d.pc;
    pc.lift = 0;
    const p = PR.util.local(e, canvas);
    tray.classList.remove('hot');
    if (d.moved && (inTray(p.x, p.y) || pc.x < playLeft)) {
      removePiece(pc);
      PR.audio.down();
    } else if (!d.moved) {
      if (pc.type === 'bell') ring(pc, 1);
      else {
        movePiece(pc, pc.x, pc.y, pc.a + Math.PI / 6);
        pc.squish = 0.6;
        PR.audio.click(0.9);
        PR.audio.boop(3);
      }
    } else {
      PR.audio.soft(1.1);
    }
    saveDeb();
  }

  function ring(pc, strength) {
    pc.ring = Math.min(1, pc.ring + strength);
    const step = Math.round((1 - pc.y / H) * 9);
    PR.audio.bell(PR.audio.freqOf(step, 0), 0.08 + strength * 0.08);
  }

  function onCollide(A, B, speed) {
    const now = performance.now();
    let m = null, other = null;
    if (A.data.kind === 'marble') { m = A; other = B; } else if (B.data.kind === 'marble') { m = B; other = A; }
    if (!m) return;
    const kind = other.data.kind;
    if (kind === 'piece') {
      const pc = other.data.piece;
      if (pc.type === 'bell' && speed > 80) {
        if (now - (pc.lastRing || 0) > 90) { pc.lastRing = now; ring(pc, Math.min(1, speed / 700)); }
        return;
      }
      if (pc.type === 'pad' && speed > 120) {
        pc.squish = Math.min(1, speed / 600);
        if (now - (pc.lastBoing || 0) > 100) { pc.lastBoing = now; PR.audio.boing(); }
        return;
      }
    }
    if (speed > 110 && now - m.data.lastSound > 70) {
      m.data.lastSound = now;
      const vol = Math.min(0.12, speed / 5000);
      if (kind === 'marble') PR.audio.tone(2000 + m.data.idx * 150, { type: 'sine', dur: 0.04, vol: vol * 0.8 });
      else PR.audio.tone(PR.audio.freqOf(m.data.idx + 5), { type: 'triangle', dur: 0.08, vol });
    }
  }

  // ---------- Drawing ----------
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPiece(pc, now) {
    const ink = C('ink');
    const s = pieceSize(pc.type);
    const age = Math.min(1, (now - pc.born) / 250);
    const pop = 1 - Math.pow(1 - age, 3);
    ctx.save();
    ctx.translate(pc.x, pc.y);
    if (pc.lift) {
      ctx.fillStyle = 'rgba(107,88,83,.15)';
      ctx.beginPath(); ctx.ellipse(6, 14, (s.w || s.r * 2) * 0.5, U * 0.25, 0, 0, 7); ctx.fill();
      ctx.scale(1.06, 1.06);
    }
    ctx.scale(pop, pop);
    ctx.lineWidth = Math.max(3, U * 0.1);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    if (pc.type === 'bell') {
      pc.ring *= 0.94;
      const sw = Math.sin(now / 60) * pc.ring * 0.5;
      ctx.rotate(sw);
      const r = s.r;
      ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.moveTo(0, -r * 1.05); ctx.lineTo(0, -r * 1.5); ctx.stroke();
      ctx.fillStyle = C('butter');
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.6);
      ctx.quadraticCurveTo(-r * 0.85, -r * 1.05, 0, -r * 1.05);
      ctx.quadraticCurveTo(r * 0.85, -r * 1.05, r * 0.9, r * 0.6);
      ctx.quadraticCurveTo(r * 1.1, r * 0.8, 0, r * 0.8);
      ctx.quadraticCurveTo(-r * 1.1, r * 0.8, -r * 0.9, r * 0.6);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = C('butter-d');
      ctx.beginPath(); ctx.arc(Math.sin(now / 45) * pc.ring * r * 0.3, r * 0.85, r * 0.22, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.12, r * 0.3, 0.3, 0, 7); ctx.fill();
      if (pc.ring > 0.1) {
        ctx.strokeStyle = `rgba(237,199,90,${pc.ring})`;
        ctx.lineWidth = 3;
        [1.4, 1.8].forEach(k => { ctx.beginPath(); ctx.arc(0, 0, r * k * (1.2 - pc.ring * 0.2), -0.6, 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * k * (1.2 - pc.ring * 0.2), Math.PI - 0.6, Math.PI + 0.6); ctx.stroke(); });
      }
    } else {
      ctx.rotate(pc.a);
      pc.squish *= 0.9;
      const w = s.w, h = s.h;
      if (pc.type === 'pad') {
        const sq = 1 - pc.squish * 0.35;
        // spring
        ctx.strokeStyle = ink;
        ctx.beginPath();
        const sh = U * 0.5 * sq;
        for (let i = 0; i <= 6; i++) ctx.lineTo((i % 2 ? 1 : -1) * w * 0.25, h / 2 + (i / 6) * sh);
        ctx.stroke();
        ctx.fillStyle = C('wood-d');
        roundRect(-w * 0.4, h / 2 + sh, w * 0.8, U * 0.18, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C('coral');
        roundRect(-w / 2, -h / 2 + (1 - sq) * h, w, h, h / 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.translate(0, Math.sin(now / 50) * pc.squish * 4);
        ctx.fillStyle = C('wood');
        roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = C('wood-d');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-w / 2 + h, -h * 0.1); ctx.lineTo(w / 2 - h, -h * 0.1); ctx.stroke();
        ctx.fillStyle = C('wood-d');
        ctx.beginPath(); ctx.arc(-w / 2 + h * 0.5, 0, h * 0.14, 0, 7); ctx.arc(w / 2 - h * 0.5, 0, h * 0.14, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw(now) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C('sky'));
    g.addColorStop(1, C('cream'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // floor tray
    ctx.fillStyle = C('wood');
    ctx.strokeStyle = C('ink');
    ctx.lineWidth = 4;
    roundRect(playLeft - 4, floorY, W - playLeft + 20, H - floorY + 20, 12);
    ctx.fill(); ctx.stroke();

    pieces.forEach(pc => drawPiece(pc, now));

    const ink = C('ink');
    marbles.forEach(m => {
      const r = m.shape.r;
      const age = Math.min(1, (now - m.data.born) / 200);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.scale(age, age);
      ctx.fillStyle = C(m.data.col);
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(2.5, r * 0.18);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.rotate(m.a);
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0.2, 1.8); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.arc(m.x - r * 0.35, m.y - r * 0.35, r * 0.18, 0, 7); ctx.fill();
    });
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    acc += dt;
    let n = 0;
    while (acc >= H_STEP && n < 12) { world.step(H_STEP); acc -= H_STEP; n++; }
    if (n >= 12) acc = 0;
    marbles = marbles.filter(m => {
      if (m.y > H + 100 || m.x < -100 || m.x > W + 100) { world.remove(m); return false; }
      return true;
    });
    draw(t);
  }

  // ---------- Tray ----------
  function trayIcon(type) {
    const ink = C('ink');
    switch (type) {
      case 'long': return `<svg viewBox="0 0 100 100"><rect x="6" y="42" width="88" height="16" rx="8" fill="${C('wood')}" stroke="${ink}" stroke-width="5" transform="rotate(-15 50 50)"/></svg>`;
      case 'short': return `<svg viewBox="0 0 100 100"><rect x="22" y="42" width="56" height="16" rx="8" fill="${C('wood')}" stroke="${ink}" stroke-width="5" transform="rotate(15 50 50)"/></svg>`;
      case 'bell': return `<svg viewBox="0 0 100 100"><path d="M50 18 V28" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M24 68 Q26 28 50 28 Q74 28 76 68 Q80 74 50 74 Q20 74 24 68Z" fill="${C('butter')}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="78" r="7" fill="${C('butter-d')}" stroke="${ink}" stroke-width="4"/></svg>`;
      default: return `<svg viewBox="0 0 100 100"><path d="M36 50 L64 58 L36 66 L64 74" fill="none" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/><rect x="26" y="74" width="48" height="10" rx="4" fill="${C('wood-d')}" stroke="${ink}" stroke-width="4"/><rect x="16" y="36" width="68" height="16" rx="8" fill="${C('coral')}" stroke="${ink}" stroke-width="5"/></svg>`;
    }
  }

  // ---------- State ----------
  function save() {
    if (!world) return;
    PR.store.set(KEY, { pieces: pieces.map(p => ({ t: p.type, x: +(p.x / W).toFixed(4), y: +(p.y / H).toFixed(4), a: +p.a.toFixed(3) })) });
  }

  function restore() {
    const st = PR.store.get(KEY, null);
    if (st && Array.isArray(st.pieces)) {
      st.pieces.slice(0, MAX_PIECES).forEach(o => {
        if (!TYPES.includes(o.t)) return;
        addPiece(o.t, PR.util.clamp((+o.x || 0.5) * W, playLeft + U, W - U), PR.util.clamp((+o.y || 0.5) * H, U, floorY - U), +o.a || 0).born = 0;
      });
      return;
    }
    const pw = W - playLeft;
    const X = f => playLeft + pw * f;
    addPiece('long', X(0.3), H * 0.32, 0.3).born = 0;
    addPiece('long', X(0.62), H * 0.52, -0.3).born = 0;
    addPiece('bell', X(0.36), H * 0.66).born = 0;
    addPiece('short', X(0.42), H * 0.8, 0.35).born = 0;
    addPiece('pad', X(0.8), H * 0.86, 0).born = 0;
  }

  PR.toys.marbles = {
    init(container) {
      root = container;
      const wrap = document.createElement('div');
      wrap.className = 'marbles';
      canvas = document.createElement('canvas');
      canvas.className = 'toy-canvas';
      tray = document.createElement('div');
      tray.className = 'mr-tray';
      tray.innerHTML = TYPES.map(trayIcon).join('');
      wrap.append(canvas, tray);
      root.appendChild(wrap);
      world = new PR.physics.World({ gravity: 1400, iterations: 6, maxSpeed: 1800, wakeSpeed: 30 });
      world.onCollide = onCollide;
      pieces = []; marbles = [];
      resize();
      restore();
      saveDeb = PR.util.debounce(save, 800);
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
      drags.clear();
      pieces = []; marbles = []; walls = [];
      world = null;
      if (canvas && canvas.parentNode) canvas.parentNode.remove();
      root = canvas = ctx = tray = null;
      W = H = 0;
    }
  };
})();
